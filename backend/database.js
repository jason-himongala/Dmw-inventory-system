const mysql = require("mysql2/promise");

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

    // Create database if not exists
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "peos_db"}`,
    );

    // Select the database
    await connection.query(`USE ${process.env.DB_NAME || "peos_db"}`);

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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
      )
    `);

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
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        INDEX idx_activity_id (activity_id)
      )
    `);

    console.log("✓ MySQL Database initialized successfully");
    console.log("✓ Database: " + (process.env.DB_NAME || "peos_db"));
    console.log("✓ Host: " + (process.env.DB_HOST || "127.0.0.1"));
  } catch (error) {
    console.error("✗ Database initialization error:", error.message);
    // Don't exit - let the app try to continue
  } finally {
    if (connection) connection.release();
  }
}

// Initialize database on module load
initializeDatabase();

module.exports = pool;
