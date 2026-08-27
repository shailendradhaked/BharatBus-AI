from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_recent_telemetry, save_telemetry
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="BharatBus-AI Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelemetryPayload(BaseModel):
    station_id: str
    water_level: float
    cleanliness_score: float
    crowd_count: int
    temperature: float

@app.on_event("startup")
def startup_event():
    init_db()

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