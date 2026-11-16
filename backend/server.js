
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const { FRIEND_REQUESTS_SCHEMA, registerFriendRoutes } = require("./friends");

const {
  loadEnvironment,
  getDatabaseConfig,
  validateDatabaseConfig,
} = require("./config/env");

loadEnvironment();

const dbConfig = getDatabaseConfig();
if (require.main === module) validateDatabaseConfig(dbConfig);

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = Number(process.env.PORT || 3000);

let pool;
const {ensureMemoryLocationSchema, validLocation, registerMemoryMapRoutes} = require('./memoryMap');
registerMemoryMapRoutes(app, () => pool, authenticateUser);

// Friend routes share the existing login middleware and MySQL connection pool.
registerFriendRoutes(app, () => pool, authenticateUser);

// Checks whether the backend and database are connected.
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

/*
Hashes the password, saves the account in MySQL, and assigns
the user role automatically.
Nobody can make themselves an admin through signup.
*/
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanName.length > 100 ||
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        error: "Please provide a valid name and email.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        error: "Password must be between 8 and 72 characters.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate a unique positive BIGINT-compatible user ID.
    const id = crypto.randomInt(1, 2147483647);

    await pool.execute(
      `INSERT INTO app_users
       (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'user')`,
      [id, cleanName, cleanEmail, passwordHash]
    );

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id,
        name: cleanName,
        email: cleanEmail,
        role: "user",
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      if (error.sqlMessage?.includes("email")) {
        return res.status(409).json({
          error: "An account with this email already exists.",
        });
      }

      return res.status(409).json({
        error: "Account could not be created. Please try again.",
      });
    }

    console.error("Registration failed:", error);
    return res.status(500).json({
      error: "Unable to create account.",
    });
  }
});

/*
Logs in an existing user by checking their email and password
against the account stored in MySQL.
*/
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [users] = await pool.execute(
      `SELECT id, name, email, password_hash, role
       FROM app_users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail]
    );

    const user = users[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { sub: String(user.id) },
      process.env.JWT_SECRET,
      { expiresIn: "7d", algorithm: "HS256" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      error: "Unable to log in.",
    });
  }
});

// Verifies the JWT token before allowing access to protected routes.
async function authenticateUser(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    req.userId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired login session.",
    });
  }
}

// Retrieves the logged-in user's profile.
app.get("/api/users/me", authenticateUser, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, bio, role, created_at
       FROM app_users
       WHERE id = ?
       LIMIT 1`,
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const user = users[0];

    return res.json({
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Profile lookup failed:", error);

    return res.status(500).json({
      error: "Unable to load profile.",
    });
  }
});

// Changes the logged-in user's password after verifying the current one.
app.put("/api/users/me/password", authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        error: "Current and new password are required.",
      });
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      return res.status(400).json({
        error: "Password must be between 8 and 72 characters.",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        error: "New password must be different from the current one.",
      });
    }

    const [users] = await pool.execute(
      `SELECT password_hash FROM app_users WHERE id = ? LIMIT 1`,
      [req.userId]
    );

    const user = users[0];

    if (!user || !user.password_hash) {
      return res.status(400).json({
        error: "This account does not have a password set.",
      });
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);

    if (!matches) {
      return res.status(401).json({
        error: "Current password is incorrect.",
      });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await pool.execute(
      `UPDATE app_users SET password_hash = ? WHERE id = ?`,
      [newHash, req.userId]
    );

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Password change failed:", error);

    return res.status(500).json({
      error: "Unable to change password.",
    });
  }
});

// Updates the logged-in user's email after confirming their password.
app.put("/api/users/me/email", authenticateUser, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body ?? {};

    if (
      typeof newEmail !== "string" ||
      typeof currentPassword !== "string" ||
      !newEmail.trim() ||
      !currentPassword
    ) {
      return res.status(400).json({
        error: "New email and current password are required.",
      });
    }

    const cleanEmail = newEmail.trim().toLowerCase();

    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        error: "Please provide a valid email address.",
      });
    }

    const [users] = await pool.execute(
      `SELECT email, password_hash FROM app_users WHERE id = ? LIMIT 1`,
      [req.userId]
    );

    const user = users[0];

    if (!user || !user.password_hash) {
      return res.status(400).json({
        error: "This account does not have a password set.",
      });
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);

    if (!matches) {
      return res.status(401).json({
        error: "Password is incorrect.",
      });
    }

    if (cleanEmail === user.email) {
      return res.status(400).json({
        error: "That is already your email address.",
      });
    }

    await pool.execute(
      `UPDATE app_users SET email = ? WHERE id = ?`,
      [cleanEmail, req.userId]
    );

    return res.json({
      message: "Email updated successfully.",
      email: cleanEmail,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Email update failed:", error);

    return res.status(500).json({
      error: "Unable to update email.",
    });
  }
});

