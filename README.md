# Vasukii — Smart Campus Venue, MDC Guest House & Parking Management Agent (PS-02)

**Domain:** Campus Administration and Facility Management (JK Lakshmipat University)

## 1. Problem Overview & Architecture
Vasukii is an autonomous multi-step Agentic AI system that cross-checks **987+ normalized academic timetable slots** across BTech & BBA Semesters 1–7 to discover clash-free classrooms, reserve Tech Block & LRC laboratories, allocate Amphitheatres, book MDC Guest House rooms, and coordinate VIP visitor parking in a single unified workflow.

### Key Capabilities Aligned with JKLU Evaluation Criteria
* **Multi-Step Agentic Reasoning & Tool Calling:** Decomposes complex natural-language event requests into sequential tool executions (`retrieve_campus_policies` → `check_availability_and_clashes` → `create_coordinated_booking_request`).
* **Multi-Format Timetable Parser (PDF / Excel / CSV):** Uses `pdfplumber`, `openpyxl`, and `pandas` to ingest multi-page PDF timetables, multi-sheet `.xlsx` workbooks, and `.csv` exports, automatically splitting compound practical labs (e.g., `TB-102/108` → `TB-102` and `TB-108`).
* **Multi-LLM Failover Router + Deterministic Constraint Engine:** Automatically routes across Groq (`Llama-3.3-70B`), Gemini, and OpenAI with a built-in local constraint solver fail-safe for 100% uptime.
* **Human-in-the-Loop (HITL) Governance & RBAC:** Enforces Role-Based Access Control across Student Organizers, Faculty, and Estate Administrators. Every booking is staged as `PENDING_APPROVAL` until approved by the Estate Admin.
* **Administrative Dashboard & Venue Utilisation Reports:** Live occupancy matrix, category-level occupancy analytics, and downloadable CSV utilisation reports.

## 2. Demo Login Credentials (RBAC)
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Student Organizer** | `organizer@jklu.edu.in` | `jklu@2026` | Request classrooms, labs, amphitheatres & parking |
| **Faculty Coordinator** | `faculty@jklu.edu.in` | `faculty@2026` | Book extra lectures, labs & MDC guest suites |
| **Estate Admin (HITL)** | `admin@jklu.edu.in` | `admin@2026` | Approve/Reject HITL queue, sync PDF/XLSX/CSV timetables |

## 3. Quick Start Instructions
```bash
cd backend
pip install -r requirements.txt
python seed_timetable.py
uvicorn main:app --reload --port 8000