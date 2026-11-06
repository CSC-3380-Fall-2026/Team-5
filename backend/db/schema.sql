
CREATE DATABASE IF NOT EXISTS time_capsule_dev;
USE time_capsule_dev;

CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_hash VARCHAR(255) NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS capsule_groups (
    id BIGINT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    created_by BIGINT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES app_users(id)
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES capsule_groups(id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);

CREATE TABLE IF NOT EXISTS capsules (
    id BIGINT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    opens_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES capsule_groups(id),
    FOREIGN KEY (created_by) REFERENCES app_users(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT PRIMARY KEY,
    capsule_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capsule_id) REFERENCES capsules(id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
