const mysql = require("mysql2/promise");

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "peos_db",
    });

    console.log("✓ Connected to database\n");

    // Test activities query
    const [activities] = await connection.query(
      `SELECT id AS activity_id, name, venue, date, created_at FROM activities ORDER BY created_at DESC`
    );
    console.log("Activities:", activities.length, "records");
    if (activities.length > 0) {
      console.log("First:", activities[0]);
    }

    // Test files query
    const [files] = await connection.query(
      `SELECT activity_id, COUNT(*) as file_count, MAX(upload_date) as latest_file FROM files GROUP BY activity_id`
    );
    console.log("\nFiles stats:", files.length, "records");
    if (files.length > 0) {
      console.log("First:", files[0]);
    }

    connection.end();
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
