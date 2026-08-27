from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SensorTelemetry(BaseModel):
    station_id: str
    water_tank_level_pct: float     # 0 to 100%
    ambient_temp_c: float          # Temperature in °C
    dustbin_fill_pct: float        # 0 to 100%
    platform_crowd_count: int      # Live count from CCTV Camera
    timestamp: Optional[datetime] = None

def calculate_infrastructure_score(water_pct, temp_c, dustbin_pct, crowd_count):
    # Component Sub-scores (Normalized to 0 - 100 range)
    water_score = max(0.0, min(100.0, water_pct))
    cleanliness_score = max(0.0, 100.0 - dustbin_pct)
    heat_score = max(0.0, 100.0 - max(0.0, (temp_c - 30.0) * 5.0))
    crowd_score = max(0.0, 100.0 - max(0.0, float(crowd_count - 100) * 1.5))

    # Weighted Bharat Infrastructure Score
    total_score = round(
        (0.30 * cleanliness_score) +
        (0.30 * water_score) +
        (0.20 * crowd_score) +
        (0.20 * heat_score), 2
    )

    status = "GREEN" if total_score >= 75 else ("YELLOW" if total_score >= 50 else "RED")

    return {
        "bharat_infrastructure_score": total_score,
        "health_status": status,
        "sub_scores": {
            "water": round(water_score, 2),
            "cleanliness": round(cleanliness_score, 2),
            "crowd": round(crowd_score, 2),
            "comfort": round(heat_score, 2)
        }
    }

def generate_escalations(water_pct, dustbin_pct, crowd_count):
    alerts = []
    
    if water_pct < 20.0:
        alerts.append({
            "alert_type": "WATER_CRITICAL",
            "severity": "HIGH",
            "description": f"Water tank level low ({water_pct}%).",
            "action": "Trigger dynamic municipal tanker request."
        })

    if crowd_count > 150:
        alerts.append({
            "alert_type": "CROWD_OVERFLOW",
            "severity": "HIGH",
            "description": f"Crowd threshold exceeded ({crowd_count} passengers).",
            "action": "Deploy platform security & open auxiliary waiting zone."
        })

    if dustbin_pct > 80.0:
        alerts.append({
            "alert_type": "CLEANLINESS_ALERT",
            "severity": "MEDIUM",
            "description": f"Dustbin fill level high ({dustbin_pct}%).",
            "action": "Dispatch housekeeping ticket to on-duty staff."
        })

    return alerts