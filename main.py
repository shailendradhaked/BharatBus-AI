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
ACTIVE_TICKETS = []  # न्यू Feature: टिकट स्टोर करने के लिए

class TelemetryPayload(BaseModel):
    station_id: str
    water_level: float
    cleanliness_score: float
    crowd_count: int
    temperature: float

def generate_random_telemetry():
    global TELEMETRY_LOGS, ACTIVE_TICKETS
    station_id = random.choice(STATIONS)
    water_level = round(random.uniform(10.0, 100.0), 2)
    cleanliness_score = round(random.uniform(20.0, 100.0), 2)
    crowd_count = random.randint(10, 250)

    score = round((water_level * 0.4) + (cleanliness_score * 0.6), 2)
    status = "RED" if score < 50 or crowd_count > 200 else "GREEN"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Critical Alert होने पर Auto-Ticket जनरेट करें
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
        # डुप्लीकेट रोकने के लिए केवल टॉप 5 एक्टिव टिकट्स रखें
        ACTIVE_TICKETS.insert(0, ticket)
        if len(ACTIVE_TICKETS) > 5:
            ACTIVE_TICKETS.pop()

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

# नया Endpoint: एक्टिव टिकट्स देखने के लिए
@app.get("/api/v1/tickets")
def get_tickets():
    return {"success": True, "tickets": ACTIVE_TICKETS}

# नया Endpoint: टिकट Resolve (बंद) करने के लिए
@app.post("/api/v1/tickets/resolve/{ticket_id}")
def resolve_ticket(ticket_id: str):
    global ACTIVE_TICKETS
    ACTIVE_TICKETS = [t for t in ACTIVE_TICKETS if t["ticket_id"] != ticket_id]
    return {"success": True, "message": f"Ticket {ticket_id} resolved successfully"}