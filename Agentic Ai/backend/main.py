import os
import re
import io
import json
import uuid
import pandas as pd
import pdfplumber
from datetime import date
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from seed_timetable import extract_normalized_rooms

load_dotenv()

app = FastAPI(title="Vasukii — JKLU Smart Campus Venue, MDC & Parking Agentic AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL", "").strip(),
    os.getenv("SUPABASE_KEY", "").strip()
)


# ============================================================================
# 1. MULTI-LLM AUTOMATIC FAILOVER ENGINE
#    Gemini -> Groq -> OpenRouter
# ============================================================================

LLM_PROVIDERS = [
    {
        "name": "Google Gemini Flash",
        "id": "gemini",
        "api_key": os.getenv("GEMINI_API_KEY", "").strip(),
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-2.5-flash"
    },
    {
        "name": "Groq GPT-OSS 120B",
        "id": "groq",
        "api_key": os.getenv("GROQ_API_KEY", "").strip(),
        "base_url": "https://api.groq.com/openai/v1",
        "model": "openai/gpt-oss-120b"
    },
    {
        "name": "OpenRouter Free Models",
        "id": "openrouter",
        "api_key": os.getenv("OPENROUTER_API_KEY", "").strip(),
        "base_url": "https://openrouter.ai/api/v1",
        "model": "openrouter/free"
    }
]


def log_audit(session_id: str, provider: str, step_type: str, details: dict):
    try:
        supabase.table("audit_logs").insert({
            "session_id": session_id,
            "llm_provider_used": provider,
            "step_type": step_type,
            "details": details
        }).execute()
    except Exception as e:
        print(f"Audit log non-fatal warning: {e}")

def assistant_msg_to_dict(msg) -> dict:
    """Converts OpenAI SDK ChatCompletionMessage into a clean dict for multi-turn compatibility."""
    d = {
        "role": "assistant",
        "content": msg.content or ""
    }
    if getattr(msg, "tool_calls", None):
        d["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {
                    "name": tc.function.name,
                    "arguments": tc.function.arguments or "{}"
                }
            }
            for tc in msg.tool_calls
        ]
    return d

def call_llm_with_fallback(messages: list, tools: list, session_id: str, trace_log: list, force_fail_primary: bool = False):
    errors = []
    for idx, provider in enumerate(LLM_PROVIDERS):
        if force_fail_primary and idx == 0:
            sim_err = "Simulated Rate-Limit / Timeout on Primary Provider (429 Too Many Requests)"
            trace_log.append({
                "step": "FALLBACK_RECOVERY",
                "provider": provider["name"],
                "status": "FAILED_SWITCHING",
                "info": f"{sim_err} -> Automatically failing over to {LLM_PROVIDERS[1]['name']}"
            })
            log_audit(session_id, provider["name"], "FALLBACK_TRIGGERED", {"reason": sim_err})
            continue

        api_key = provider["api_key"]

        print(f"\n[AI FAILOVER] Trying: {provider['name']}")

        if not api_key or api_key.startswith("your_"):
            print(f"[AI FAILOVER] Skipping {provider['name']}: API key missing.")
            continue
        try:
            client = OpenAI(api_key=api_key, base_url=provider["base_url"], timeout=20.0)
            response = client.chat.completions.create(
                model=provider["model"],
                messages=messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.1
            )
            return response.choices[0].message, provider["name"]
        except Exception as e:
            err_msg = f"{provider['name']} error: {str(e)[:160]}"
            print("LLM Provider Error:", err_msg)
            errors.append(err_msg)
            trace_log.append({
                "step": "FALLBACK_RECOVERY",
                "provider": provider["name"],
                "status": "FAILED_SWITCHING",
                "info": f"Provider error ({str(e)[:90]}). Automatically switching to next backup LLM."
            })
            log_audit(session_id, provider["name"], "FALLBACK_TRIGGERED", {"error": err_msg})

    return None, "Built-in Autonomous Constraint Engine (Local Fail-Safe)"

# ============================================================================
# 2. AGENTIC TOOLS (Timetable Clash Solver, Specific Room Inspector, RAG, HITL)
# ============================================================================
def times_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    s1, e1 = str(start1)[:5], str(end1)[:5]
    s2, e2 = str(start2)[:5], str(end2)[:5]
    return max(s1, s2) < min(e1, e2)

