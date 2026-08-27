from fastapi import FastAPI
from pydantic import BaseModel
from analytics import calculate_infrastructure_score, generate_escalations
from database import log_telemetry, init_db
import sqlite3

app = FastAPI(
    title="BharatBus AI Infrastructure Core Engine",
    description="Real-time Infrastructure Intelligence Layer",
    version="1.0.0"
)

# Initialize Database on Startup
init_db()

class SensorTelemetry(BaseModel):
    station_id: str
    water_tank_level_pct: float
    ambient_temp_c: float
    dustbin_fill_pct: float
    platform_crowd_count: int

@app.get("/")
def read_root():
    return {"system": "BharatBus AI Core Engine", "status": "Operational"}

@app.post("/api/v1/telemetry/process")
def process_telemetry(data: SensorTelemetry):
    scores = calculate_infrastructure_score(
        data.water_tank_level_pct,
        data.ambient_temp_c,
        data.dustbin_fill_pct,
        data.platform_crowd_count
    )

    alerts = generate_escalations(
        data.water_tank_level_pct,
        data.dustbin_fill_pct,
        data.platform_crowd_count
    )

    log_telemetry(
        station_id=data.station_id,
        score=scores["bharat_infrastructure_score"],
        status=scores["health_status"],
        crowd_count=data.platform_crowd_count
    )

    return {
        "success": True,
        "data": {
            "station_id": data.station_id,
            "bharat_infrastructure_score": scores["bharat_infrastructure_score"],
            "health_status": scores["health_status"],
            "sub_scores": scores["sub_scores"],
            "active_alerts": alerts
        }
    }

@app.get("/api/v1/telemetry/history")
def get_telemetry_history(limit: int = 20):
    conn = sqlite3.connect("bharatbus_telemetry.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT timestamp, station_id, score, status, crowd_count FROM telemetry_logs ORDER BY id DESC LIMIT ?", 
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    history = [
        {"timestamp": r[0], "station_id": r[1], "score": r[2], "status": r[3], "crowd_count": r[4]}
        for r in rows
    ]
    return {"success": True, "history": history}