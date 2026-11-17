
const crypto = require("node:crypto");

function registerDirectMessageRoutes(app, getPool, authenticateUser) {
  // Anyone can message another registered member, including non-friends.
    async function requireMember(req, res, next) {
    const friendId = req.params.friendId;
    const userId = String(req.userId);

    if (
        !/^[1-9]\d*$/.test(friendId) ||
        BigInt(friendId) > 9223372036854775807n ||
        BigInt(friendId) === BigInt(userId)
    ) {
    return res.status(400).json({
        error: "Invalid friend selected.",
        });
    }

    try {
    const low =
        BigInt(userId) < BigInt(friendId) ? userId : friendId;
    const high =
        BigInt(userId) < BigInt(friendId) ? friendId : userId;

    const [friends] = await getPool().execute(
        `SELECT u1.id
        FROM app_users u1, app_users u2
        WHERE u1.id = ? AND u2.id = ?
        AND u1.role = 'user' AND u2.role = 'user'
        LIMIT 1`,
        [low, high]
    );

    if (friends.length === 0) {
        return res.status(403).json({
            error: "Member unavailable.",
        });
    }

    req.friendId = friendId;
    next();
    } catch (error) {
    console.error("Friendship verification failed:", error);

    return res.status(500).json({
        error: "Unable to verify friendship.",
    });
    }
  }

  // Friends appear immediately; non-friends appear after the first message.
  app.get('/api/dms', authenticateUser, async (req, res) => {
    try {
      const [rows] = await getPool().execute(
        `SELECT u.id, u.name, f.status = 'accepted' AS is_friend,
                m.content AS last_message, m.sender_id AS last_sender_id, m.created_at AS last_message_at
         FROM app_users u
         LEFT JOIN friend_requests f ON f.user_low = LEAST(u.id, ?) AND f.user_high = GREATEST(u.id, ?)
         LEFT JOIN direct_messages m ON m.id = (
           SELECT dm.id FROM direct_messages dm
           WHERE (dm.sender_id = ? AND dm.receiver_id = u.id)
              OR (dm.receiver_id = ? AND dm.sender_id = u.id)
           ORDER BY dm.created_at DESC, dm.id DESC LIMIT 1)
         WHERE u.id <> ? AND u.role = 'user'
           AND EXISTS (SELECT 1 FROM app_users me WHERE me.id = ? AND me.role = 'user')
           AND (f.status = 'accepted' OR m.id IS NOT NULL)
         ORDER BY m.created_at DESC, m.id DESC, u.name ASC, u.id ASC`,
        Array(6).fill(req.userId));
      res.json({conversations: rows.map(row => ({
        id: String(row.id), name: row.name, isFriend: !!row.is_friend,
        lastMessage: row.last_message,
        lastSenderId: row.last_sender_id == null ? null : String(row.last_sender_id),
        lastMessageAt: row.last_message_at,
      }))});
    } catch (error) {
      console.error('DM inbox failed:', error);
      res.status(500).json({error: 'Unable to load conversations.'});
    }
  });

  // Get all accepted friends available for direct messaging.
app.get(
    "/api/dms/friends",
    authenticateUser,
    async (req, res) => {
    try {
        const [friends] = await getPool().execute(
            `SELECT u.id, u.name, u.bio
            FROM friend_requests f
            JOIN app_users u
            ON u.id = CASE
            WHEN f.user_low = ? THEN f.user_high
            ELSE f.user_low
            END
            WHERE (f.user_low = ? OR f.user_high = ?)
            AND f.status = 'accepted'
            AND u.role = 'user'
            AND EXISTS (
                SELECT 1 FROM app_users me
                WHERE me.id = ? AND me.role = 'user'
            )
            ORDER BY u.name ASC`,
            [req.userId, req.userId, req.userId, req.userId]
        );

        return res.json({
        friends: friends.map((friend) => ({
            id: String(friend.id),
            name: friend.name,
            bio: friend.bio,
        })),
        });
      } catch (error) {
        console.error("DM friends lookup failed:", error);

        return res.status(500).json({
        error: "Unable to load friends.",
        });
      }
    }
  );

  // Get message history between the logged-in user and a friend.
  app.get(
    "/api/dms/:friendId",
    authenticateUser,
    requireMember,
    async (req, res) => {
      try {
        const [messages] = await getPool().execute(
          `SELECT id, sender_id, receiver_id, content, created_at
           FROM direct_messages
           WHERE
             (sender_id = ? AND receiver_id = ?)
             OR
             (sender_id = ? AND receiver_id = ?)
           ORDER BY created_at DESC, id DESC
           LIMIT 500`,
          [
            req.userId,
            req.friendId,
            req.friendId,
            req.userId,
          ]
        );

        return res.json({
          messages: messages.reverse().map((message) => ({
            id: String(message.id),
            senderId: String(message.sender_id),
            receiverId: String(message.receiver_id),
            content: message.content,
            createdAt: message.created_at,
          })),
        });
      } catch (error) {
        console.error("DM history lookup failed:", error);

        return res.status(500).json({
          error: "Unable to load messages.",
        });
      }
    }
  );

  // Send a direct message to an accepted friend.
  app.post(
    "/api/dms/:friendId",
    authenticateUser,
    requireMember,
    async (req, res) => {
      try {
        const { content } = req.body ?? {};

        if (
          typeof content !== "string" ||
          !content.trim() ||
          content.trim().length > 2000
        ) {
          return res.status(400).json({
            error: "Message must contain 1 to 2000 characters.",
          });
        }

        const messageId = crypto.randomInt(1, 2147483647);
        const cleanContent = content.trim();

        await getPool().execute(
          `INSERT INTO direct_messages
             (id, sender_id, receiver_id, content)
           VALUES (?, ?, ?, ?)`,
          [
            messageId,
            req.userId,
            req.friendId,
            cleanContent,
          ]
        );

        const [savedMessages] = await getPool().execute(
          `SELECT created_at
           FROM direct_messages
           WHERE id = ?`,
          [messageId]
        );

        return res.status(201).json({
          message: {
            id: String(messageId),
            senderId: String(req.userId),
            receiverId: String(req.friendId),
            content: cleanContent,
            createdAt: savedMessages[0].created_at,
          },
        });
      } catch (error) {
        console.error("Sending DM failed:", error);

        return res.status(500).json({
          error: "Unable to send message.",
        });
      }
    }
  );
}

const DIRECT_MESSAGES_SCHEMA = `CREATE TABLE IF NOT EXISTS direct_messages (
  id BIGINT PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX dm_pair (sender_id, receiver_id, created_at, id),
  FOREIGN KEY (sender_id) REFERENCES app_users(id),
  FOREIGN KEY (receiver_id) REFERENCES app_users(id)
)`;

module.exports = { registerDirectMessageRoutes, DIRECT_MESSAGES_SCHEMA };
