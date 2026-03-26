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

function getAttendanceTableData() {
  const rows = [];
  const trs = document.querySelectorAll("#attendanceTableBody tr");

  trs.forEach((tr) => {
    const no = tr.querySelector("td:first-child")?.textContent.trim() || "";
    const inputs = Array.from(tr.querySelectorAll("input"));
    const rowValues = [
      no,
      inputs[0]?.value.trim() || "",
      inputs[1]?.value.trim() || "",
      inputs[2]?.value.trim() || "",
      inputs[3]?.value.trim() || "",
      inputs[4]?.value.trim() || "",
      inputs[5]?.value.trim() || "",
    ];

    // Keep all rows to preserve the full form, including blank rows.
    rows.push(rowValues);
  });

  return rows;
}

function loadImageAsDataURL(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function buildAttendanceTableHtml(rows) {
  const headers = [
    "NO",
    "NAME",
    "SEX",
    "OFFICE / MUNICIPALITY / SCHOOL",
    "POSITION / COURSE",
    "CONTACT NUMBER",
    "SIGNATURE",
  ];

  const headerHtml = headers
    .map(
      (label) =>
        `<th class="border px-2 py-1 text-left font-bold">${label}</th>`,
    )
    .join("");

  const bodyHtml = rows
    .map(
      (row) => `
      <tr>
        <td class="border px-2 py-1">${row[0] || ""}</td>
        <td class="border px-2 py-1">${row[1] || ""}</td>
        <td class="border px-2 py-1">${row[2] || ""}</td>
        <td class="border px-2 py-1">${row[3] || ""}</td>
        <td class="border px-2 py-1">${row[4] || ""}</td>
        <td class="border px-2 py-1">${row[5] || ""}</td>
        <td class="border px-2 py-1">${row[6] || ""}</td>
      </tr>`,
    )
    .join("");

  return `
    <div class="overflow-auto">
      <table style="width:100%;border-collapse:collapse;" >
        <thead>
          <tr>${headerHtml}</tr>
        </thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
  `;
}

function printAttendanceSheet() {
  const activity = document.getElementById("attendanceActivity").textContent;
  const venue = document.getElementById("attendanceVenue").textContent;
  const date = document.getElementById("attendanceDate").textContent;
  const rows = getAttendanceTableData();
  const tableHtml = buildAttendanceTableHtml(rows);

  const printWindow = window.open("", "", "height=600,width=800");
  const printContent = `<!DOCTYPE html><html><head><title>ATTENDANCE SHEET - ${activity}</title><style>body{font-family:Arial,sans-serif;margin:20px;} .header-wrap{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;} .header-wrap img{max-height:70px;width:auto;} .header-text{text-align:center;width:70%;} .header-text h1{margin:0;font-size:20px;font-family:'Times New Roman', serif;} .header-text h2{margin:0;font-size:16px;font-family:'Old English Text MT', serif;} .header-text p{margin:3px 0;font-size:9px;} .info{margin-bottom:12px;} .info p{margin:3px 0;font-weight:bold;} table{width:100%;border-collapse:collapse;margin-top:8px;} th,td{border:1px solid #000;padding:8px;text-align:left;font-size:10px;} th{background-color:#e0e0e0;font-weight:bold;}</style></head><body><div class="header-wrap"><img src="./images/dmw-right.png.jpg" alt="Left logo" /><div class="header-text"><h1>Republic of the Philippines</h1><h2>Department of Migrant Workers</h2><p>Regional Office – XIII (Caraga)</p><p>3rd floor, Esquina Dos Building J.C. Aquino Avenue, Doongan Road, Butuan City, Agusan del Norte, 8600</p></div><img src="./images/dmw-logo.png.jpg" alt="DMW logo" /></div><hr/> <div class="info"><p>ACTIVITY: ${activity}</p><p>VENUE: ${venue}</p><p>DATE: ${date}</p></div>${tableHtml}</body></html>`;
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

async function downloadAttendanceSheet() {
  const activity = document.getElementById("attendanceActivity").textContent;
  const venue = document.getElementById("attendanceVenue").textContent;
  const date = document.getElementById("attendanceDate").textContent;
  const rows = getAttendanceTableData();

  const fileName = `Attendance_${activity.replace(/\s/g, "_")}_${new Date().getTime()}`;
  const leftLogo = await loadImageAsDataURL("./images/dmw-right.png.jpg");
  const rightLogo = await loadImageAsDataURL("./images/dmw-logo.png.jpg");

  if (window.jspdf && window.jspdf.jsPDF) {
    const { jsPDF } = window.jspdf;
    // Long Bond paper: 8.5 x 13 inches = 215.9 x 330.2 mm
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [215.9, 330.2],
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 10;

    // Logos
    if (leftLogo) {
      doc.addImage(leftLogo, "PNG", 10, yPos - 2, 24, 24);
    }
    if (rightLogo) {
      doc.addImage(rightLogo, "PNG", pageWidth - 34, yPos - 2, 24, 24);
    }

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Republic of the Philippines", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 6;

    doc.setFontSize(14);
    doc.text("Department of Migrant Workers", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 6;

    doc.setFontSize(11);
    doc.text("Regional Office – XIII (Caraga)", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 5;

    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(
      "3rd floor, Esquina Dos Building J.C. Aquino Avenue, Doongan Road, Butuan City, Agusan del Norte, 8600",
      pageWidth / 2,
      yPos,
      { align: "center" },
    );
    yPos += 8;

    // Title
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("ATTENDANCE SHEET", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    // Activity, Venue, Date fields
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("ACTIVITY", 15, yPos);
    doc.setFont(undefined, "normal");
    doc.text(":", 35, yPos);
    doc.text(activity, 40, yPos);
    yPos += 6;

    doc.setFont(undefined, "bold");
    doc.text("VENUE", 15, yPos);
    doc.setFont(undefined, "normal");
    doc.text(":", 35, yPos);
    doc.text(venue, 40, yPos);
    yPos += 6;

    doc.setFont(undefined, "bold");
    doc.text("DATE", 15, yPos);
    doc.setFont(undefined, "normal");
    doc.text(":", 35, yPos);
    doc.text(date, 40, yPos);
    yPos += 8;

    // Consent statement
    doc.setFontSize(9);
    doc.setFont(undefined, "italic");
    const consentText =
      "By completing this form, you hereby freely and voluntarily give your consent to the collection, processing, and sharing of your personal information as described in the DMW Data Privacy Notice.";
    doc.text(consentText, 15, yPos, {
      maxWidth: pageWidth - 30,
      align: "left",
    });
    yPos += 12;

    // Table
    const header = [
      "NO",
      "NAME",
      "SEX",
      "OFFICE/MUNICIPALITY/SCHOOL",
      "POSITION/COURSE",
      "CONTACT NUMBER",
      "SIGNATURE",
    ];

    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        startY: yPos,
        head: [header],
        body: rows,
        styles: {
          fontSize: 7,
          cellPadding: 1,
          overflow: "linebreak",
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [30, 119, 190],
          textColor: 255,
          halign: "center",
        },
        margin: { top: yPos, left: 10, right: 10, bottom: 8 },
        pageBreak: "auto",
        didDrawPage: function (data) {
          // Footer on every page with bottom margin set to 0
          const footerLines = [
            "Website: www.dmw.gov.ph | Email: butuan@dmw.gov.ph | Landline: (085)815-1708",
            "Finance & Administrative Division: 0921-846 5934",
            "Migrant Workers Processing Division: 0993-279 8082",
            "Migrant Workers Protection Division: 0907-694 3525",
            "Welfare & Reintegration Services Division: 0948-475 6812 / 0950-305 7533",
          ];

          const footerHeight = 26 + footerLines.length * 4.5;
          const footerTop = pageHeight - footerHeight - 4;

          // Fill footer area for strong bottom alignment and no blank gaping space
          doc.setFillColor(245, 245, 245);
          doc.rect(8, footerTop - 2, pageWidth - 16, footerHeight + 6, "F");

          // Divider line above footer block
          doc.setDrawColor(120);
          doc.setLineWidth(0.5);
          doc.line(10, footerTop - 0.5, pageWidth - 10, footerTop - 0.5);

          doc.setFontSize(6);
          doc.setFont(undefined, "normal");

          let lineY = footerTop + 4;
          footerLines.forEach((line) => {
            doc.text(line, pageWidth / 2, lineY, {
              maxWidth: pageWidth - 24,
              align: "center",
            });
            lineY += 4.5;
          });
        },
      });
    }

    doc.save(`${fileName}.pdf`);
    return;
  }

  // Fallback: export HTML file containing values (safe for printing to PDF manually)
  const tableHtml = buildAttendanceTableHtml(rows);
  const htmlContent = `<!DOCTYPE html><html><head><title>ATTENDANCE SHEET</title><style>body{font-family:Arial,sans-serif;margin:40px;}.header{text-align:center;margin-bottom:20px;}.header h1{margin:0;font-size:18px;font-weight:bold;}.header h2{margin:5px 0;font-size:16px;font-weight:bold;}.header h3{margin:5px 0;font-size:12px;}.header p{margin:5px 0;font-size:9px;}.title{text-align:center;font-size:14px;font-weight:bold;margin:15px 0;}.info{margin:15px 0;}.info p{margin:5px 0;font-weight:bold;font-size:10px;}.consent{margin:15px 0;font-size:9px;font-style:italic;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #000;padding:8px;text-align:left;font-size:9px;}th{background-color:#d3d3d3;font-weight:bold;}.footer{margin-top:20px;font-size:8px;text-align:center;line-height:1.4;}</style></head><body><div class="header"><h1>Republic of the Philippines</h1><h2>Department of Migrant Workers</h2><h3>Regional Office – XIII (Caraga)</h3><p>3rd floor, Esquina Dos Building J.C. Aquino Avenue, Doongan Road, Butuan City, Agusan del Norte, 8600</p></div><div class="title">ATTENDANCE SHEET</div><div class="info"><p>ACTIVITY : ${activity}</p><p>VENUE : ${venue}</p><p>DATE : ${date}</p></div><div class="consent">By completing this form, you hereby freely and voluntarily give your consent to the collection, processing, and sharing of your personal information as described in the DMW Data Privacy Notice.</div>${tableHtml}<div class="footer"><p>Website: www.dmw.gov.ph | Email: butuan@dmw.gov.ph | Landline: (085)815-1708<br>Finance & Administrative Division: 0921-846 5934<br>Migrant Workers Processing Division: 0993-279 8082<br>Migrant Workers Protection Division: 0907-694 3525<br>Welfare & Reintegration Services Division:0948-475 6812 / 0950-305 7533</p></div></body></html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.html`;
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
      `
      <tr>
        <td class="border border-gray-300 px-2 py-1 text-center font-semibold">${nextRow}</td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" maxlength="1" /></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>
        <td class="border border-gray-300 px-2 py-1"><input type="text" class="w-full border-0 px-1 py-1 text-xs" /></td>
      </tr>
    `,
    );
  });

  document
    .getElementById("printAttendance")
    .addEventListener("click", async () => {
      const activityValue = document.getElementById(
        "attendanceEventFilter",
      ).value;
      if (activityValue) await renderAttendanceSheet(activityValue, true);
      printAttendanceSheet();
    });

  document
    .getElementById("downloadAttendance")
    .addEventListener("click", async () => {
      const activityValue = document.getElementById(
        "attendanceEventFilter",
      ).value;
      if (activityValue) await renderAttendanceSheet(activityValue, true);
      await downloadAttendanceSheet();
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
          const eventDate =
            event.date || event.link_of_encoded_names || "(TBD)";
          const created = await createActivity(
            event.activity || "Activity",
            event.venue || "",
            eventDate,
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

      // Lock the current sheet and hide it after save.
      setAttendanceLocked(true);
      document
        .getElementById("attendanceSheetContainer")
        .classList.add("hidden");
      document
        .getElementById("attendancePlaceholder")
        .classList.remove("hidden");
      document.getElementById("attendanceEventFilter").value = "";
      currentSelectedOption = "";

      // Refresh files table and make the activity appear in Files section.
      console.log("Attendance submit result:", result);
      await refreshActivities();
      await loadAttendanceSummary();
      populateEventDropdown();
      highlightSubmittedFile(activityId);
      alert("✓ Attendance data submitted successfully!");
    });
});