def check_availability_and_clashes(
    category: str,
    booking_date: str,
    day_of_week: str,
    start_time: str,
    end_time: str,
    min_capacity: int = 1,
    specific_resource_id: Optional[str] = None
):
    min_capacity = int(min_capacity) if min_capacity else 1
    query = supabase.table("resources").select("*").eq("category", category).eq("is_active", True)
    if specific_resource_id and str(specific_resource_id).strip().lower() not in ["none", "null", ""]:
        query = query.eq("id", str(specific_resource_id).strip().upper())
    resources = query.execute().data

    timetables = supabase.table("academic_timetables").select("*").eq("day_of_week", day_of_week).execute().data
    bookings = supabase.table("bookings").select("*").eq("booking_date", booking_date).neq("status", "REJECTED").execute().data

    free_resources = []
    clashed_resources = []

    for res in resources:
        if res["capacity"] < min_capacity and not specific_resource_id:
            continue
        clashes = []
        for tt in timetables:
            if tt["resource_id"] == res["id"] and times_overlap(start_time, end_time, tt["start_time"], tt["end_time"]):
                clashes.append(
                    f"Academic Clash: {tt['semester']} {tt['section']} - {tt['course_name']} ({tt['faculty']}) [{str(tt['start_time'])[:5]}-{str(tt['end_time'])[:5]}]"
                )
        for bk in bookings:
            if bk["resource_id"] == res["id"] and times_overlap(start_time, end_time, bk["start_time"], bk["end_time"]):
                clashes.append(
                    f"Booking Clash: {bk['event_title']} ({bk['status']}) [{str(bk['start_time'])[:5]}-{str(bk['end_time'])[:5]}]"
                )

        if clashes:
            clashed_resources.append({
                "id": res["id"],
                "name": res["name"],
                "building": res["building"],
                "capacity": res["capacity"],
                "clashes": clashes
            })
        else:
            free_resources.append({
                "id": res["id"],
                "name": res["name"],
                "building": res["building"],
                "capacity": res["capacity"],
                "features": res["features"]
            })

    alternative_slots = []
    if len(free_resources) == 0:
        all_cat_res = supabase.table("resources").select("*").eq("category", category).gte("capacity", min_capacity).execute().data
        for cand_start, cand_end in [("09:00", "10:50"), ("11:00", "12:50"), ("13:00", "14:50"), ("15:00", "16:50"), ("17:00", "18:30")]:
            for res in all_cat_res[:6]:
                has_tt_clash = any(
                    tt["resource_id"] == res["id"] and times_overlap(cand_start, cand_end, tt["start_time"], tt["end_time"])
                    for tt in timetables
                )
                has_bk_clash = any(
                    bk["resource_id"] == res["id"] and times_overlap(cand_start, cand_end, bk["start_time"], bk["end_time"])
                    for bk in bookings
                )
                if not has_tt_clash and not has_bk_clash:
                    alternative_slots.append({
                        "resource_id": res["id"],
                        "resource_name": res["name"],
                        "capacity": res["capacity"],
                        "recommended_slot": f"{cand_start} - {cand_end}"
                    })
                    if len(alternative_slots) >= 5:
                        break
            if len(alternative_slots) >= 5:
                break

    return {
        "category": category,
        "requested_window": f"{booking_date} ({day_of_week}) {start_time}-{end_time}",
        "free_count": len(free_resources),
        "clashed_count": len(clashed_resources),
        "free_resources": free_resources[:6],
        "clashed_resources": clashed_resources[:6],
        "alternative_recommendations": alternative_slots
    }

def retrieve_campus_policies(category: Optional[str] = None):
    query = supabase.table("campus_policies").select("*")
    if category and str(category).strip().lower() not in ["none", "null", ""]:
        query = query.eq("category", str(category).strip())
    return {"policies": query.execute().data}

