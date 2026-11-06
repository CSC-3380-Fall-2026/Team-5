
const path = require("node:path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "..", ".env");

function loadEnvironment() {
  const result = dotenv.config({ path: envPath });

  if (result.error && result.error.code !== "ENOENT") {
    throw result.error;
  }

  return result;
}

function getDatabaseConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 5000,
  };
}

function validateDatabaseConfig(config) {
  const missing = [];

  if (!config.user) missing.push("DB_USER");
  if (!config.password) missing.push("DB_PASSWORD");
    if (config.password === "ENTER_YOUR_MYSQL_PASSWORD") {
      throw new Error(
        "Please replace ENTER_YOUR_MYSQL_PASSWORD with your actual MySQL password in backend/.env."
      );
    }
  if (!config.database) missing.push("DB_NAME");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535
  ) {
    throw new Error("DB_PORT must be a valid port number.");
  }
}

module.exports = {
  loadEnvironment,
  getDatabaseConfig,
  validateDatabaseConfig,
};