// Updates the logged-in user's name and bio.
app.put("/api/users/me/profile", authenticateUser, async (req, res) => {
  try {
    const { name, bio } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "Name is required.",
      });
    }

    const cleanName = name.trim();
    const cleanBio = typeof bio === "string" ? bio.trim() : "";

    if (cleanName.length > 100) {
      return res.status(400).json({
        error: "Name must be 100 characters or fewer.",
      });
    }

    if (cleanBio.length > 500) {
      return res.status(400).json({
        error: "Bio must be 500 characters or fewer.",
      });
    }

    await pool.execute(
      `UPDATE app_users SET name = ?, bio = ? WHERE id = ?`,
      [cleanName, cleanBio || null, req.userId]
    );

    return res.json({
      message: "Profile updated successfully.",
      name: cleanName,
      bio: cleanBio || null,
    });
  } catch (error) {
    console.error("Profile update failed:", error);

    return res.status(500).json({
      error: "Unable to update profile.",
    });
  }
});

// Searches registered users for the Friends directory.
app.get("/api/users/discover", authenticateUser, async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    const [users] = await pool.execute(
      `SELECT id, name, bio
       FROM app_users
       WHERE id <> ?
         AND role = 'user'
         AND name LIKE ?
       ORDER BY name ASC
       LIMIT 100`,
      [req.userId, `%${search}%`]
    );

    return res.json({
      users: users.map((user) => ({
        id: String(user.id),
        name: user.name,
        bio: user.bio,
      })),
    });
  } catch (error) {
    console.error("Discover users failed:", error);

    return res.status(500).json({
      error: "Unable to load users.",
    });
  }
});

