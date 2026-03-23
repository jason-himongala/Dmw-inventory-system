"""Simplify the PEOS Monitoring workbook into JSON/CSV.

This script reads `resources/exel/PEOS Monitoring.xlsx` (Main Dashboard sheet)
and exports a simplified representation to:
- resources/json/peos-monitoring.json
- resources/csv/peos-monitoring.csv

Run:
  python scripts/simplify_peos.py

The output includes:
- `totals`: total participants + total PEOS conducted (if present)
- `events`: list of events with keys:
    activity, venue, facilitated_by, link_of_encoded_names, conducted_by,
    male, female

The script is intentionally tolerant of empty/blank rows and uses header row values
where available.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import openpyxl


def _to_str(value: Any) -> Optional[str]:
    if value is None:
        return None
    return str(value).strip()


def _find_col_index(row: List[Any], key: str) -> Optional[int]:
    key_lower = key.lower()
    for i, cell in enumerate(row):
        if isinstance(cell, str) and cell.strip().lower() == key_lower:
            return i
    return None


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    xlsx_path = root / "resources" / "exel" / "PEOS Monitoring.xlsx"

    out_json = root / "resources" / "json" / "peos-monitoring.json"
    out_csv = root / "resources" / "csv" / "peos-monitoring.csv"

    # Also write a public copy for the UI
    out_json_public = root / "public" / "data" / "peos-monitoring.json"
    out_csv_public = root / "public" / "data" / "peos-monitoring.csv"

    if not xlsx_path.exists():
        raise SystemExit(f"Could not find file: {xlsx_path}")

    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb.active

    totals: Dict[str, Any] = {}
    header_cols: Dict[str, int] = {}
    male_col: Optional[int] = None
    female_col: Optional[int] = None

    rows = list(ws.iter_rows(values_only=True))

    # Detect totals and header row
    header_row_index: Optional[int] = None
    for idx, row in enumerate(rows, start=1):
        if not any(cell is not None for cell in row):
            continue

        # Totals
        if len(row) > 2 and row[1] == "TOTAL PARTICIPANTS:":
            totals["total_participants"] = row[2]
        if len(row) > 2 and row[1] == "TOTAL PEOS CONDUCTED:":
            totals["total_peos_conducted"] = row[2]

        # Header row detection
        if header_row_index is None:
            # We require at least ACTIVITY+VENUE+FACILITATED BY to consider this the header row
            if (
                any(isinstance(c, str) and c.strip().lower() == "activity" for c in row)
                and any(isinstance(c, str) and c.strip().lower() == "venue" for c in row)
                and any(isinstance(c, str) and c.strip().lower() == "facilitated by" for c in row)
            ):
                header_row_index = idx
                header_cols["activity"] = _find_col_index(row, "ACTIVITY")
                header_cols["venue"] = _find_col_index(row, "VENUE")
                header_cols["facilitated_by"] = _find_col_index(row, "FACILITATED BY")
                header_cols["link_of_encoded_names"] = _find_col_index(row, "LINK OF THE ENCODED NAMES")
                header_cols["conducted_by"] = _find_col_index(row, "CONDUCTED BY")

        # Determine sex columns (may be in a row above header)
        if male_col is None or female_col is None:
            if any(isinstance(c, str) and c.strip().lower() == "male" for c in row):
                male_col = _find_col_index(row, "Male")
            if any(isinstance(c, str) and c.strip().lower() == "female" for c in row):
                female_col = _find_col_index(row, "Female")

    if header_row_index is None:
        raise SystemExit("Could not find a header row containing ACTIVITY/ VENUE/ FACILITATED BY")

    # Collect event rows after the header row
    events: List[Dict[str, Any]] = []
    for row in rows[header_row_index:]:
        if not any(cell is not None for cell in row):
            continue

        activity = _to_str(row[header_cols["activity"]]) if header_cols.get("activity") is not None else None
        if not activity:
            # Skip rows without an activity
            continue

        event: Dict[str, Any] = {
            "activity": activity,
            "venue": _to_str(row[header_cols["venue"]]) if header_cols.get("venue") is not None else None,
            "facilitated_by": _to_str(row[header_cols["facilitated_by"]]) if header_cols.get("facilitated_by") is not None else None,
            "link_of_encoded_names": _to_str(row[header_cols["link_of_encoded_names"]]) if header_cols.get("link_of_encoded_names") is not None else None,
            "conducted_by": _to_str(row[header_cols["conducted_by"]]) if header_cols.get("conducted_by") is not None else None,
            "male": row[male_col] if male_col is not None and male_col < len(row) else None,
            "female": row[female_col] if female_col is not None and female_col < len(row) else None,
        }

        events.append(event)

    simplified = {
        "totals": totals,
        "events": events,
    }

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    out_json_public.parent.mkdir(parents=True, exist_ok=True)
    out_csv_public.parent.mkdir(parents=True, exist_ok=True)

    with out_json.open("w", encoding="utf-8") as f:
        json.dump(simplified, f, ensure_ascii=False, indent=2)
    with out_json_public.open("w", encoding="utf-8") as f:
        json.dump(simplified, f, ensure_ascii=False, indent=2)

    # Write CSV
    fieldnames = [
        "activity",
        "venue",
        "facilitated_by",
        "link_of_encoded_names",
        "conducted_by",
        "male",
        "female",
    ]

    with out_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for event in events:
            writer.writerow({k: event.get(k, None) for k in fieldnames})

    # Copy CSV output to public for the UI (optional)
    with out_csv_public.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for event in events:
            writer.writerow({k: event.get(k, None) for k in fieldnames})

    print(f"Wrote simplified JSON: {out_json}")
    print(f"Wrote simplified CSV: {out_csv}")
    print(f"Wrote public JSON: {out_json_public}")
    print(f"Wrote public CSV: {out_csv_public}")


if __name__ == "__main__":
    main()
