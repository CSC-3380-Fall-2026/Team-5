
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const {
  loadEnvironment,
  getDatabaseConfig,
  validateDatabaseConfig,
} = require("./config/env");

loadEnvironment();

const dbConfig = getDatabaseConfig();
validateDatabaseConfig(dbConfig);

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);

let pool;

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

/*hashes the password, saves the account in MySQL, and assigns the user role automatically.
/nobody can make themselves an admin through signup.
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
backend user login: find account using email, compare password with hashed password in MySQL, and return a JWT token if successful.
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
// Gets registered users for the Friends directory.
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


/*
 Creates a capsule using registered MySQL users.
 Saves the capsule, its group, and its members together.
*/
app.post("/api/capsules", authenticateUser, async (req, res) => {
  const { name, unlockDate, friendIds = [] } = req.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 150
  ) {
    return res.status(400).json({
      error: "Enter a capsule name up to 150 characters.",
    });
  }

  if (
    typeof unlockDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(unlockDate)
  ) {
    return res.status(400).json({
      error: "Invalid unlock date format.",
    });
  }


  const [year, month, day] = unlockDate.split("-").map(Number);
  const parsedDate = new Date(`${unlockDate}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day ||
    unlockDate <= new Date().toISOString().slice(0, 10)
  ) {
    return res.status(400).json({
      error: "Choose a valid future unlock date.",
    });
  }

  if (
    !Array.isArray(friendIds) ||
    friendIds.length > 100 ||
    !friendIds.every(
      id => typeof id === "string" && /^[1-9]\d*$/.test(id)
    ) ||
    new Set(friendIds).size !== friendIds.length ||
    friendIds.includes(String(req.userId))
  ) {
    return res.status(400).json({
      error: "Invalid or duplicate friend IDs.",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Make sure every selected friend is a registered, non-admin user.
    if (friendIds.length > 0) {
      const placeholders = friendIds.map(() => "?").join(",");

      const [users] = await connection.query(
        `SELECT id FROM app_users
         WHERE id IN (${placeholders})
         AND role = 'user'`,
        friendIds
      );

      if (users.length !== friendIds.length) {
        await connection.rollback();

        return res.status(400).json({
          error: "One or more selected friends were not found.",
        });
      }
    }

    const groupId = crypto.randomInt(1, 2147483647);
    const capsuleId = crypto.randomInt(1, 2147483647);
    const cleanName = name.trim();

    await connection.execute(
      `INSERT INTO capsule_groups (id, name, created_by)
       VALUES (?, ?, ?)`,
      [groupId, cleanName, req.userId]
    );

    // Include the capsule creator as a member.
    for (const userId of [String(req.userId), ...friendIds]) {
      await connection.execute(
        `INSERT INTO group_members (group_id, user_id)
         VALUES (?, ?)`,
        [groupId, userId]
      );
    }

    await connection.execute(
      `INSERT INTO capsules
       (id, group_id, created_by, title, description, opens_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        capsuleId,
        groupId,
        req.userId,
        cleanName,
        null,
        `${unlockDate} 00:00:00`,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Capsule created successfully.",
      capsule: {
        id: String(capsuleId),
        groupId: String(groupId),
        name: cleanName,
        unlockDate,
        friendIds,
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

/*
 Returns capsules belonging to the logged-in user.
 Includes capsules they created and capsules they joined.
*/
app.get("/api/capsules", authenticateUser, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         c.id,
         c.title,
         c.opens_at,
         u.name AS friend_name
       FROM capsules c
       JOIN group_members current_member
         ON c.group_id = current_member.group_id
       LEFT JOIN group_members other_member
         ON c.group_id = other_member.group_id
         AND other_member.user_id <> ?
       LEFT JOIN app_users u
         ON other_member.user_id = u.id
       WHERE current_member.user_id = ?
       ORDER BY c.created_at DESC, c.id, u.name`,
      [req.userId, req.userId]
    );

    const capsuleMap = new Map();

    for (const row of rows) {
      const id = String(row.id);

      if (!capsuleMap.has(id)) {
        capsuleMap.set(id, {
          id,
          name: row.title,
          unlockDate: row.opens_at,
          friends: [],
        });
      }

      if (row.friend_name) {
        capsuleMap.get(id).friends.push(row.friend_name);
      }
    }

    return res.json({
      capsules: Array.from(capsuleMap.values()),
    });
  } catch (error) {
    console.error("Failed to load capsules:", error);

    return res.status(500).json({
      error: "Unable to load capsules.",
    });
  }
});

async function startServer() {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // Verify MySQL is accessible before starting the API.
  await pool.query("SELECT 1");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API running on port ${PORT}`);
    console.log("MySQL connection successful");
  });
}

startServer().catch((error) => {
  console.error("Failed to start API:", error.message);
  process.exit(1);
});