// Creates a capsule and saves selected friends as group members.
app.post("/api/capsules", authenticateUser, async (req, res) => {
  let connection;

  try {
    const { title, description, opensAt, friendIds = [] } = req.body ?? {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof opensAt !== "string" ||
      !opensAt.trim()
    ) {
      return res.status(400).json({
        error: "Capsule title and unlock date are required.",
      });
    }

    // Friend IDs must be an array of numeric strings.
    if (
      !Array.isArray(friendIds) ||
      !friendIds.every(
        (id) => typeof id === "string" && /^\d+$/.test(id)
      )
    ) {
      return res.status(400).json({
        error: "Invalid friend selection.",
      });
    }

    // Remove duplicate IDs and exclude the capsule creator.
    const uniqueFriendIds = [...new Set(friendIds)].filter(
      (id) => id !== String(req.userId)
    );

    // Confirm every selected friend is a registered non-admin user.
    if (uniqueFriendIds.length > 0) {
      const placeholders = uniqueFriendIds.map(() => "?").join(", ");

      const [registeredFriends] = await pool.execute(
        `SELECT id FROM app_users
         WHERE id IN (${placeholders}) AND role = 'user'`,
        uniqueFriendIds
      );

      if (registeredFriends.length !== uniqueFriendIds.length) {
        return res.status(400).json({
          error: "One or more selected friends are invalid.",
        });
      }
    }

    const capsuleId = crypto.randomInt(1, 2147483647);
    const groupId = crypto.randomInt(1, 2147483647);

    // Start a transaction so all database changes succeed together.
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Create the capsule group.
    await connection.execute(
      `INSERT INTO capsule_groups
       (id, name, created_by)
       VALUES (?, ?, ?)`,
      [groupId, title.trim(), req.userId]
    );

    // Add the capsule creator to the group.
    await connection.execute(
      `INSERT INTO group_members
       (group_id, user_id)
       VALUES (?, ?)`,
      [groupId, req.userId]
    );

    // Add selected friends to the group.
    for (const friendId of uniqueFriendIds) {
      await connection.execute(
        `INSERT INTO group_members
         (group_id, user_id)
         VALUES (?, ?)`,
        [groupId, friendId]
      );
    }

    // Create the capsule associated with the group.
    await connection.execute(
      `INSERT INTO capsules
       (id, group_id, created_by, title, description, opens_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        capsuleId,
        groupId,
        req.userId,
        title.trim(),
        typeof description === "string" ? description.trim() : null,
        opensAt,
      ]
    );

    // Save the capsule and all group memberships together.
    await connection.commit();

    return res.status(201).json({
      message: "Capsule created successfully.",
      capsule: {
        id: String(capsuleId),
        groupId: String(groupId),
        createdBy: String(req.userId),
        title: title.trim(),
        description:
          typeof description === "string" ? description.trim() : null,
        opensAt,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Capsule creation failed:", error);

    return res.status(500).json({
      error: "Unable to create capsule.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Retrieves capsules and their saved registered members.
app.get("/api/capsules", authenticateUser, async (req, res) => {
  try {
    // Get every capsule the logged-in user belongs to.
    const [capsules] = await pool.execute(
      `SELECT
      capsules.id,
      capsules.group_id,
      capsules.created_by,
      capsules.title,
      capsules.description,
      capsules.opens_at,
      capsules.created_at,
      (
        SELECT COUNT(*)
        FROM messages
        WHERE messages.capsule_id = capsules.id
      ) AS memory_count
       FROM capsules
       INNER JOIN group_members
         ON capsules.group_id = group_members.group_id
       WHERE group_members.user_id = ?
       ORDER BY capsules.created_at DESC`,
      [req.userId]
    );

    // NEW: Load the registered members of each capsule group.
    const capsuleMembers = await Promise.all(
      capsules.map(async (capsule) => {
        const [members] = await pool.execute(
          `SELECT u.id, u.name
           FROM group_members gm
           JOIN app_users u ON gm.user_id = u.id
           WHERE gm.group_id = ?
           ORDER BY u.name ASC`,
          [capsule.group_id]
        );

        return members.map((member) => ({
          id: String(member.id),
          name: member.name,
        }));
      })
    );

    // Include saved members in the response for each capsule.
    return res.json({
      capsules: capsules.map((capsule, index) => ({
        id: String(capsule.id),
        groupId: String(capsule.group_id),
        createdBy: String(capsule.created_by),
        title: capsule.title,
        description: capsule.description,
        opensAt: capsule.opens_at,
        createdAt: capsule.created_at,
        memoryCount: Number(capsule.memory_count),
        members: capsuleMembers[index],
      })),
    });
  } catch (error) {
    console.error("Capsule lookup failed:", error);

    return res.status(500).json({
      error: "Unable to load capsules.",
    });
  }
});

// Adds a memory to a capsule
app.post("/api/capsules/:id/memories", authenticateUser, async (req, res) => {
  try {
    const capsuleId = req.params.id;
    const { content, photoData, latitude = null, longitude = null, locationName = null } = req.body ?? {};
    if (!validLocation(latitude, longitude) || (locationName !== null && (typeof locationName !== 'string' || locationName.length > 500))) {
      return res.status(400).json({error: 'Invalid memory location.'});
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        error: "Memory text is required.",
      });
    }

    // Makes sure the logged-in user belongs to this capsule
    const [capsules] = await pool.execute(
      `SELECT capsules.id, capsules.opens_at
       FROM capsules
       INNER JOIN group_members
         ON capsules.group_id = group_members.group_id
       WHERE capsules.id = ?
         AND group_members.user_id = ?
       LIMIT 1`,
      [capsuleId, req.userId]
    );

    if (capsules.length === 0) {
      return res.status(404).json({
        error: "Capsule not found or you do not have access to it.",
      });
    }

    const memoryId = crypto.randomInt(1, 2147483647);

    await pool.execute(
      `INSERT INTO messages
       (id, capsule_id, user_id, content, photo_data, latitude, longitude, location_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memoryId,
        capsuleId,
        req.userId,
        content.trim(),
        typeof photoData === "string" ? photoData : null,
        latitude, longitude, latitude == null ? null : locationName,
      ]
    );

    return res.status(201).json({
      message: "Memory added successfully.",
      memory: {
        id: String(memoryId),
        capsuleId: String(capsuleId),
        userId: String(req.userId),
        content: content.trim(),
        photoData:
          typeof photoData === "string" ? photoData : null,
        latitude, longitude, locationName,
      },
    });
  } catch (error) {
    console.error("Memory creation failed:", error);

    return res.status(500).json({
      error: "Unable to add memory.",
    });
  }
});

