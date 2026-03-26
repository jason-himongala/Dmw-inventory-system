let savedActivities = [];

// ====================== LOAD ======================
async function refreshActivities() {
  savedActivities = await getActivities();
}

// ====================== DROPDOWN ======================
function populateEventDropdown() {
  const select = document.getElementById("attendanceEventFilter");
  if (!select) return; // Safety: not on participant page

  select.innerHTML = `<option value="">-- Select an activity --</option>`;

  const submittedIds = new Set(
    (window.attendanceSummary || [])
      .filter((it) => Number(it.record_count) > 0)
      .map((it) => String(it.activity_id)),
  );

  savedActivities.forEach((a) => {
    if (submittedIds.has(String(a.id))) return;

    const opt = document.createElement("option");
    opt.value = `activity_${a.id}`;
    opt.textContent = `${a.name} - ${a.venue}`;
    select.appendChild(opt);
  });
}

// ====================== ATTENDANCE SHEET ======================
async function renderAttendanceSheet(optionValue = null, lock = true) {
  const container = document.getElementById("attendanceSheetContainer");
  const placeholder = document.getElementById("attendancePlaceholder");
  const tbody = document.getElementById("attendanceTableBody");

  if (!optionValue) {
    if (container) container.classList.add("hidden");
    if (placeholder) placeholder.classList.remove("hidden");
    if (tbody) tbody.innerHTML = "";
    return;
  }

  if (container) container.classList.remove("hidden");
  if (placeholder) placeholder.classList.add("hidden");

  const activityId = optionValue.replace("activity_", "");
  const records = await getAttendanceRecords(activityId);
  const activity = savedActivities.find((a) => String(a.id) === activityId);

  document.getElementById("attendanceActivity").textContent =
    activity?.name || "—";
  document.getElementById("attendanceVenue").textContent =
    activity?.venue || "—";
  document.getElementById("attendanceDate").textContent = activity?.date || "—";

  if (tbody) {
    tbody.innerHTML = "";

    for (let i = 1; i <= 30; i++) {
      const r = records.find((x) => x.row_number === i) || {};

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td class="border border-gray-300 px-3 py-2 text-center font-medium">${i}</td>
          <td class="border border-gray-300 px-2 py-1"><input value="${r.name || ""}" class="w-full p-1 text-sm" ${lock ? "disabled" : ""}></td>
          <td class="border border-gray-300 px-2 py-1"><input value="${r.sex || ""}" class="w-full p-1 text-sm" maxlength="1" ${lock ? "disabled" : ""}></td>
          <td class="border border-gray-300 px-2 py-1"><input value="${r.office || ""}" class="w-full p-1 text-sm" ${lock ? "disabled" : ""}></td>
          <td class="border border-gray-300 px-2 py-1"><input value="${r.position || ""}" class="w-full p-1 text-sm" ${lock ? "disabled" : ""}></td>
          <td class="border border-gray-300 px-2 py-1"><input value="${r.contact || ""}" class="w-full p-1 text-sm" ${lock ? "disabled" : ""}></td>
          <td class="border border-gray-300 px-2 py-1"><input value="${r.signature || ""}" class="w-full p-1 text-sm" ${lock ? "disabled" : ""}></td>
        </tr>
      `,
      );
    }
  }
}

// ====================== PRINT ======================
function printAttendanceSheet() {
  const activity =
    document.getElementById("attendanceActivity")?.textContent || "";
  const venue = document.getElementById("attendanceVenue")?.textContent || "";
  const date = document.getElementById("attendanceDate")?.textContent || "";

  const tableContainer = document.querySelector("#attendanceTableBody")
    ?.parentElement?.parentElement;
  if (!tableContainer) return;

  const win = window.open("", "", "width=1000,height=800");
  win.document.write(`
    <h2 style="text-align:center;">Attendance Sheet</h2>
    <p style="text-align:center;"><b>${activity}</b></p>
    <p style="text-align:center;">${venue} | ${date}</p>
    ${tableContainer.outerHTML}
  `);
  win.document.close();
  win.print();
}

// ====================== PDF ======================
function downloadAttendancePDF() {
  if (typeof html2pdf === "undefined") {
    alert("html2pdf library is not loaded.");
    return;
  }
  const element = document.getElementById("attendanceSheetContainer");
  if (element) {
    html2pdf().from(element).save("attendance.pdf");
  }
}

// ====================== SUBMIT ======================
const submitBtn = document.getElementById("submitAttendance");
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    const eventValue = document.getElementById("attendanceEventFilter").value;
    if (!eventValue) {
      alert("Please select an activity first.");
      return;
    }

    const activityId = eventValue.replace("activity_", "");

    const rows = document.querySelectorAll("#attendanceTableBody tr");
    const records = Array.from(rows)
      .map((row, i) => {
        const inputs = row.querySelectorAll("input");
        return {
          row_number: i + 1,
          name: inputs[0]?.value.trim() || "",
          sex: inputs[1]?.value.trim() || "",
          office: inputs[2]?.value.trim() || "",
          position: inputs[3]?.value.trim() || "",
          contact: inputs[4]?.value.trim() || "",
          signature: inputs[5]?.value.trim() || "",
        };
      })
      .filter(
        (r) =>
          r.name || r.sex || r.office || r.position || r.contact || r.signature,
      );

    if (records.length === 0) {
      alert("Please fill at least one row with data.");
      return;
    }

    const result = await batchSaveAttendance(activityId, records);
    if (!result) {
      alert("Failed to submit attendance.");
      return;
    }

    alert(
      "✅ Attendance submitted successfully!\nYou can now view it in the Files page.",
    );

    await refreshActivities();
    if (typeof loadAttendanceSummary === "function")
      await loadAttendanceSummary();
    populateEventDropdown();

    // Reset UI
    document.getElementById("attendanceEventFilter").value = "";
    const container = document.getElementById("attendanceSheetContainer");
    const placeholder = document.getElementById("attendancePlaceholder");
    if (container) container.classList.add("hidden");
    if (placeholder) placeholder.classList.remove("hidden");
    const tbody = document.getElementById("attendanceTableBody");
    if (tbody) tbody.innerHTML = "";

    document.getElementById("attendanceActivity").textContent = "—";
    document.getElementById("attendanceVenue").textContent = "—";
    document.getElementById("attendanceDate").textContent = "—";
  });
}

// ====================== DROPDOWN CHANGE ======================
const filterSelect = document.getElementById("attendanceEventFilter");
if (filterSelect) {
  filterSelect.addEventListener("change", async (e) => {
    await renderAttendanceSheet(e.target.value, false);
  });
}

// ====================== INIT ======================
window.addEventListener("DOMContentLoaded", async () => {
  await refreshActivities();
  if (typeof loadAttendanceSummary === "function") {
    await loadAttendanceSummary();
  }
  populateEventDropdown();

  // Initial UI state (only if on participant page)
  const container = document.getElementById("attendanceSheetContainer");
  const placeholder = document.getElementById("attendancePlaceholder");
  if (container) container.classList.add("hidden");
  if (placeholder) placeholder.classList.remove("hidden");
});
