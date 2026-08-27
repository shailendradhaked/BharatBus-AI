import asyncio
import random
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, get_recent_telemetry, save_telemetry

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

class TelemetryPayload(BaseModel):
    station_id: str
    water_level: float
    cleanliness_score: float
    crowd_count: int
    temperature: float

def generate_random_telemetry():
    station_id = random.choice(STATIONS)
    water_level = round(random.uniform(10.0, 100.0), 2)
    cleanliness_score = round(random.uniform(20.0, 100.0), 2)
    crowd_count = random.randint(10, 250)

    score = round((water_level * 0.4) + (cleanliness_score * 0.6), 2)
    status = "RED" if score < 50 or crowd_count > 200 else "GREEN"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    data_record = {
        "timestamp": timestamp,
        "station_id": station_id,
        "score": score,
        "status": status,
        "crowd_count": crowd_count
    }
    save_telemetry(data_record)

async def auto_telemetry_loop():
    while True:
        try:
            generate_random_telemetry()
        except Exception as e:
            print(f"Error in auto loop: {e}")
        await asyncio.sleep(5)  # Generates data every 5 seconds

@app.on_event("startup")
async def startup_event():
    init_db()
    asyncio.create_task(auto_telemetry_loop())

@app.get("/")
def read_root():
    return {"system": "BharatBus-AI Core Engine", "status": "Operational"}

@app.get("/api/v1/telemetry/history")
def get_telemetry_history(limit: int = 10):
    return get_recent_telemetry(limit)

@app.post("/api/v1/telemetry")
def process_telemetry(payload: TelemetryPayload):
    score = round((payload.water_level * 0.4) + (payload.cleanliness_score * 0.6), 2)
    status = "RED" if score < 50 or payload.crowd_count > 200 else "GREEN"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    data_record = {
        "timestamp": timestamp,
        "station_id": payload.station_id,
        "score": score,
        "status": status,
        "crowd_count": payload.crowd_count
    }

    save_telemetry(data_record)
    return {"success": True, "score": score, "status": status}