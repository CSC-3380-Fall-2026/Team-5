
const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");

const {
  loadEnvironment,
  getDatabaseConfig,
  validateDatabaseConfig,
} = require("../config/env");

const backendDirectory = path.resolve(__dirname, "..");

const storageDirectories = [
  path.join(backendDirectory, "storage", "uploads"),
  path.join(backendDirectory, "storage", "videos"),
  path.join(backendDirectory, "storage", "temp"),
];

async function initializeStorage() {
  for (const directory of storageDirectories) {
    await fs.mkdir(directory, { recursive: true });

    console.log(
      `Storage ready: ${path.relative(backendDirectory, directory)}`
    );
  }
}

async function testDatabaseConnection() {
  const config = getDatabaseConfig();
  validateDatabaseConfig(config);

  let connection;

  try {
    connection = await mysql.createConnection(config);
    await connection.query("SELECT 1");
    console.log("Database connection successful.");
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function main() {
  const skipDatabase = process.argv.includes("--skip-db");

  console.log("Preparing local Time Capsule environment...");

  loadEnvironment();
  await initializeStorage();

  if (skipDatabase) {
    console.log("Database connection test skipped by request.");
    return;
  }

  await testDatabaseConnection();

  console.log("Local setup completed successfully.");
}

main().catch((error) => {
  console.error(`Setup failed: ${error.message}`);
  process.exitCode = 1;
});
