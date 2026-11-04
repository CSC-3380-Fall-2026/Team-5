CREATE DATABASE IF NOT EXISTS time_capsule CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'timecapsule'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON time_capsule.* TO 'timecapsule'@'localhost';
