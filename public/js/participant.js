let savedActivities = [];
let allEvents = [];
let attendanceSummary = [];
let currentSelectedOption = "";

async function refreshActivities() {
  savedActivities = await getActivities();
}

async function loadAttendanceSummary() {
  attendanceSummary = await getAttendanceSummary();
  renderSubmittedList();
}

function renderSubmittedList() {
  const list = document.getElementById("submittedAttendanceList");
  const items = attendanceSummary.filter((it) => Number(it.record_count) > 0);

  if (!items.length) {
    if (attendanceSummary.length > 0) {
      list.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-4 text-center text-gray-500">
            Activities exist, but no attendance records found yet. Please submit attendance for a saved activity.
          </td>
        </tr>`;
    } else {
      list.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-4 text-center text-gray-500">
            No submitted files yet.
          </td>
        </tr>`;
    }
    return;
  }

  list.innerHTML = items
    .map(
      (it) => `
      <tr data-activity-id="${it.activity_id}">
        <td class="px-4 py-3"><p class="font-semibold text-gray-800">${it.name || "Untitled Activity"}</p></td>
        <td class="px-4 py-3 text-gray-600">${it.venue || "—"} · ${it.date || "—"}</td>
        <td class="px-4 py-3 text-gray-600">${it.record_count}</td>
        <td class="px-4 py-3 text-gray-500">${it.last_saved ? new Date(it.last_saved).toLocaleString() : "—"}</td>
        <td class="px-4 py-3 text-right space-x-2">
          <button data-activity-id="${it.activity_id}" data-action="view" class="action-file inline-flex items-center rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">View</button>
          <button data-activity-id="${it.activity_id}" data-action="edit" class="action-file inline-flex items-center rounded bg-yellow-500 px-3 py-1 text-xs font-semibold text-white hover:bg-yellow-600">Edit</button>
          <button data-activity-id="${it.activity_id}" data-action="print" class="action-file inline-flex items-center rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700">Print</button>
          <button data-activity-id="${it.activity_id}" data-action="download" class="action-file inline-flex items-center rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700">PDF</button>
        </td>
      </tr>`,
    )
    .join("");

  list.querySelectorAll(".action-file").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const activityId = btn.getAttribute("data-activity-id");
      const action = btn.getAttribute("data-action");
      const optionValue = `activity_${activityId}`;
      const select = document.getElementById("attendanceEventFilter");
      select.value = optionValue;
      currentSelectedOption = optionValue;

      if (action === "view") {
        await renderAttendanceSheet(optionValue, true);
      } else if (action === "edit") {
        await renderAttendanceSheet(optionValue, false);
      } else if (action === "print") {
        await renderAttendanceSheet(optionValue, true);
        printAttendanceSheet();
      } else if (action === "download") {
        await renderAttendanceSheet(optionValue, true);
        downloadAttendanceSheet();
      }
    });
  });
}

function getActivityFromOption(optionValue) {
  if (!optionValue) return null;
  if (optionValue.startsWith("data_")) {
    const index = parseInt(optionValue.replace("data_", ""), 10);
    return allEvents[index] || null;
  }
  if (optionValue.startsWith("activity_")) {
    const id = optionValue.replace("activity_", "");
    return savedActivities.find((a) => a.id === id) || null;
  }
  return null;
}

function setAttendanceLocked(locked) {
  const inputs = document.querySelectorAll("#attendanceTableBody input");
  inputs.forEach((inp) => (inp.disabled = locked));
  document.getElementById("addAttendanceRow").disabled = locked;
  document.getElementById("submitAttendance").disabled = locked;
  document
    .getElementById("addAttendanceRow")
    .classList.toggle("opacity-50", locked);
  document
    .getElementById("submitAttendance")
    .classList.toggle("opacity-50", locked);
}

