//this reads your local MySQL credentials from .env
//connects to MySQL even if time_capsule_dev doesn't exist yet
//executes our existing schema.sql to create the database and five tables
const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");

const {
  loadEnvironment,
  getDatabaseConfig,
  validateDatabaseConfig,
} = require("../config/env");

async function main() {
  loadEnvironment();

  const config = getDatabaseConfig();
  validateDatabaseConfig(config);

  const schemaPath = path.join(__dirname, "../db/schema.sql"); 
  const schema = await fs.readFile(schemaPath, "utf8");

  // Connect to MySQL without requiring the database to exist.
  const { database, ...serverConfig } = config;

  const connection = await mysql.createConnection({
    ...serverConfig,
    multipleStatements: true,
  });

  try {
    console.log("Initializing Time Capsule database...");
    await connection.query(schema);
    console.log("Database and tables initialized successfully.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Database initialization failed: ${error.message}`);
  process.exitCode = 1;
});
