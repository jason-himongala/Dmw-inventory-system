const express = require("express");
const cors = require("cors");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const pool = require("./database");

const app = express();
// Backend should run on a dedicated API port (3001) when static frontend uses 3000
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://192.168.100.131:3000",
        "http://127.0.0.1:3000",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: Origin not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
  }),
);
app.options("*", cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve data directory
app.use("/data", express.static(path.join(__dirname, "../resources/json")));

// ============================================
// ACTIVITIES ENDPOINTS
// ============================================

// Get all activities
app.get("/api/activities", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM activities ORDER BY created_at DESC",
    );
    connection.release();
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity by ID
app.get("/api/activities/:id", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM activities WHERE id = ?",
      [req.params.id],
    );
    connection.release();

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new activity
app.post("/api/activities", async (req, res) => {
  const { name, venue, date, source = "saved", created_by } = req.body;

  if (!name || !venue || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      "INSERT INTO activities (id, name, venue, date, source, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, venue, date, source, created_by],
    );
    connection.release();
    res.status(201).json({ id, name, venue, date, source, created_by });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update activity
app.put("/api/activities/:id", async (req, res) => {
  const { name, venue, date } = req.body;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "UPDATE activities SET name = ?, venue = ?, date = ? WHERE id = ?",
      [name, venue, date, req.params.id],
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }
    res.json({ id: req.params.id, name, venue, date });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete activity
app.delete("/api/activities/:id", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [result] = await connection.query(
      "DELETE FROM activities WHERE id = ?",
      [req.params.id],
    );

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: "Activity not found" });
    }

    // Also delete associated attendance records
    await connection.query("DELETE FROM attendance WHERE activity_id = ?", [
      req.params.id,
    ]);

    connection.release();
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ATTENDANCE ENDPOINTS
// ============================================

// Get attendance records for an activity
app.get("/api/attendance/:activity_id", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM attendance WHERE activity_id = ? ORDER BY row_number",
      [req.params.activity_id],
    );
    connection.release();
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save attendance record
app.post("/api/attendance", async (req, res) => {
  const {
    activity_id,
    row_number,
    name,
    sex,
    office,
    position,
    contact,
    signature,
  } = req.body;

  if (!activity_id || !row_number) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      `INSERT INTO attendance (id, activity_id, row_number, name, sex, office, position, contact, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        activity_id,
        row_number,
        name || null,
        sex || null,
        office || null,
        position || null,
        contact || null,
        signature || null,
      ],
    );
    connection.release();
    res.status(201).json({
      id,
      activity_id,
      row_number,
      name,
      sex,
      office,
      position,
      contact,
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update attendance record
app.put("/api/attendance/:id", async (req, res) => {
  const { name, sex, office, position, contact, signature } = req.body;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `UPDATE attendance SET name = ?, sex = ?, office = ?, position = ?, contact = ?, signature = ? WHERE id = ?`,
      [
        name || null,
        sex || null,
        office || null,
        position || null,
        contact || null,
        signature || null,
        req.params.id,
      ],
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    res.json({
      id: req.params.id,
      name,
      sex,
      office,
      position,
      contact,
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete attendance record
app.delete("/api/attendance/:id", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "DELETE FROM attendance WHERE id = ?",
      [req.params.id],
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    res.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch save attendance (for entire sheet)
app.post("/api/attendance/batch/:activity_id", async (req, res) => {
  const activityId = req.params.activity_id;
  const records = req.body; // Array of attendance records

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "Invalid records" });
  }

  try {
    const connection = await pool.getConnection();

    // Delete existing records for this activity
    await connection.query("DELETE FROM attendance WHERE activity_id = ?", [
      activityId,
    ]);

    // Insert new records
    for (const record of records) {
      await connection.query(
        `INSERT INTO attendance (id, activity_id, row_number, name, sex, office, position, contact, signature)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          activityId,
          record.row_number,
          record.name || null,
          record.sex || null,
          record.office || null,
          record.position || null,
          record.contact || null,
          record.signature || null,
        ],
      );
    }

    connection.release();
    res.status(201).json({
      message: "Attendance records saved successfully",
      count: records.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ATTENDANCE SUMMARY
// ============================================

app.get("/api/attendance/summary", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT
         a.id AS activity_id,
         a.name,
         a.venue,
         a.date,
         COUNT(att.id) AS record_count,
         MAX(att.created_at) AS last_saved
       FROM activities a
       LEFT JOIN attendance att ON att.activity_id = a.id
       GROUP BY a.id
       ORDER BY last_saved DESC, a.created_at DESC`,
    );
    connection.release();
    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "PEOS Backend is running" });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n✓ PEOS Backend Server running on http://localhost:${PORT}`);
  console.log(`✓ Database: MySQL (XAMPP)`);
  console.log(`✓ Endpoints ready:\n`);
  console.log("  GET  /api/activities         - Get all activities");
  console.log("  POST /api/activities         - Create activity");
  console.log("  GET  /api/attendance/:id     - Get attendance records");
  console.log("  POST /api/attendance/batch   - Save batch attendance");
  console.log("  GET  /api/health             - Health check\n");
});