def create_coordinated_booking_request(
    resource_ids: List[str],
    organizer_email: str,
    event_title: str,
    booking_date: str,
    day_of_week: str,
    start_time: str,
    end_time: str,
    expected_attendees: int = 30
):
    group_id = f"JKLU-{str(uuid.uuid4())[:6].upper()}"
    staged_items = []
    for r_id in resource_ids:
        payload = {
            "booking_group_id": group_id,
            "resource_id": r_id,
            "organizer_email": organizer_email,
            "event_title": event_title,
            "booking_date": booking_date,
            "day_of_week": day_of_week,
            "start_time": start_time,
            "end_time": end_time,
            "expected_attendees": int(expected_attendees) if expected_attendees else 30,
            "status": "PENDING_APPROVAL"
        }
        res = supabase.table("bookings").insert(payload).execute()
        staged_items.append(res.data[0] if res.data else payload)

    return {
        "governance_state": "PENDING_ADMIN_HITL_APPROVAL",
        "booking_group_id": group_id,
        "resources_staged": resource_ids,
        "note": "State change paused at Human-in-the-Loop (HITL) Approval Gate. Campus Administrator must approve in the Admin Queue."
    }

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "retrieve_campus_policies",
            "description": "Retrieve official JKLU booking policies and SOPs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "One of: classroom, amphitheatre, laboratory, mdc_guest_room, parking_slot"
                    }
                },
                "required": ["category"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_availability_and_clashes",
            "description": "Check timetable clashes and find free venues across classrooms, amphitheatres, laboratories, mdc_guest_room, or parking_slot.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "One of: classroom, amphitheatre, laboratory, mdc_guest_room, parking_slot"
                    },
                    "booking_date": {"type": "string", "description": "YYYY-MM-DD format, e.g. 2026-11-16"},
                    "day_of_week": {"type": "string", "description": "Monday, Tuesday, Wednesday, Thursday, or Friday"},
                    "start_time": {"type": "string", "description": "HH:MM in 24h format, e.g. 09:00"},
                    "end_time": {"type": "string", "description": "HH:MM in 24h format, e.g. 10:50"},
                    "min_capacity": {"type": "integer", "description": "Minimum seating capacity needed"}
                },
                "required": ["category", "booking_date", "day_of_week", "start_time", "end_time", "min_capacity"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_coordinated_booking_request",
            "description": "Stage a coordinated booking into PENDING_APPROVAL state for Admin HITL review.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resource_ids": {"type": "array", "items": {"type": "string"}},
                    "organizer_email": {"type": "string"},
                    "event_title": {"type": "string"},
                    "booking_date": {"type": "string"},
                    "day_of_week": {"type": "string"},
                    "start_time": {"type": "string"},
                    "end_time": {"type": "string"},
                    "expected_attendees": {"type": "integer"}
                },
                "required": ["resource_ids", "organizer_email", "event_title", "booking_date", "day_of_week", "start_time", "end_time", "expected_attendees"]
            }
        }
    }
]

