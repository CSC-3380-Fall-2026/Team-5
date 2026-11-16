// one row per pair prevents duplicate or crossed friend requests
const FRIEND_REQUESTS_SCHEMA = `CREATE TABLE IF NOT EXISTS friend_requests (
  user_low BIGINT NOT NULL,
  user_high BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_low, user_high),
  FOREIGN KEY (user_low) REFERENCES app_users(id),
  FOREIGN KEY (user_high) REFERENCES app_users(id),
  FOREIGN KEY (sender_id) REFERENCES app_users(id)
)`;

function relationship(request, userId) {
  if (!request?.status || request.status === 'declined') return 'none';
  if (request.status === 'accepted') return 'friends';
  return String(request.sender_id) === String(userId) ? 'outgoing' : 'incoming';
}

function registerFriendRoutes(app, getPool, authenticateUser) {
  // read roles from MySQL rather than trusting the client or an old login token
  async function regularUser(req, res, next) {
    try {
      const [users] = await getPool().execute(
        "SELECT id FROM app_users WHERE id = ? AND role = 'user'", [req.userId],
      );
      if (!users.length) return res.status(403).json({error: 'Only member accounts can use friend requests.'});
      next();
    } catch (error) {
      console.error('Friend account lookup failed:', error);
      res.status(500).json({error: 'Unable to verify account.'});
    }
  }

  // return all eligible users so searching the directory never misses users past a limit.
  app.get('/api/friends/users', authenticateUser, regularUser, async (req, res) => {
    try {
      const [users] = await getPool().execute(
        `SELECT u.id, u.name, u.bio, f.sender_id, f.status
         FROM app_users u
         LEFT JOIN friend_requests f
           ON f.user_low = LEAST(u.id, ?) AND f.user_high = GREATEST(u.id, ?)
         WHERE u.id <> ? AND u.role = 'user'
         ORDER BY u.name ASC, u.id ASC`,
        [req.userId, req.userId, req.userId],
      );
      res.json({users: users.map(user => ({
        id: String(user.id), name: user.name, bio: user.bio,
        relationship: relationship(user, req.userId),
      }))});
    } catch (error) {
      console.error('Friends directory failed:', error);
      res.status(500).json({error: 'Unable to load people.'});
    }
  });

  async function eligibleTarget(req, res, next) {
    const targetId = req.params.userId;
    if (!/^[1-9]\d*$/.test(targetId) || BigInt(targetId) > 9223372036854775807n ||
        BigInt(targetId) === BigInt(req.userId)) {
      return res.status(400).json({error: 'Choose another registered member.'});
    }
    try {
      const [users] = await getPool().execute(
        "SELECT id FROM app_users WHERE id = ? AND role = 'user'", [targetId],
      );
      if (!users.length) return res.status(404).json({error: 'Member not found. Admins cannot receive friend requests.'});
      // Sort numerically without losing precision for BIGINT IDs.
      req.friendPair = BigInt(req.userId) < BigInt(targetId)
        ? [String(req.userId), targetId] : [targetId, String(req.userId)];
      next();
    } catch (error) {
      console.error('Friend target lookup failed:', error);
      res.status(500).json({error: 'Unable to verify selected member.'});
    }
  }

  app.post('/api/friends/requests/:userId', authenticateUser, regularUser, eligibleTarget, async (req, res) => {
    try {
      // Repeated taps are idempotent. An incoming request still requires explicit acceptance.
      await getPool().execute(
        `INSERT INTO friend_requests (user_low, user_high, sender_id) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           sender_id = IF(status = 'declined', ?, sender_id),
           status = IF(status = 'declined', 'pending', status)`,
        [...req.friendPair, req.userId, req.userId],
      );
      const [requests] = await getPool().execute(
        'SELECT sender_id, status FROM friend_requests WHERE user_low = ? AND user_high = ?', req.friendPair,
      );
      res.json({relationship: relationship(requests[0], req.userId)});
    } catch (error) {
      console.error('Send friend request failed:', error);
      res.status(500).json({error: 'Unable to send friend request.'});
    }
  });

  app.patch('/api/friends/requests/:userId', authenticateUser, regularUser, eligibleTarget, async (req, res) => {
    const action = req.body?.action;
    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({error: 'Choose accept or decline.'});
    }
    try {
      // only the recipient can respond, and only while the request is pending.
      const [result] = await getPool().execute(
        `UPDATE friend_requests SET status = ?
         WHERE user_low = ? AND user_high = ? AND sender_id = ? AND status = 'pending'`,
        [action === 'accept' ? 'accepted' : 'declined', ...req.friendPair, req.params.userId],
      );
      if (!result.affectedRows) return res.status(409).json({error: 'This request is no longer pending. Refresh the directory.'});
      res.json({relationship: action === 'accept' ? 'friends' : 'none'});
    } catch (error) {
      console.error('Respond to friend request failed:', error);
      res.status(500).json({error: 'Unable to update friend request.'});
    }
  });
}

module.exports = {FRIEND_REQUESTS_SCHEMA, registerFriendRoutes};
