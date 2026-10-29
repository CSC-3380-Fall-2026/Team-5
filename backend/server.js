
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