def run_deterministic_fallback_agent(prompt: str, organizer_email: str, session_id: str, trace_log: list):
    """Fail-safe autonomous execution if all cloud API keys are rate-limited or invalid."""
    provider = "Autonomous Constraint Solver (Local Fail-Safe)"
    p_lower = prompt.lower()

    day = "Tuesday" if "tuesday" in p_lower else "Wednesday" if "wednesday" in p_lower else "Thursday" if "thursday" in p_lower else "Friday" if "friday" in p_lower else "Monday"
    date_map = {"Monday": "2026-11-16", "Tuesday": "2026-11-17", "Wednesday": "2026-11-18", "Thursday": "2026-11-19", "Friday": "2026-11-20"}
    b_date = date_map[day]

    time_match = re.findall(r"\b(\d{2}:\d{2})\b", prompt)
    start_t = time_match[0] if len(time_match) >= 1 else "09:00"
    end_t = time_match[1] if len(time_match) >= 2 else "10:50"

    cap_match = re.search(r"(\d+)\s*(?:-|\s)*(?:student|person|people|attendee)", p_lower)
    cap = int(cap_match.group(1)) if cap_match else 40

    # 1. Policy Grounding
    pol = retrieve_campus_policies()
    trace_log.append({"step": "STEP_1_TOOL_EXEC", "provider": provider, "tool": "retrieve_campus_policies", "arguments": {"category": "all"}})
    trace_log.append({"step": "STEP_1_TOOL_RESULT", "provider": provider, "tool": "retrieve_campus_policies", "output": {"loaded_policies": len(pol["policies"])}})

    # 2. Check requested categories
    categories_to_check = []
    if "amphitheatre" in p_lower:
        categories_to_check.append(("amphitheatre", cap))
    if "lab" in p_lower or "tb-" in p_lower:
        categories_to_check.append(("laboratory", min(cap, 45)))
    if "classroom" in p_lower or "eb1" in p_lower or "eb2" in p_lower or not categories_to_check:
        categories_to_check.append(("classroom", cap))
    if "mdc" in p_lower or "guest" in p_lower:
        categories_to_check.append(("mdc_guest_room", 2))
    if "parking" in p_lower or "vip" in p_lower:
        categories_to_check.append(("parking_slot", 1))

    staged_ids = []
    report_lines = [f"### Autonomous Constraint & Clash Analysis ({day}, {b_date} | {start_t}–{end_t})\n"]

    for idx, (cat, req_cap) in enumerate(categories_to_check, start=2):
        res = check_availability_and_clashes(cat, b_date, day, start_t, end_t, req_cap)
        trace_log.append({
            "step": f"STEP_{idx}_TOOL_EXEC",
            "provider": provider,
            "tool": "check_availability_and_clashes",
            "arguments": {"category": cat, "booking_date": b_date, "day_of_week": day, "start_time": start_t, "end_time": end_t, "min_capacity": req_cap}
        })
        trace_log.append({
            "step": f"STEP_{idx}_TOOL_RESULT",
            "provider": provider,
            "tool": "check_availability_and_clashes",
            "output": res
        })

        report_lines.append(f"**Category: `{cat.upper()}` (Min Capacity: {req_cap})**")
        if res["clashed_resources"]:
            for cl in res["clashed_resources"][:3]:
                report_lines.append(f"- ❌ **{cl['id']} ({cl['name']})** — CLASH DETECTED: {'; '.join(cl['clashes'])}")
        if res["free_resources"]:
            chosen = res["free_resources"][0]
            staged_ids.append(chosen["id"])
            if cat in ["mdc_guest_room", "parking_slot"] and "2" in p_lower and len(res["free_resources"]) > 1:
                staged_ids.append(res["free_resources"][1]["id"])
                report_lines.append(f"- ✅ **Selected Clash-Free `{cat}`:** `{chosen['id']}` & `{res['free_resources'][1]['id']}`")
            else:
                report_lines.append(f"- ✅ **Selected Clash-Free `{cat}`:** `{chosen['id']}` ({chosen['name']}, Capacity: {chosen['capacity']})")
        report_lines.append("")

    if staged_ids:
        bk = create_coordinated_booking_request(
            resource_ids=staged_ids,
            organizer_email=organizer_email,
            event_title="Coordinated Campus Event / Workshop",
            booking_date=b_date,
            day_of_week=day,
            start_time=start_t,
            end_time=end_t,
            expected_attendees=cap
        )
        trace_log.append({
            "step": "STEP_FINAL_HITL_STAGE",
            "provider": provider,
            "tool": "create_coordinated_booking_request",
            "arguments": {"resource_ids": staged_ids, "booking_date": b_date, "start_time": start_t, "end_time": end_t},
            "output": bk
        })
        report_lines.append("### Governance & Human-in-the-Loop (HITL) Staging")
        report_lines.append(f"- **Booking Group ID:** `{bk['booking_group_id']}`")
        report_lines.append(f"- **Resources Staged:** `{', '.join(staged_ids)}`")
        report_lines.append("- **Current Status:** `PENDING_APPROVAL` (Awaiting Estate Admin verification in the HITL Approval Gate tab).")

    return {
        "session_id": session_id,
        "llm_provider": provider,
        "response": "\n".join(report_lines),
        "agent_trace": trace_log
    }

# ============================================================================
# 3. FASTAPI ROUTES
# ============================================================================
class AgentPromptRequest(BaseModel):
    prompt: str
    organizer_email: str = "organizer@jklu.edu.in"
    simulate_primary_failure: bool = False

@app.post("/api/agent/chat")

