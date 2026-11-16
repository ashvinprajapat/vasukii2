-- ============================================================================
-- JKLU SMART CAMPUS VENUE, MDC GUEST HOUSE & PARKING AGENT (PS-02)
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS academic_timetables CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS campus_policies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS (RBAC: organizer = Student, faculty, admin)
-- Student/Faculty rows are created by the backend on first sign-in after Supabase Auth signup
-- (linked by email). Admin rows are managed separately and cannot be created via signup.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('organizer', 'admin', 'faculty')) NOT NULL,
    department TEXT
);

-- 2. RESOURCES (34 Real CSV Venues + 2nd Amphitheatre + 6 MDC Rooms + 6 Parking Bays)
CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('classroom', 'amphitheatre', 'laboratory', 'mdc_guest_room', 'parking_slot')) NOT NULL,
    building TEXT NOT NULL,
    capacity INT NOT NULL,
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. MULTI-SEMESTER ACADEMIC TIMETABLES (Populated from Master_Timetable.csv)
CREATE TABLE academic_timetables (
    id SERIAL PRIMARY KEY,
    resource_id TEXT REFERENCES resources(id) ON DELETE CASCADE,
    program TEXT NOT NULL,
    semester TEXT NOT NULL,
    section TEXT NOT NULL,
    course_code TEXT,
    course_name TEXT NOT NULL,
    faculty TEXT,
    class_type TEXT,
    batch_group TEXT,
    day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 4. BOOKINGS & RESERVATIONS (Human-in-the-Loop Approval Gate)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_group_id TEXT NOT NULL,
    resource_id TEXT REFERENCES resources(id) ON DELETE CASCADE,
    organizer_email TEXT NOT NULL,
    event_title TEXT NOT NULL,
    booking_date DATE NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    expected_attendees INT DEFAULT 1,
    status TEXT CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING_APPROVAL',
    admin_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CAMPUS POLICIES & SOPs (Zero-Hallucination RAG Grounding)
CREATE TABLE campus_policies (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    rule_title TEXT NOT NULL,
    policy_text TEXT NOT NULL
);

-- 6. AGENT AUDIT LOGS & TRACEABILITY
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    llm_provider_used TEXT NOT NULL,
    step_type TEXT NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SEED USERS, REAL JKLU VENUES, MDC GUEST HOUSE, PARKING & POLICIES
-- ============================================================================

INSERT INTO users (name, email, role) VALUES
('JKLU Estate & Facility Admin', 'admin@jklu.edu.in', 'admin');

INSERT INTO resources (id, name, category, building, capacity, features) VALUES
-- Amphitheatres (2)
('AMPHI-IET', 'IET Indoor Amphitheatre', 'amphitheatre', 'IET Block', 180, ARRAY['Dolby PA System', 'Stage Lighting', 'Smart Podium', 'Central AC']),
('AMPHI-LAWN', 'Central Lawn Open Amphitheatre', 'amphitheatre', 'Central Lawn', 350, ARRAY['Open Air Stage', 'Concert Truss', 'High-Output Audio']),

-- EB1 Classrooms (5)
('EB1-002', 'EB1 Lecture Hall 002', 'classroom', 'Executive Block 1', 65, ARRAY['Projector', 'Smartboard', 'AC']),
('EB1-101', 'EB1 Classroom 101', 'classroom', 'Executive Block 1', 65, ARRAY['Projector', 'Whiteboard', 'AC']),
('EB1-102', 'EB1 Classroom 102', 'classroom', 'Executive Block 1', 65, ARRAY['Projector', 'Whiteboard', 'AC']),
('EB1-103', 'EB1 Classroom 103', 'classroom', 'Executive Block 1', 65, ARRAY['Projector', 'Whiteboard', 'AC']),
('EB1-104', 'EB1 Classroom 104', 'classroom', 'Executive Block 1', 65, ARRAY['Projector', 'Whiteboard', 'AC']),

-- EB2 Classrooms (13)
('EB2-001', 'EB2 Classroom 001', 'classroom', 'Academic Block EB2', 60, ARRAY['Projector', 'AC']),
('EB2-004', 'EB2 Classroom 004', 'classroom', 'Academic Block EB2', 60, ARRAY['Projector', 'AC']),
('EB2-005', 'EB2 Classroom 005', 'classroom', 'Academic Block EB2', 60, ARRAY['Projector', 'AC']),
('EB2-006', 'EB2 Classroom 006', 'classroom', 'Academic Block EB2', 60, ARRAY['Projector', 'AC']),
('EB2-101', 'EB2 Classroom 101', 'classroom', 'Academic Block EB2', 70, ARRAY['Smartboard', 'Projector', 'AC']),
('EB2-102', 'EB2 Classroom 102', 'classroom', 'Academic Block EB2', 70, ARRAY['Smartboard', 'Projector', 'AC']),
('EB2-104', 'EB2 Classroom 104', 'classroom', 'Academic Block EB2', 70, ARRAY['Projector', 'AC']),
('EB2-105', 'EB2 Classroom 105', 'classroom', 'Academic Block EB2', 70, ARRAY['Projector', 'AC']),
('EB2-106', 'EB2 Classroom 106', 'classroom', 'Academic Block EB2', 70, ARRAY['Projector', 'AC']),
('EB2-202', 'EB2 Seminar Hall 202', 'classroom', 'Academic Block EB2', 80, ARRAY['Dual Display', 'Wireless Mic', 'AC']),
('EB2-204', 'EB2 Classroom 204', 'classroom', 'Academic Block EB2', 65, ARRAY['Projector', 'AC']),
('EB2-205', 'EB2 Classroom 205', 'classroom', 'Academic Block EB2', 65, ARRAY['Projector', 'AC']),
('EB2-206', 'EB2 Classroom 206', 'classroom', 'Academic Block EB2', 65, ARRAY['Projector', 'AC']),

-- IM & AIC Classrooms (3)
('IM-102', 'IM Management Classroom 102', 'classroom', 'Institute of Management', 60, ARRAY['Case-Study Seating', 'Projector', 'AC']),
('IM-106', 'IM Management Classroom 106', 'classroom', 'Institute of Management', 60, ARRAY['Case-Study Seating', 'Projector', 'AC']),
('AIC-004', 'AIC Incubation Seminar Room 004', 'classroom', 'Atal Incubation Centre', 50, ARRAY['Pitch Screen', 'Video Conferencing', 'AC']),

-- Tech Block & LRC Laboratories (12)
('TB-102', 'Tech Block Computing Lab 102', 'laboratory', 'Tech Block (IET)', 40, ARRAY['Linux/Windows PCs', 'High-Speed LAN', 'AC']),
('TB-104', 'Tech Block Systems Lab 104', 'laboratory', 'Tech Block (IET)', 40, ARRAY['Workstations', 'Projector', 'AC']),
('TB-105', 'Tech Block Programming Lab 105', 'laboratory', 'Tech Block (IET)', 45, ARRAY['Workstations', 'Projector', 'AC']),
('TB-106', 'Tech Block AI & ML Lab 106', 'laboratory', 'Tech Block (IET)', 45, ARRAY['GPU Workstations', 'Smartboard', 'AC']),
('TB-107', 'Tech Block Networks & IoT Lab 107', 'laboratory', 'Tech Block (IET)', 40, ARRAY['Cisco Routers', 'IoT Sensor Kits', 'AC']),
('TB-108', 'Tech Block Electronics Lab 108', 'laboratory', 'Tech Block (IET)', 40, ARRAY['Oscilloscopes', 'Embedded Kits', 'AC']),
('TB-109', 'Tech Block CAD & Robotics Lab 109', 'laboratory', 'Tech Block (IET)', 45, ARRAY['CAD Workstations', 'Robotics Arms', 'AC']),
('TB-110', 'Tech Block Cyber Security Lab 110', 'laboratory', 'Tech Block (IET)', 40, ARRAY['Isolated Lab Network', 'Projector', 'AC']),
('TB-112', 'Tech Block Digital Circuits Lab 112', 'laboratory', 'Tech Block (IET)', 40, ARRAY['VLSI Kits', 'Signal Generators', 'AC']),
('TB-114', 'Tech Block Data Science Lab 114', 'laboratory', 'Tech Block (IET)', 45, ARRAY['High-RAM Systems', 'Projector', 'AC']),
('LRC-002', 'LRC Digital Simulation Lab 002', 'laboratory', 'Learning Resource Centre', 50, ARRAY['High-Speed Terminals', 'Quiet Zone', 'AC']),
('LRC-007', 'LRC Research Computing Lab 007', 'laboratory', 'Learning Resource Centre', 50, ARRAY['Dual-Monitor Systems', 'Projector', 'AC']),

-- MDC Guest House Rooms (6)
('MDC-101', 'MDC VIP Executive Suite 101', 'mdc_guest_room', 'Management Development Centre', 2, ARRAY['King Bed', 'Living Lounge', 'Work Desk', 'Meals Included']),
('MDC-102', 'MDC VIP Executive Suite 102', 'mdc_guest_room', 'Management Development Centre', 2, ARRAY['King Bed', 'Living Lounge', 'Work Desk', 'Meals Included']),
('MDC-103', 'MDC Deluxe Twin Room 103', 'mdc_guest_room', 'Management Development Centre', 2, ARRAY['Twin Beds', 'High-Speed Wi-Fi', 'Breakfast']),
('MDC-104', 'MDC Deluxe Twin Room 104', 'mdc_guest_room', 'Management Development Centre', 2, ARRAY['Twin Beds', 'High-Speed Wi-Fi', 'Breakfast']),
('MDC-105', 'MDC Standard Guest Room 105', 'mdc_guest_room', 'Management Development Centre', 2, ARRAY['Queen Bed', 'Study Table', 'Wi-Fi']),
('MDC-106', 'MDC Standard Guest Room 106', 'mdc_guest_room', 'Management Development Centre', 2, ARRAY['Queen Bed', 'Study Table', 'Wi-Fi']),

-- Visitor Parking Slots (6)
('PARK-VIP1', 'Gate 1 VIP Visitor Bay 01', 'parking_slot', 'Main Gate 1 VIP Zone', 1, ARRAY['Covered Canopy', 'EV Fast Charger', 'Security Escort']),
('PARK-VIP2', 'Gate 1 VIP Visitor Bay 02', 'parking_slot', 'Main Gate 1 VIP Zone', 1, ARRAY['Covered Canopy', 'EV Fast Charger']),
('PARK-MDC1', 'MDC Guest House Parking Bay 01', 'parking_slot', 'MDC Front Porch', 1, ARRAY['Direct Guest House Access', '24x7 Guard']),
('PARK-MDC2', 'MDC Guest House Parking Bay 02', 'parking_slot', 'MDC Front Porch', 1, ARRAY['Direct Guest House Access', '24x7 Guard']),
('PARK-VIS1', 'Academic Block Visitor Bay 01', 'parking_slot', 'EB1/EB2 Visitor Zone', 1, ARRAY['Standard Car Slot']),
('PARK-VIS2', 'Academic Block Visitor Bay 02', 'parking_slot', 'EB1/EB2 Visitor Zone', 1, ARRAY['Standard Car Slot']);

-- Seed Official Campus Booking Policies (For Zero-Hallucination RAG)
INSERT INTO campus_policies (category, rule_title, policy_text) VALUES
('classroom', 'Academic Timetable Priority Rule', 'Classrooms in EB1, EB2, IM, and AIC cannot be booked if any BTech or BBA section has a scheduled Lecture (L) or Tutorial (T) in that slot. Extra lectures, quizzes, or club events must use genuinely free slots and pass Admin HITL approval.'),
('amphitheatre', 'Amphitheatre Reservation SOP', 'AMPHI-IET (180 cap) and AMPHI-LAWN (350 cap) require a minimum event size of 50 attendees or a university-level workshop/talk. Any clash with scheduled classes in AMPHI-IET automatically triggers an alternative slot or venue recommendation.'),
('laboratory', 'Tech Block & LRC Lab Eligibility Policy', 'Laboratories (TB-102 to TB-114, LRC-002, LRC-007) are strictly reserved for hands-on coding sessions, hackathons, practical exams, or technical workshops. Compound lab sessions (e.g., TB-102/108) block both individual laboratories.'),
('mdc_guest_room', 'MDC Guest House Accommodation Rule', 'MDC Guest House suites (MDC-101 to MDC-106) are allocated exclusively for external speakers, hackathon judges, visiting faculty, and university guests. Maximum occupancy is 2 guests per room. Requires Admin HITL approval before check-in confirmation.'),
('parking_slot', 'Visitor & VIP Parking Protocol', 'VIP Bays (PARK-VIP1, PARK-VIP2) are prioritized for chief guests and external speakers. Guests staying at the MDC Guest House should be coordinated with PARK-MDC1 or PARK-MDC2.');
