import os
import re
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def normalize_single_room(r: str) -> str:
    r = r.strip().replace(")", "")
    if r in ["IET Amphitheatre", "IET Amphi", "AMPHI-IET"]:
        return "AMPHI-IET"
    if r in ["106", "102"]:
        return f"IM-{r}"
    if r == "EB-006":
        return "EB2-006"
    if r == "TB-05":
        return "TB-105"
    m = re.match(r"^(TB|LRC)(\d+)$", r, re.IGNORECASE)
    if m:
        return f"{m.group(1).upper()}-{m.group(2)}"
    return r

def extract_normalized_rooms(row) -> list:
    raw_room = str(row.get("Room", "")).strip() if pd.notna(row.get("Room")) else ""
    home_room = str(row.get("Section Home Room (PDF header)", "")).strip() if pd.notna(row.get("Section Home Room (PDF header)")) else ""

    if not raw_room or raw_room.lower() == "nan" or raw_room.upper() == "BYOD":
        raw_room = home_room if (home_room and home_room.lower() != "nan") else "UNASSIGNED"

    raw_room = raw_room.replace(")", "").strip()
    if raw_room == "UNASSIGNED":
        return []

    if "/" in raw_room:
        parts = raw_room.split("/")
        base_prefix_match = re.match(r"^([A-Za-z]+-?)", parts[0])
        prefix = base_prefix_match.group(1) if base_prefix_match else "TB-"
        if not prefix.endswith("-"):
            prefix += "-"
        expanded = []
        for idx, part in enumerate(parts):
            if idx == 0:
                expanded.append(normalize_single_room(part))
            else:
                expanded.append(f"{prefix}{part.strip()}")
        return expanded

    return [normalize_single_room(raw_room)]

def seed_master_csv(csv_path="Master_Timetable.csv"):
    supabase = create_client(os.getenv("SUPABASE_URL", ""), os.getenv("SUPABASE_KEY", ""))
    df = pd.read_csv(csv_path)
    records_to_insert = []

    for _, row in df.iterrows():
        rooms = extract_normalized_rooms(row)
        if not rooms:
            continue

        program = str(row.get("Program", "BTech")).strip()
        sem_val = row.get("Semester")
        semester = f"Sem {int(float(sem_val))}" if pd.notna(sem_val) and str(sem_val).strip() != "" else "General"
        section = str(row.get("Section", "A")).strip()
        day = str(row.get("Day", "Monday")).strip()
        start_t = str(row.get("Start Time", "09:00")).strip()
        end_t = str(row.get("End Time", "09:50")).strip()
        subject = str(row.get("Subject", "Academic Session")).strip()
        faculty = str(row.get("Faculty", "TBA")).strip() if pd.notna(row.get("Faculty")) else "TBA"
        course_code = str(row.get("Course Code", "")).strip() if pd.notna(row.get("Course Code")) else ""
        class_type = str(row.get("Class Type", "L")).strip() if pd.notna(row.get("Class Type")) else "L"
        batch = str(row.get("Batch", "")).strip() if pd.notna(row.get("Batch")) else ""
        group = str(row.get("Group", "")).strip() if pd.notna(row.get("Group")) else ""
        batch_group = " | ".join([x for x in [batch, group] if x])

        for rm in rooms:
            records_to_insert.append({
                "resource_id": rm,
                "program": program,
                "semester": f"{program} {semester}",
                "section": f"Sec {section}",
                "course_code": course_code,
                "course_name": subject,
                "faculty": faculty,
                "class_type": class_type,
                "batch_group": batch_group,
                "day_of_week": day,
                "start_time": start_t,
                "end_time": end_t
            })

    print(f"Clearing old academic_timetables and inserting {len(records_to_insert)} normalized JKLU timetable slots...")
    supabase.table("academic_timetables").delete().neq("id", 0).execute()

    for i in range(0, len(records_to_insert), 250):
        chunk = records_to_insert[i:i + 250]
        supabase.table("academic_timetables").insert(chunk).execute()
        print(f"Inserted rows {i} to {i + len(chunk)}...")

    print("Successfully seeded all real JKLU Master Timetable slots into Supabase!")

if __name__ == "__main__":
    seed_master_csv()