def run_agentic_workflow(req: AgentPromptRequest):
    session_id = f"TRACE-{str(uuid.uuid4())[:6].upper()}"
    trace_log = []

    today = date.today().strftime("%A, %B %d, %Y")

    system_prompt = f"""
You are Vasukii, the friendly AI campus assistant for
JK Lakshmipat University (JKLU).

Today's date is {today}.

YOUR PERSONALITY:
- Friendly, natural, polite and approachable.
- Talk like a helpful campus assistant, not a robot.
- Keep greetings and casual conversations short.
- Understand the context of the user's conversation.
- Avoid unnecessary technical language.

YOUR MAIN PURPOSE:
Help users with:
1. Campus venue and classroom management.
2. Venue availability and timetable clash detection.
3. Event and meeting room bookings.
4. MDC Guest House information and bookings.
5. Campus parking management.
6. Campus policies and booking procedures.
7. Questions about Vasukii and its features.

CONVERSATION RULES:
- Respond naturally to greetings such as Hi, Hello and Good morning.
- Answer questions about Vasukii and its capabilities.
- Answer questions about campus management.
- Ask for missing booking details when necessary.
- Do not call tools for greetings or ordinary conversation.
- Do not retrieve policies unless they are relevant.
- Do not check availability unless the user requests it.
- Never invent campus information or booking availability.
- Do not claim a booking is approved unless the database confirms it.

BOOKING SAFETY:
- First understand the user's requirements.
- Check relevant campus policies when needed.
- Check actual availability and timetable clashes.
- Recommend suitable resources.
- Never create a booking automatically.
- Explain that requests require admin approval.

OUT-OF-SCOPE QUESTIONS:
- You are not a general-purpose maths or homework assistant.
- Politely explain that your purpose is campus assistance.
- Redirect unrelated questions towards your campus capabilities.

RESPONSE STYLE:
- Use clear and concise language.
- Use bullet points when useful.
- Avoid unnecessary long explanations.
- Be friendly without being overly informal.
"""

    prompt = (req.prompt or "").strip()
    if not prompt:
        return {
            "session_id": session_id,
            "llm_provider": "Local Conversation Handler",
            "response": "Hi! I'm Vasukii. How can I help you today?",
            "agent_trace": []
        }

    # Handle simple greetings without calling campus tools.
    greeting_messages = {
        "hi": "Hey! 👋 Welcome to Vasukii. How can I help you today?",
        "hello": "Hello! 👋 I'm Vasukii, your JKLU campus assistant. What can I help you with?",
        "hey": "Hey there! 😊 What can I help you with?",
        "how are you": "I'm doing great, thanks for asking! 😊 Ready to help you with campus venues, bookings and parking.",
        "good morning": "Good morning! ☀️ How can I assist you today?",
        "good afternoon": "Good afternoon! How can I help you?",
        "good evening": "Good evening! How can I assist you?",
        "thank you": "You're welcome! 😊 Happy to help.",
        "thanks": "You're welcome! Let me know if you need anything else."
    }

    greeting_key = re.sub(r"[^a-z\s]", "", prompt.lower()).strip()

    greeting_key = re.sub(
        r"\b(vasukii|vasuki)\b", "", greeting_key
    ).strip()

    if greeting_key in greeting_messages:
        return {
            "session_id": session_id,
            "llm_provider": "Local Conversation Handler",
            "response": greeting_messages[greeting_key],
            "agent_trace": [{
                "step": "GREETING_HANDLER",
                "status": "SUCCESS",
                "info": "Handled greeting without calling campus tools."
            }]
        }

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"Organizer ({req.organizer_email}): {prompt}"
        }
    ]

    # Temporarily disable booking creation until explicit confirmation
    # and a secure confirmation endpoint are implemented.
    safe_tools = [
        tool for tool in AGENT_TOOLS
        if tool.get("function", {}).get("name")
        != "create_coordinated_booking_request"
    ]

    active_provider = "None"

    for step_num in range(1, 7):
        msg, active_provider = call_llm_with_fallback(
            messages,
            safe_tools,
            session_id,
            trace_log,
            force_fail_primary=(
                req.simulate_primary_failure and step_num == 1
            )
        )

        if msg is None:
            return {
                "session_id": session_id,
                "llm_provider": "Local Conversation Handler",
                "response": (
                    "I'm here! However, my AI language service is "
                    "currently unavailable. I can still respond to "
                    "basic greetings, but please try your campus "
                    "question again after the AI connection is restored. "
                    "No booking has been created."
                ),
                "agent_trace": trace_log
            }

        messages.append(assistant_msg_to_dict(msg))

        if not getattr(msg, "tool_calls", None):
            response_text = msg.content or "I'm here to help!"

            trace_log.append({
                "step": f"STEP_{step_num}_COMPLETE",
                "provider": active_provider,
                "status": "SUCCESS",
                "info": "Conversation completed."
            })

            log_audit(
                session_id,
                active_provider,
                "FINAL_SYNTHESIS",
                {"response": response_text}
            )

            return {
                "session_id": session_id,
                "llm_provider": active_provider,
                "response": response_text,
                "agent_trace": trace_log
            }

        for tool_call in msg.tool_calls:
            fn_name = tool_call.function.name

            try:
                fn_args = json.loads(
                    tool_call.function.arguments or "{}"
                )
            except Exception:
                fn_args = {}

            trace_log.append({
                "step": f"STEP_{step_num}_TOOL_EXEC",
                "provider": active_provider,
                "tool": fn_name,
                "arguments": fn_args
            })

            try:
                if fn_name == "retrieve_campus_policies":
                    result = retrieve_campus_policies(**fn_args)

                elif fn_name == "check_availability_and_clashes":
                    result = check_availability_and_clashes(**fn_args)

                else:
                    result = {
                        "error": (
                            f"Tool '{fn_name}' is unavailable "
                            "or not permitted."
                        )
                    }

            except Exception as tool_err:
                result = {"error": str(tool_err)}

            trace_log.append({
                "step": f"STEP_{step_num}_TOOL_RESULT",
                "provider": active_provider,
                "tool": fn_name,
                "output": result
            })

            log_audit(
                session_id,
                active_provider,
                f"TOOL_{fn_name.upper()}",
                {
                    "args": fn_args,
                    "result_summary": str(result)[:300]
                }
            )

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": fn_name,
                "content": json.dumps(result)
            })

    return {
        "session_id": session_id,
        "llm_provider": active_provider,
        "response": (
            "I couldn't complete that request in this attempt. "
            "Please try again."
        ),
        "agent_trace": trace_log
    }

