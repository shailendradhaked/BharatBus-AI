import os
import random
import sqlite3
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from analytics import calculate_infrastructure_score, generate_escalations
from database import (
    init_db,
    get_routes_db,
    create_ticket,
    save_telemetry,
    get_recent_telemetry,
    get_dashboard_summary,
)

app = FastAPI(
    title="BharatBus AI",
    description="AI-powered Smart Bus Terminal Infrastructure Intelligence Platform",
    version="2.0.0",
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bharat-bus-ai-17ta.vercel.app",
        "https://bharat-bus-ai.vercel.app",
        "https://bharat-bus-ai-ipi5.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

init_db()


# ============================================================
# MODELS
# ============================================================

class TicketRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    route: str
    amount: int = Field(..., ge=0)


class SensorTelemetry(BaseModel):
    station_id: str = "JAIPUR-MAIN"
    water_tank_level_pct: float = Field(50, ge=0, le=100)
    ambient_temp_c: float = 30
    dustbin_fill_pct: float = Field(20, ge=0, le=100)
    platform_crowd_count: int = Field(0, ge=0)
    timestamp: Optional[datetime] = None


# ============================================================
# HEALTH
# ============================================================

@app.get("/")
def root():
    return {
        "project": "BharatBus AI",
        "status": "online",
        "version": "2.0.0",
        "message": "Smart Bus Infrastructure Intelligence API",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "bharatbus-ai-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================
# ROUTES
# ============================================================

@app.get("/api/routes")
def get_routes():
    return get_routes_db()


# ============================================================
# TICKET BOOKING
# ============================================================

@app.post("/api/book-ticket")
def book_ticket(data: TicketRequest):

    ticket_id = "TKT-" + str(random.randint(10000, 99999))

    ticket = create_ticket(
        ticket_id=ticket_id,
        name=data.name,
        route=data.route,
        amount=data.amount,
    )

    return {
        "status": "success",
        "ticket_id": ticket_id,
        "ticket": ticket,
        "message": (
            f"Successfully paid ₹{data.amount} "
            f"via UPI for route {data.route}!"
        ),
    }


# ============================================================
# TELEMETRY PROCESSING
# ============================================================

@app.post("/api/v1/telemetry/process")
def process_telemetry(data: SensorTelemetry):

    timestamp = (
        data.timestamp.isoformat()
        if data.timestamp
        else datetime.now(timezone.utc).isoformat()
    )

    result = calculate_infrastructure_score(
        water_pct=data.water_tank_level_pct,
        temp_c=data.ambient_temp_c,
        dustbin_pct=data.dustbin_fill_pct,
        crowd_count=data.platform_crowd_count,
    )

    alerts = generate_escalations(
        water_pct=data.water_tank_level_pct,
        dustbin_pct=data.dustbin_fill_pct,
        crowd_count=data.platform_crowd_count,
        temp_c=data.ambient_temp_c,
    )

    save_telemetry(
        {
            "timestamp": timestamp,
            "station_id": data.station_id,
            "score": result["bharat_infrastructure_score"],
            "status": result["health_status"],
            "crowd_count": data.platform_crowd_count,
            "water_level": data.water_tank_level_pct,
            "temperature": data.ambient_temp_c,
            "dustbin_level": data.dustbin_fill_pct,
        }
    )

    return {
        "success": True,
        "station_id": data.station_id,
        "timestamp": timestamp,
        "data": result,
        "alerts": alerts,
    }


# ============================================================
# TELEMETRY HISTORY
# ============================================================

@app.get("/api/v1/telemetry/history")
def telemetry_history(limit: int = 20):

    limit = max(1, min(limit, 100))

    return get_recent_telemetry(limit)


# ============================================================
# DASHBOARD ANALYTICS
# ============================================================

@app.get("/api/analytics")
def analytics():

    return get_dashboard_summary()


# ============================================================
# LEGACY TELEMETRY ENDPOINT
# ============================================================

@app.get("/api/telemetry")
def get_telemetry():

    summary = get_dashboard_summary()

    return {
        "total_crowd": summary["total_crowd"],
        "avg_score": summary["avg_score"],
        "booked_count": summary["booked_count"],
        "active_alerts": summary["active_alerts"],
        "stations_monitored": summary["stations_monitored"],
    }


# ============================================================
# AI DECISION ENDPOINT
# ============================================================

@app.post("/api/ai/analyze")
def ai_analyze(data: SensorTelemetry):

    result = calculate_infrastructure_score(
        data.water_tank_level_pct,
        data.ambient_temp_c,
        data.dustbin_fill_pct,
        data.platform_crowd_count,
    )

    alerts = generate_escalations(
        data.water_tank_level_pct,
        data.dustbin_fill_pct,
        data.platform_crowd_count,
        data.ambient_temp_c,
    )

    recommendations = []

    if data.platform_crowd_count > 150:
        recommendations.append(
            "Open auxiliary waiting zone and deploy additional security."
        )

    if data.dustbin_fill_pct > 80:
        recommendations.append(
            "Dispatch housekeeping team immediately."
        )

    if data.water_tank_level_pct < 20:
        recommendations.append(
            "Trigger municipal tanker/water refill request."
        )

    if data.ambient_temp_c >= 40:
        recommendations.append(
            "Activate passenger cooling and drinking-water support."
        )

    if not recommendations:
        recommendations.append(
            "Infrastructure operating within acceptable parameters."
        )

    return {
        "station_id": data.station_id,
        "score": result,
        "alerts": alerts,
        "recommendations": recommendations,
        "decision_engine": "BharatBus AI",
    }


# ============================================================
# SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )