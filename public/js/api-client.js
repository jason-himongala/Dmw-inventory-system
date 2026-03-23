// API Configuration
const API_URL = "http://localhost:3001/api";

// ============================================
// ACTIVITIES API
// ============================================

async function getActivities() {
  try {
    const response = await fetch(`${API_URL}/activities`);
    if (!response.ok) throw new Error("Failed to fetch activities");
    return await response.json();
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}

async function getActivityById(id) {
  try {
    const response = await fetch(`${API_URL}/activities/${id}`);
    if (!response.ok) throw new Error("Activity not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching activity:", error);
    return null;
  }
}

async function createActivity(name, venue, date) {
  try {
    const response = await fetch(`${API_URL}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, venue, date, created_by: "current_user" }),
    });
    if (!response.ok) throw new Error("Failed to create activity");
    return await response.json();
  } catch (error) {
    console.error("Error creating activity:", error);
    return null;
  }
}

async function updateActivity(id, name, venue, date) {
  try {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, venue, date }),
    });
    if (!response.ok) throw new Error("Failed to update activity");
    return await response.json();
  } catch (error) {
    console.error("Error updating activity:", error);
    return null;
  }
}

async function deleteActivity(id) {
  try {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete activity");
    return await response.json();
  } catch (error) {
    console.error("Error deleting activity:", error);
    return null;
  }
}

// ============================================
// ATTENDANCE API
// ============================================

async function getAttendanceRecords(activityId) {
  try {
    const response = await fetch(`${API_URL}/attendance/${activityId}`);
    if (!response.ok) throw new Error("Failed to fetch attendance records");
    return await response.json();
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return [];
  }
}

async function getAttendanceSummary() {
  try {
    const response = await fetch(`${API_URL}/attendance/summary`);
    if (!response.ok) throw new Error("Failed to fetch attendance summary");
    return await response.json();
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    return [];
  }
}

async function createAttendanceRecord(
  activityId,
  rowNumber,
  name,
  sex,
  office,
  position,
  contact,
  signature,
) {
  try {
    const response = await fetch(`${API_URL}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_id: activityId,
        row_number: rowNumber,
        name,
        sex,
        office,
        position,
        contact,
        signature,
      }),
    });
    if (!response.ok) throw new Error("Failed to create attendance record");
    return await response.json();
  } catch (error) {
    console.error("Error creating attendance record:", error);
    return null;
  }
}

async function updateAttendanceRecord(
  id,
  name,
  sex,
  office,
  position,
  contact,
  signature,
) {
  try {
    const response = await fetch(`${API_URL}/attendance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sex, office, position, contact, signature }),
    });
    if (!response.ok) throw new Error("Failed to update attendance record");
    return await response.json();
  } catch (error) {
    console.error("Error updating attendance record:", error);
    return null;
  }
}

async function batchSaveAttendance(activityId, records) {
  try {
    const response = await fetch(`${API_URL}/attendance/batch/${activityId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    });
    if (!response.ok) throw new Error("Failed to save attendance batch");
    return await response.json();
  } catch (error) {
    console.error("Error saving attendance batch:", error);
    return null;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log("✓ Backend is running");
      return true;
    }
  } catch (error) {
    console.warn("⚠ Backend not available. Using fallback (localStorage)");
    return false;
  }
}

// Auto-check backend on load
checkBackendHealth();