@app.get("/api/dashboard/overview")
def get_dashboard_data(day: str = "Monday"):
    resources = supabase.table("resources").select("*").order("id").execute().data
    timetables = supabase.table("academic_timetables").select("*").eq("day_of_week", day).execute().data
    total_tt_count = supabase.table("academic_timetables").select("id", count="exact").execute().count
    bookings = supabase.table("bookings").select("*").order("created_at", desc=True).execute().data
    audits = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(30).execute().data
    policies = supabase.table("campus_policies").select("*").execute().data

    return {
        "resources": resources,
        "timetables": timetables,
        "total_timetable_slots": total_tt_count or len(timetables),
        "bookings": bookings,
        "audit_logs": audits,
        "policies": policies
    }

class AdminDecision(BaseModel):
    booking_id: str
    decision: str
    admin_remarks: str = "Approved after clash verification by JKLU Estate Admin"

@app.post("/api/admin/approve")
def approve_or_reject_booking(req: AdminDecision):
    if req.decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid decision")
    res = supabase.table("bookings").update({
        "status": req.decision,
        "admin_remarks": req.admin_remarks
    }).eq("id", req.booking_id).execute()

    log_audit("HITL-GATE", "HUMAN_ADMIN", f"BOOKING_{req.decision}", {
        "booking_id": req.booking_id,
        "remarks": req.admin_remarks
    })
    return {"status": "updated", "data": res.data}

# ============================================================================
# 3b. STUDENT / FACULTY AUTHENTICATION
#     Supabase Auth issues sessions; the existing `users` table holds the profile
#     (linked by email). Admin accounts are rejected here so admin access stays
#     separate from the Student/Faculty app.
# ============================================================================
UNIVERSITY_EMAIL_DOMAIN = os.getenv("UNIVERSITY_EMAIL_DOMAIN", "jklu.edu.in").strip().lower()
SELF_SERVICE_ROLES = {"organizer", "faculty"}
ADMIN_REJECTION = "Administrator accounts sign in through the Estate Admin console."
SESSION_EXPIRED = "Your session has expired. Please sign in again."


def _auth_client() -> Client:
    """A fresh client per auth call, so a user session never replaces the backend key on the shared client."""
    return create_client(os.getenv("SUPABASE_URL", "").strip(), os.getenv("SUPABASE_KEY", "").strip())


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _auth_error(e: Exception) -> HTTPException:
    msg = str(getattr(e, "message", "") or e)
    low = msg.lower()
    if "invalid login credentials" in low:
        return HTTPException(status_code=401, detail="Incorrect email or password.")
    if "already registered" in low or "already exists" in low:
        return HTTPException(status_code=409, detail="An account with this email already exists. Sign in instead.")
    if "email not confirmed" in low:
        return HTTPException(status_code=403, detail="Confirm your email address before signing in.")
    if "rate limit" in low:
        return HTTPException(status_code=429, detail="Too many attempts. Please wait a moment and try again.")
    if "password" in low:
        return HTTPException(status_code=400, detail=msg)
    print(f"Auth provider error: {msg[:200]}")
    return HTTPException(status_code=502, detail="The authentication service is unavailable. Please try again.")


