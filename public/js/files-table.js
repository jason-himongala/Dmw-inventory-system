// ====================== FILES TABLE ======================
// Do NOT declare savedActivities here - it's managed in participant.js

window.attendanceSummary = [];

// Load and render submitted files
async function loadAttendanceSummary() {
  try {
    window.attendanceSummary = await getAttendanceSummary();
    renderSubmittedList();
  } catch (error) {
    console.error("Failed to load attendance summary:", error);
    const list = document.getElementById("submittedAttendanceList");
    if (list) {
      list.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-red-500">Failed to load files</td></tr>`;
    }
  }
}

function renderSubmittedList() {
  const list = document.getElementById("submittedAttendanceList");
  if (!list) return;

  const items = window.attendanceSummary.filter(
    (it) => Number(it.record_count) > 0,
  );

  if (!items.length) {
    list.innerHTML = `
      <tr>
        <td colspan="4" class="px-4 py-4 text-center text-gray-500">
          No submitted files yet.
        </td>
      </tr>`;
    return;
  }

  list.innerHTML = items
    .map(
      (it) => `
      <tr data-activity-id="${it.activity_id}">
        <td class="px-4 py-3 font-semibold">${it.name || "Untitled Activity"}</td>
        <td class="px-4 py-3">${it.venue || "—"} · ${it.date || "—"}</td>
        <td class="px-4 py-3 text-gray-500">
          ${it.last_saved ? new Date(it.last_saved).toLocaleString() : "—"}
        </td>
        <td class="px-4 py-3 text-right space-x-2">
          <button data-id="${it.activity_id}" data-action="view"
            class="action-file bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-xs rounded">
            View
          </button>
          <button data-id="${it.activity_id}" data-action="print"
            class="action-file bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded">
            Print
          </button>
          <button data-id="${it.activity_id}" data-action="download"
            class="action-file bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-xs rounded">
            PDF
          </button>
        </td>
      </tr>
    `,
    )
    .join("");

  // Action buttons
  list.querySelectorAll(".action-file").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const optionValue = `activity_${id}`;

      if (action === "view") {
        await renderAttendanceSheet(optionValue, true);
      } else if (action === "print") {
        await renderAttendanceSheet(optionValue, true);
        printAttendanceSheet();
      } else if (action === "download") {
        await renderAttendanceSheet(optionValue, true);
        downloadAttendancePDF();
      }
    });
  });
}

// Expose functions globally so participant.js can call them
window.loadAttendanceSummary = loadAttendanceSummary;
window.renderSubmittedList = renderSubmittedList;