// Loads memories for a capsule
app.get("/api/capsules/:id/memories", authenticateUser, async (req, res) => {
  try {
    const capsuleId = req.params.id;

    // Makes sure the logged-in user belongs to this capsule
    const [capsules] = await pool.execute(
      `SELECT capsules.id, capsules.opens_at
       FROM capsules
       INNER JOIN group_members
         ON capsules.group_id = group_members.group_id
       WHERE capsules.id = ?
         AND group_members.user_id = ?
       LIMIT 1`,
      [capsuleId, req.userId]
    );

    if (capsules.length === 0) {
      return res.status(404).json({
        error: "Capsule not found or you do not have access to it.",
      });
    }

    if (new Date(capsules[0].opens_at).getTime() > Date.now()) {
      return res.status(423).json({error: 'This capsule is still locked.'});
    }

    const [memories] = await pool.execute(
      `SELECT id, capsule_id, user_id, content, photo_data, latitude, longitude, location_name, created_at
       FROM messages
       WHERE capsule_id = ?
       ORDER BY created_at ASC`,
      [capsuleId]
    );

    return res.json({
      memories: memories.map((memory) => ({
        id: String(memory.id),
        capsuleId: String(memory.capsule_id),
        userId: String(memory.user_id),
        content: memory.content,
        photoData: memory.photo_data,
        latitude: memory.latitude, longitude: memory.longitude, locationName: memory.location_name,
        createdAt: memory.created_at,
      })),
    });
  } catch (error) {
    console.error("Memory lookup failed:", error);

    return res.status(500).json({
      error: "Unable to load memories.",
    });
  }
});
// Permanently unlocks a capsule for testing/demo purposes
app.patch(
  "/api/capsules/:id/unlock-now",
  authenticateUser,
  async (req, res) => {
    try {
      const capsuleId = req.params.id;

      // Makes sure the logged-in user belongs to the capsule
      const [capsules] = await pool.execute(
        `SELECT capsules.id
         FROM capsules
         INNER JOIN group_members
           ON capsules.group_id = group_members.group_id
         WHERE capsules.id = ?
           AND group_members.user_id = ?
         LIMIT 1`,
        [capsuleId, req.userId]
      );

      if (capsules.length === 0) {
        return res.status(404).json({
          error: "Capsule not found or you do not have access to it.",
        });
      }

      // Move the unlock date to now
      await pool.execute(
        `UPDATE capsules
         SET opens_at = NOW()
         WHERE id = ?`,
        [capsuleId]
      );

      return res.json({
        message: "Capsule unlocked successfully.",
      });
    } catch (error) {
      console.error("Test unlock failed:", error);

      return res.status(500).json({
        error: "Unable to unlock capsule.",
      });
    }
  }
);
// Starts the backend and connects to MySQL.
async function startServer() {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // Verify MySQL is accessible before starting the API.
  await pool.query("SELECT 1");

  // Add persistent friend requests to existing databases without resetting their data.
  await pool.query(FRIEND_REQUESTS_SCHEMA);
  await ensureMemoryLocationSchema(pool);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API running on port ${PORT}`);
    console.log("MySQL connection successful");
  });
}

// Deletes a capsule created by the logged-in user.
app.delete("/api/capsules/:id", authenticateUser, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const capsuleId = req.params.id;

    // Make sure the capsule belongs to the logged-in user.
    const [capsules] = await connection.execute(
      `SELECT id, group_id
       FROM capsules
       WHERE id = ? AND created_by = ?
       LIMIT 1`,
      [capsuleId, req.userId]
    );

    if (capsules.length === 0) {
      return res.status(404).json({
        error: "Capsule not found or you do not have permission to delete it.",
      });
    }

    const groupId = capsules[0].group_id;

    await connection.beginTransaction();

    // Delete any messages connected to the capsule.
    await connection.execute(
      `DELETE FROM messages
       WHERE capsule_id = ?`,
      [capsuleId]
    );

    // Delete the capsule.
    await connection.execute(
      `DELETE FROM capsules
       WHERE id = ?`,
      [capsuleId]
    );

    // Remove the capsule's group memberships.
    await connection.execute(
      `DELETE FROM group_members
       WHERE group_id = ?`,
      [groupId]
    );

    // Delete the now-unused group.
    await connection.execute(
      `DELETE FROM capsule_groups
       WHERE id = ?`,
      [groupId]
    );

    await connection.commit();

    return res.json({
      message: "Capsule deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Capsule deletion failed:", error);

    return res.status(500).json({
      error: "Unable to delete capsule.",
    });
  } finally {
    connection.release();
  }
});

module.exports = {app, setPool: value => { pool = value; }};

if (require.main === module) startServer().catch((error) => {
  console.error("Failed to start API:", error.message);
  process.exit(1);
});