def _public_user(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "department": row.get("department"),
    }


def _find_profile(email: str) -> Optional[dict]:
    rows = supabase.table("users").select("*").eq("email", email).limit(1).execute().data
    return rows[0] if rows else None


def _ensure_profile(auth_user) -> dict:
    """Returns the `users` row for a verified Supabase Auth user, creating it on first sign-in."""
    email = _normalize_email(getattr(auth_user, "email", "") or "")
    if not email:
        raise HTTPException(status_code=401, detail=SESSION_EXPIRED)
    profile = _find_profile(email)
    if profile is None:
        meta = getattr(auth_user, "user_metadata", None) or {}
        role = meta.get("role") if meta.get("role") in SELF_SERVICE_ROLES else "organizer"
        name = (str(meta.get("name") or "").strip() or email.split("@")[0])[:120]
        payload = {"name": name, "email": email, "role": role}
        department = str(meta.get("department") or "").strip()[:120]
        if department:
            payload["department"] = department
        profile = supabase.table("users").insert(payload).execute().data[0]
    if profile["role"] not in SELF_SERVICE_ROLES:
        raise HTTPException(status_code=403, detail=ADMIN_REJECTION)
    return profile


def _session_payload(session, profile: Optional[dict]) -> dict:
    return {
        "access_token": session.access_token if session else None,
        "refresh_token": session.refresh_token if session else None,
        "expires_in": session.expires_in if session else None,
        "user": _public_user(profile) if profile else None,
        "requires_email_confirmation": session is None,
    }


def _bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not signed in.")
    return authorization[7:].strip()


def get_current_profile(authorization: Optional[str] = Header(default=None)) -> dict:
    token = _bearer_token(authorization)
    try:
        res = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail=SESSION_EXPIRED)
    if not res or not res.user:
        raise HTTPException(status_code=401, detail=SESSION_EXPIRED)
    return _ensure_profile(res.user)


def _validated_profile_fields(name: str, department: Optional[str]) -> tuple:
    clean_name = (name or "").strip()
    clean_department = (department or "").strip()
    if not clean_name or len(clean_name) > 120:
        raise HTTPException(status_code=400, detail="Enter your full name (up to 120 characters).")
    if len(clean_department) > 120:
        raise HTTPException(status_code=400, detail="Department must be 120 characters or fewer.")
    return clean_name, clean_department or None


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str
    department: Optional[str] = None
    redirect_to: Optional[str] = None


class SignInRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ProfileUpdateRequest(BaseModel):
    name: str
    department: Optional[str] = None


