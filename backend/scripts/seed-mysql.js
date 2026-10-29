
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const seedFile = path.join(__dirname, "..", "data", "seed-data.json");

async function main() {
  if (!fs.existsSync(seedFile)) {
    throw new Error("Seed data not found. Run npm run seed first.");
  }

  const data = JSON.parse(fs.readFileSync(seedFile, "utf8"));

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

try {
  await connection.beginTransaction();

  // Create or update the default admin account for the class project.
  const adminEmail = "admin@gmail.com";
  const adminPassword = "TimeCapsule3380!";

  const [existingAdmins] = await connection.execute(
    "SELECT id FROM app_users WHERE email = ?",
    [adminEmail]
  );

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (existingAdmins.length === 0) {
    const crypto = require("node:crypto");
    const adminId = crypto.randomBytes(6).readUIntBE(0, 6);

    await connection.execute(
      `INSERT INTO app_users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)`,
      [
        adminId,
        "Time Capsule Admin",
        adminEmail,
        passwordHash,
        "admin",
      ]
    );

    console.log("Default admin account created.");
  } else {
    await connection.execute(
      `UPDATE app_users
      SET name = ?, password_hash = ?, role = ?
      WHERE email = ?`,
      [
        "Time Capsule Admin",
        passwordHash,
        "admin",
        adminEmail,
      ]
    );

    console.log("Default admin account updated.");
  }

  // Insert users first because other tables reference them.
    for (const user of data.users) {
      await connection.execute(
        `INSERT INTO app_users (id, name, email, bio)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [user.id, user.name, user.email, user.bio]
      );
    }

    // Groups reference users.
    for (const group of data.groups) {
      await connection.execute(
        `INSERT INTO capsule_groups (id, name, created_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [group.id, group.name, group.createdBy]
      );
    }

    // Memberships reference both groups and users.
    for (const member of data.memberships) {
      await connection.execute(
        `INSERT INTO group_members (group_id, user_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE group_id = group_id`,
        [member.groupId, member.userId]
      );
    }

    // Capsules reference groups and users.
    for (const capsule of data.capsules) {
      await connection.execute(
        `INSERT INTO capsules
         (id, group_id, created_by, title, description, opens_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [
          capsule.id,
          capsule.groupId,
          capsule.createdBy,
          capsule.title,
          capsule.description,
          capsule.opensAt.replace("T", " "),
        ]
      );
    }

    // Messages reference capsules and users.
    for (const message of data.messages) {
      await connection.execute(
        `INSERT INTO messages (id, capsule_id, user_id, content)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [message.id, message.capsuleId, message.userId, message.content]
      );
    }

    await connection.commit();

    console.log("MySQL seed completed successfully!");
    console.log(`Users processed: ${data.users.length}`);
    console.log(`Groups processed: ${data.groups.length}`);
    console.log(`Memberships processed: ${data.memberships.length}`);
    console.log(`Capsules processed: ${data.capsules.length}`);
    console.log(`Messages processed: ${data.messages.length}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("MySQL seed failed:", error.message);
  process.exitCode = 1;
});
