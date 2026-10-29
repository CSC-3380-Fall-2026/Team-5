
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const readline = require("node:readline/promises");

const {
  loadEnvironment,
  getDatabaseConfig,
  validateDatabaseConfig,
} = require("../config/env");

loadEnvironment();

const config = getDatabaseConfig();
validateDatabaseConfig(config);

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let connection;

  try {
    const email = (
      await rl.question("Admin email: ")
    ).trim().toLowerCase();

    const password = await rl.question("Admin password: ");

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 255
    ) {
      throw new Error("Enter a valid admin email.");
    }

    if (password.length < 12 || password.length > 72) {
      throw new Error("Admin password must be 12–72 characters.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    connection = await mysql.createConnection(config);

    const [existing] = await connection.execute(
      "SELECT id FROM app_users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      throw new Error("An account with that email already exists.");
    }

    const id = crypto.randomInt(1, 2147483647);

    await connection.execute(
      `INSERT INTO app_users
       (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'admin')`,
      [id, "Time Capsule Admin", email, passwordHash]
    );

    console.log("Admin account created successfully.");
    console.log(`Email: ${email}`);
    console.log(`User ID: ${id}`);
  } finally {
    if (connection) await connection.end();
    rl.close();
  }
}

main().catch((error) => {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
});