@app.post("/api/auth/signup")
def sign_up(req: SignUpRequest):
    email = _normalize_email(req.email)
    name, department = _validated_profile_fields(req.name, req.department)
    if req.role not in SELF_SERVICE_ROLES:
        raise HTTPException(status_code=400, detail="Choose either Student or Faculty.")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+", email) or not email.endswith("@" + UNIVERSITY_EMAIL_DOMAIN):
        raise HTTPException(status_code=400, detail=f"Use your @{UNIVERSITY_EMAIL_DOMAIN} university email.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    existing = _find_profile(email)
    if existing and existing["role"] not in SELF_SERVICE_ROLES:
        raise HTTPException(status_code=403, detail=ADMIN_REJECTION)

    options = {"data": {"name": name, "role": req.role, "department": department}}
    if req.redirect_to and req.redirect_to.startswith(("https://", "http://localhost")):
        options["email_redirect_to"] = req.redirect_to
    try:
        res = _auth_client().auth.sign_up({"email": email, "password": req.password, "options": options})
    except Exception as e:
        raise _auth_error(e)

    if res.session is None:
        return _session_payload(None, None)
    return _session_payload(res.session, _ensure_profile(res.user))


@app.post("/api/auth/login")
def sign_in(req: SignInRequest):
    client = _auth_client()
    try:
        res = client.auth.sign_in_with_password({"email": _normalize_email(req.email), "password": req.password})
    except Exception as e:
        raise _auth_error(e)
    try:
        profile = _ensure_profile(res.user)
    except HTTPException:
        try:
            client.auth.sign_out()
        except Exception:
            pass
        raise
    return _session_payload(res.session, profile)


@app.post("/api/auth/refresh")
def refresh_session(req: RefreshRequest):
    try:
        res = _auth_client().auth.refresh_session(req.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail=SESSION_EXPIRED)
    if not res or not res.session:
        raise HTTPException(status_code=401, detail=SESSION_EXPIRED)
    return _session_payload(res.session, _ensure_profile(res.user))


@app.post("/api/auth/logout")
def sign_out(authorization: Optional[str] = Header(default=None)):
    token = _bearer_token(authorization)
    try:
        _auth_client().auth.admin.sign_out(token)
    except Exception as e:
        print(f"Sign-out non-fatal warning: {str(e)[:160]}")
    return {"status": "signed_out"}


@app.get("/api/auth/me")
def read_current_user(profile: dict = Depends(get_current_profile)):
    return _public_user(profile)


@app.patch("/api/auth/me")
def update_current_user(req: ProfileUpdateRequest, profile: dict = Depends(get_current_profile)):
    name, department = _validated_profile_fields(req.name, req.department)
    res = supabase.table("users").update({"name": name, "department": department}).eq("id", profile["id"]).execute()
    updated = res.data[0] if res.data else {**profile, "name": name, "department": department}
    return _public_user(updated)

# ============================================================================
# 4. UNIFIED MULTI-FORMAT TIMETABLE PARSER (PDF / EXCEL / CSV)
# ============================================================================
def parse_uploaded_file_to_df(filename: str, content: bytes) -> pd.DataFrame:
    fname = filename.lower()
    if fname.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    elif fname.endswith((".xlsx", ".xls")):
        xls = pd.ExcelFile(io.BytesIO(content))
        frames = [pd.read_excel(xls, sheet_name=s) for s in xls.sheet_names]
        return pd.concat(frames, ignore_index=True)
    elif fname.endswith(".pdf"):
        extracted_rows = []
        headers = None
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        clean_row = [cell.replace("\n", " ").strip() if cell else "" for cell in row]
                        if not any(clean_row):
                            continue
                        if headers is None and any(h in clean_row for h in ["Day", "Room", "Start Time", "Subject"]):
                            headers = clean_row
                        elif headers and len(clean_row) == len(headers) and clean_row != headers:
                            extracted_rows.append(dict(zip(headers, clean_row)))
        if not extracted_rows:
            raise HTTPException(status_code=400, detail="Could not detect structured timetable rows in PDF.")
        return pd.DataFrame(extracted_rows)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .pdf, .xlsx, .xls, or .csv")

@app.post("/api/admin/upload-timetable")
async def upload_and_sync_timetable(file: UploadFile = File(...), replace_existing: bool = True):
    content = await file.read()
    df = parse_uploaded_file_to_df(file.filename, content)

    records = []
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
        subject = str(row.get("Subject", "Session")).strip()
        faculty = str(row.get("Faculty", "TBA")).strip() if pd.notna(row.get("Faculty")) else "TBA"
        course_code = str(row.get("Course Code", "")).strip() if pd.notna(row.get("Course Code")) else ""
        class_type = str(row.get("Class Type", "L")).strip() if pd.notna(row.get("Class Type")) else "L"

        for rm in rooms:
            records.append({
                "resource_id": rm,
                "program": program,
                "semester": f"{program} {semester}",
                "section": f"Sec {section}",
                "course_code": course_code,
                "course_name": subject,
                "faculty": faculty,
                "class_type": class_type,
                "batch_group": "",
                "day_of_week": day,
                "start_time": start_t,
                "end_time": end_t
            })

    if replace_existing and records:
        supabase.table("academic_timetables").delete().neq("id", 0).execute()

    for i in range(0, len(records), 250):
        supabase.table("academic_timetables").insert(records[i:i + 250]).execute()

    log_audit("TIMETABLE-SYNC", "MULTI_FORMAT_PARSER", "LIVE_TIMETABLE_INGESTED", {
        "filename": file.filename,
        "format": file.filename.split(".")[-1].upper(),
        "raw_rows": len(df),
        "normalized_slots_inserted": len(records)
    })
    return {
        "status": "success",
        "filename": file.filename,
        "raw_rows": len(df),
        "normalized_slots_inserted": len(records)
    }

@app.get("/")
def serve_ui():
    return FileResponse("ui.html")