async function renderAttendanceSheet(optionValue = null, lock = true) {
  const sheetContainer = document.getElementById("attendanceSheetContainer");
  const placeholder = document.getElementById("attendancePlaceholder");
  const tbody = document.getElementById("attendanceTableBody");

  if (!optionValue) {
    placeholder.classList.remove("hidden");
    sheetContainer.classList.add("hidden");
    document.getElementById("attendanceActivity").textContent = "—";
    document.getElementById("attendanceVenue").textContent = "—";
    document.getElementById("attendanceDate").textContent = "—";
    tbody.innerHTML = "";
    return;
  }

  placeholder.classList.add("hidden");
  sheetContainer.classList.remove("hidden");
  currentSelectedOption = optionValue;
  const activity = getActivityFromOption(optionValue);
  if (!activity) return;

  document.getElementById("attendanceActivity").textContent =
    activity.name || activity.activity || "—";
  document.getElementById("attendanceVenue").textContent =
    activity.venue || "—";
  document.getElementById("attendanceDate").textContent =
    activity.date || activity.link_of_encoded_names || "—";

  let savedRows = [];
  if (optionValue.startsWith("activity_")) {
    const activityId = optionValue.replace("activity_", "");
    savedRows = await getAttendanceRecords(activityId);
  }

  tbody.innerHTML = "";
  for (let i = 1; i <= 30; i++) {
    const rowData = savedRows.find((r) => r.row_number === i) || {};
    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td class="border border-gray-300 px-2 py-1 text-center font-semibold">${i}</td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" value="${rowData.name || ""}"/></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" maxlength="1" value="${rowData.sex || ""}"/></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" value="${rowData.office || ""}"/></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" value="${rowData.position || ""}"/></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" value="${rowData.contact || ""}"/></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" value="${rowData.signature || ""}"/></td>
      </tr>
    `,
    );
  }

  const shouldLock = lock && savedRows.length > 0;
  setAttendanceLocked(shouldLock);
}

function printAttendanceSheet() {
  const printWindow = window.open("", "", "height=600,width=800");
  const table = document.querySelector("#attendanceTableBody").parentElement
    .parentElement;
  const activity = document.getElementById("attendanceActivity").textContent;
  const venue = document.getElementById("attendanceVenue").textContent;
  const date = document.getElementById("attendanceDate").textContent;

  const printContent = `<!DOCTYPE html><html><head><title>ATTENDANCE SHEET - ${activity}</title><style>body{font-family:Arial,sans-serif;margin:20px;}.header{text-align:center;margin-bottom:20px;}.info{margin-bottom:15px;}.info p{margin:5px 0;font-weight:bold;}table{width:100%;border-collapse:collapse;margin-top:10px;}th,td{border:1px solid #000;padding:8px;text-align:left;font-size:11px;}th{background-color:#e0e0e0;font-weight:bold;}</style></head><body><div class="header"><h3>ATTENDANCE SHEET</h3><p>Department of Migrant Workers - Regional Office XIII (Caraga)</p></div><div class="info"><p>ACTIVITY: ${activity}</p><p>VENUE: ${venue}</p><p>DATE: ${date}</p></div>${table.outerHTML}</body></html>`;
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

function downloadAttendanceSheet() {
  const activity = document.getElementById("attendanceActivity").textContent;
  const venue = document.getElementById("attendanceVenue").textContent;
  const date = document.getElementById("attendanceDate").textContent;
  const table = document.querySelector("#attendanceTableBody").parentElement
    .parentElement;

  const htmlContent = `<!DOCTYPE html><html><head><title>ATTENDANCE SHEET</title><style>body{font-family:Arial,sans-serif;margin:40px;}.header{text-align:center;margin-bottom:30px;}.header h1{margin:0;font-size:20px;}.info{margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px;}.info p{margin:5px 0;font-weight:bold;font-size:12px;}table{width:100%;border-collapse:collapse;margin-top:15px;}th,td{border:1px solid #000;padding:8px;text-align:left;font-size:10px;}th{background-color:#d3d3d3;font-weight:bold;}.footer{margin-top:40px;font-size:10px;text-align:center;}</style></head><body><div class="logo">Republic of the Philippines<br>Department of Migrant Workers<br>Regional Office – XIII (Caraga)</div><div class="header"><h1>ATTENDANCE SHEET</h1></div><div class="info"><p>ACTIVITY : ${activity}</p><p>VENUE : ${venue}</p><p>DATE : ${date}</p></div>${table.outerHTML}<div class="footer"><p>By participating in this form you hereby freely and voluntarily give your consent to the collection, processing and sharing of your personal information as described in this PRIVACY Policy.</p></div></body></html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Attendance_${activity.replace(/\s/g, "_")}_${new Date().getTime()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function populateEventDropdown() {
  const select = document.getElementById("attendanceEventFilter");
  while (select.options.length > 1) select.remove(1);

  const submittedActivities = new Set(
    attendanceSummary
      .filter((it) => Number(it.record_count) > 0)
      .map((it) => it.activity_id),
  );

  allEvents.forEach((event, index) => {
    const existing = savedActivities.find(
      (a) =>
        a.name === event.activity &&
        a.venue === event.venue &&
        a.date === event.date,
    );

    if (existing && submittedActivities.has(existing.id)) {
      return;
    }

    const option = document.createElement("option");
    option.value = `data_${index}`;
    option.textContent = `[DATA] ${event.activity || "Activity"} - ${event.venue || "Venue"}`;
    select.appendChild(option);
  });

  savedActivities
    .filter((activity) => !submittedActivities.has(activity.id))
    .forEach((activity) => {
      const option = document.createElement("option");
      option.value = `activity_${activity.id}`;
      option.textContent = `${activity.name || "Activity"} - ${activity.venue || "Venue"}`;
      select.appendChild(option);
    });
}

async function loadData() {
  try {
    const response = await fetch("/data/peos-monitoring.json", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    allEvents = data.events || [];
  } catch (error) {
    console.error("Error loading local data", error);
    allEvents = [];
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  await refreshActivities();
  await loadAttendanceSummary();
  populateEventDropdown();
  await renderAttendanceSheet();

  document
    .getElementById("attendanceEventFilter")
    .addEventListener("change", async (e) => {
      const eventValue = e.target.value;
      currentSelectedOption = eventValue;
      await renderAttendanceSheet(eventValue, true);
    });

  document.getElementById("addAttendanceRow").addEventListener("click", () => {
    const tbody = document.getElementById("attendanceTableBody");
    const nextRow = tbody.querySelectorAll("tr").length + 1;
    tbody.insertAdjacentHTML(
      "beforeend",
      `\n      <tr>\n        <td class="border border-gray-300 px-2 py-1 text-center font-semibold">${nextRow}</td>\n        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>\n        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" maxlength="1" /></td>\n        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>\n        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>\n        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>\n        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>\n      </tr>
    `,
    );
  });

  document
    .getElementById("submitAttendance")
    .addEventListener("click", async () => {
      const eventValue = document.getElementById("attendanceEventFilter").value;
      if (!eventValue) {
        alert("Please select an activity first.");
        return;
      }

      let activityId;
      if (eventValue.startsWith("data_")) {
        const index = parseInt(eventValue.replace("data_", ""), 10);
        const event = allEvents[index];
        if (!event) return;

        const existing = savedActivities.find(
          (a) =>
            a.name === event.activity &&
            a.venue === event.venue &&
            a.date === event.date,
        );
        if (existing) {
          activityId = existing.id;
        } else {
          const created = await createActivity(
            event.activity || "Activity",
            event.venue || "",
            event.date || "",
          );
          if (!created) {
            alert("Failed to create activity. Please try again.");
            return;
          }
          await refreshActivities();
          activityId = created.id;
        }

        const optionValue = `activity_${activityId}`;
        document.getElementById("attendanceEventFilter").value = optionValue;
        currentSelectedOption = optionValue;
      } else if (eventValue.startsWith("activity_")) {
        activityId = eventValue.replace("activity_", "");
      } else {
        alert("Attendance can only be submitted for saved activities.");
        return;
      }

      const rows = document
        .getElementById("attendanceTableBody")
        .querySelectorAll("tr");
      const records = Array.from(rows)
        .map((row, index) => {
          const inputs = row.querySelectorAll("input");
          return {
            row_number: index + 1,
            name: inputs[0]?.value || "",
            sex: inputs[1]?.value || "",
            office: inputs[2]?.value || "",
            position: inputs[3]?.value || "",
            contact: inputs[4]?.value || "",
            signature: inputs[5]?.value || "",
          };
        })
        .filter(
          (r) =>
            r.name ||
            r.sex ||
            r.office ||
            r.position ||
            r.contact ||
            r.signature,
        );

      if (records.length === 0) {
        alert("No participant data to submit. Please add at least one row.");
        return;
      }

      const result = await batchSaveAttendance(activityId, records);
      if (!result) {
        alert("Failed to submit attendance. Please try again.");
        return;
      }

      setAttendanceLocked(true);
      console.log("Attendance submit result:", result);
      await refreshActivities();
      await loadAttendanceSummary();
      populateEventDropdown();
      highlightSubmittedFile(activityId);
      alert("✓ Attendance data submitted successfully!");
    });
});
