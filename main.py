import asyncio
import random
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="BharatBus-AI Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIONS = [
    "JAIPUR-ISBT-MAIN",
    "JODHPUR-CENTRAL-PL1",
    "KOTA-JUNCTION-PL2",
    "AJMER-BUS-TERMINAL",
    "UDAIPUR-CITY-HUB"
]

TELEMETRY_LOGS = []
ACTIVE_TICKETS = []
BUS_DISPATCH_SUGGESTIONS = []  # New: AI Fleet Dispatch Engine

class TelemetryPayload(BaseModel):
    station_id: str
    water_level: float
    cleanliness_score: float
    crowd_count: int
    temperature: float

def generate_random_telemetry():
    global TELEMETRY_LOGS, ACTIVE_TICKETS, BUS_DISPATCH_SUGGESTIONS
    station_id = random.choice(STATIONS)
    water_level = round(random.uniform(10.0, 100.0), 2)
    cleanliness_score = round(random.uniform(20.0, 100.0), 2)
    crowd_count = random.randint(10, 250)

    score = round((water_level * 0.4) + (cleanliness_score * 0.6), 2)
    status = "RED" if score < 50 or crowd_count > 200 else "GREEN"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Emergency Task Ticket Logic
    if status == "RED":
        issue_type = "High Crowd Emergency" if crowd_count > 200 else "Sanitation & Water Deficit"
        ticket = {
            "ticket_id": f"TICK-{random.randint(1000, 9999)}",
            "timestamp": timestamp,
            "station_id": station_id,
            "issue": issue_type,
            "assigned_to": f"Supervisor @ {station_id}",
            "status": "OPEN"
        }
        ACTIVE_TICKETS.insert(0, ticket)
        if len(ACTIVE_TICKETS) > 5:
            ACTIVE_TICKETS.pop()

    # 2. AI Fleet Optimization Algorithm (Overcrowding Smart Dispatch)
    if crowd_count > 180:
        buses_needed = max(1, (crowd_count - 150) // 25)
        dispatch_recommendation = {
            "dispatch_id": f"FLEET-{random.randint(100, 999)}",
            "timestamp": timestamp,
            "target_station": station_id,
            "extra_buses": buses_needed,
            "depot_source": "CENTRAL-RESERVE-DEPOT",
            "estimated_arrival": "12 Mins"
        }
        BUS_DISPATCH_SUGGESTIONS.insert(0, dispatch_recommendation)
        if len(BUS_DISPATCH_SUGGESTIONS) > 3:
            BUS_DISPATCH_SUGGESTIONS.pop()

    data_record = {
        "timestamp": timestamp,
        "station_id": station_id,
        "score": score,
        "status": status,
        "crowd_count": crowd_count
    }
    
    TELEMETRY_LOGS.insert(0, data_record)
    if len(TELEMETRY_LOGS) > 20:
        TELEMETRY_LOGS.pop()

async def auto_telemetry_loop():
    while True:
        try:
            generate_random_telemetry()
        except Exception as e:
            print(f"Error: {e}")
        await asyncio.sleep(4)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(auto_telemetry_loop())

@app.get("/")
def read_root():
    return {"system": "BharatBus-AI Core Engine", "status": "Operational"}

@app.get("/api/v1/telemetry/history")
def get_telemetry_history(limit: int = 10):
    return {"success": True, "history": TELEMETRY_LOGS[:limit]}

@app.get("/api/v1/tickets")
def get_tickets():
    return {"success": True, "tickets": ACTIVE_TICKETS}

@app.post("/api/v1/tickets/resolve/{ticket_id}")
def resolve_ticket(ticket_id: str):
    global ACTIVE_TICKETS
    ACTIVE_TICKETS = [t for t in ACTIVE_TICKETS if t["ticket_id"] != ticket_id]
    return {"success": True, "message": f"Ticket {ticket_id} resolved successfully"}

# New Endpoint: Fleet Recommendations
@app.get("/api/v1/fleet/suggestions")
def get_fleet_suggestions():
    return {"success": True, "dispatches": BUS_DISPATCH_SUGGESTIONS}