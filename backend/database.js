const mysql = require("mysql2/promise");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "peos_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database tables
async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();

    // Best-effort helper for backward-compatible schema migrations.
    const execIgnore = async (sql) => {
      try {
        await connection.query(sql);
      } catch (e) {
        // Ignore migration errors to keep startup resilient across MySQL/MariaDB versions.
      }
    };

    // Create database if not exists
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "peos_db"}`,
    );

    // Select the database
    await connection.query(`USE ${process.env.DB_NAME || "peos_db"}`);

    // Set default storage engine to InnoDB
    await connection.query(`SET default_storage_engine=InnoDB`);

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // Activities table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        source VARCHAR(50) DEFAULT 'saved',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // Ensure expected columns exist for older databases.
    await execIgnore(
      `ALTER TABLE activities ADD COLUMN source VARCHAR(50) DEFAULT 'saved'`,
    );
    await execIgnore(
      `ALTER TABLE activities ADD COLUMN created_by VARCHAR(255)`,
    );
    await execIgnore(
      `ALTER TABLE activities ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );

    // Attendance records table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(36) PRIMARY KEY,
        activity_id VARCHAR(36) NOT NULL,
        row_number INT NOT NULL,
        name VARCHAR(255),
        sex VARCHAR(50),
        office VARCHAR(255),
        position VARCHAR(255),
        contact VARCHAR(20),
        signature VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_activity_id (activity_id)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await execIgnore(
      `ALTER TABLE attendance ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );
    await execIgnore(
      `ALTER TABLE attendance ADD INDEX idx_activity_id (activity_id)`,
    );

    // Uploaded files table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(36) PRIMARY KEY,
        participant_id VARCHAR(36),
        activity_id VARCHAR(36) NOT NULL,
        uploaded_by VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(1024) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_files_activity_id (activity_id),
        INDEX idx_files_uploaded_by (uploaded_by)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await execIgnore(`ALTER TABLE files ADD COLUMN participant_id VARCHAR(36)`);
    await execIgnore(
      `ALTER TABLE files ADD COLUMN activity_id VARCHAR(36) NOT NULL`,
    );
    await execIgnore(
      `ALTER TABLE files ADD COLUMN uploaded_by VARCHAR(36) NOT NULL`,
    );
    await execIgnore(
      `ALTER TABLE files ADD COLUMN file_name VARCHAR(255) NOT NULL`,
    );
    await execIgnore(
      `ALTER TABLE files ADD COLUMN file_path VARCHAR(1024) NOT NULL`,
    );
    await execIgnore(
      `ALTER TABLE files ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );
    await execIgnore(
      `ALTER TABLE files ADD INDEX idx_files_activity_id (activity_id)`,
    );
    await execIgnore(
      `ALTER TABLE files ADD INDEX idx_files_uploaded_by (uploaded_by)`,
    );

    // Add foreign keys (ignore if they already exist)
    try {
      await connection.query(
        `ALTER TABLE attendance ADD CONSTRAINT fk_attendance_activity_id FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE`,
      );
    } catch (e) {
      // Constraint may already exist
    }

    try {
      await connection.query(
        `ALTER TABLE files ADD CONSTRAINT fk_files_participant_id FOREIGN KEY (participant_id) REFERENCES attendance(id) ON DELETE SET NULL`,
      );
    } catch (e) {
      // Constraint may already exist
    }

    try {
      await connection.query(
        `ALTER TABLE files ADD CONSTRAINT fk_files_activity_id FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE`,
      );
    } catch (e) {
      // Constraint may already exist
    }

    try {
      await connection.query(
        `ALTER TABLE files ADD CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE`,
      );
    } catch (e) {
      // Constraint may already exist
    }

    // Insert default staff user for attendance submissions (skip if already exists)
    const { v4: uuidv4 } = require("uuid");
    const staffUserId = uuidv4();
    try {
      await connection.query(
        `INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)`,
        [staffUserId, "staff", "password", "admin"],
      );
    } catch (e) {
      // User may already exist, that's fine
    }

    console.log("✓ MySQL Database initialized successfully");
    console.log("✓ Database: " + (process.env.DB_NAME || "peos_db"));
    console.log("✓ Host: " + (process.env.DB_HOST || "127.0.0.1"));
    console.log("✓ Staff user created with ID:", staffUserId);
  } catch (error) {
    console.error("✗ Database initialization error:", error.message);
    // Don't exit - let the app try to continue
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { pool, initializeDatabase };
