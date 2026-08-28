from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SensorTelemetry(BaseModel):

    station_id: str

    water_tank_level_pct: float = Field(
        ..., ge=0, le=100
    )

    ambient_temp_c: float

    dustbin_fill_pct: float = Field(
        ..., ge=0, le=100
    )

    platform_crowd_count: int = Field(
        ..., ge=0
    )

    timestamp: Optional[datetime] = None


# ============================================================
# NORMALIZATION
# ============================================================

def clamp(value, minimum=0.0, maximum=100.0):

    return max(
        minimum,
        min(maximum, float(value))
    )


# ============================================================
# INFRASTRUCTURE SCORE
# ============================================================

def calculate_infrastructure_score(
    water_pct,
    temp_c,
    dustbin_pct,
    crowd_count
):

    water_score = clamp(water_pct)

    cleanliness_score = clamp(
        100.0 - dustbin_pct
    )

    # Comfortable temperature around 24-30°C
    if temp_c <= 30:
        heat_score = 100.0
    else:
        heat_score = clamp(
            100.0 - ((temp_c - 30.0) * 5.0)
        )

    # Crowd capacity
    if crowd_count <= 100:
        crowd_score = 100.0
    else:
        crowd_score = clamp(
            100.0 - ((crowd_count - 100) * 1.5)
        )

    # BharatBus AI weighted score
    total_score = round(
        (0.30 * cleanliness_score)
        + (0.30 * water_score)
        + (0.20 * crowd_score)
        + (0.20 * heat_score),
        2
    )

    if total_score >= 75:
        status = "GREEN"
    elif total_score >= 50:
        status = "YELLOW"
    else:
        status = "RED"

    return {
        "bharat_infrastructure_score": total_score,
        "health_status": status,
        "sub_scores": {
            "water": round(water_score, 2),
            "cleanliness": round(cleanliness_score, 2),
            "crowd": round(crowd_score, 2),
            "comfort": round(heat_score, 2),
        },
    }


# ============================================================
# AI ALERT ENGINE
# ============================================================

def generate_escalations(
    water_pct,
    dustbin_pct,
    crowd_count,
    temp_c=30
):

    alerts = []

    # WATER
    if water_pct < 20:

        alerts.append({
            "alert_type": "WATER_CRITICAL",
            "severity": "HIGH",
            "description":
                f"Water tank level critically low ({water_pct}%).",
            "action":
                "Trigger municipal tanker/refill request."
        })

    elif water_pct < 35:

        alerts.append({
            "alert_type": "WATER_WARNING",
            "severity": "MEDIUM",
            "description":
                f"Water tank level falling ({water_pct}%).",
            "action":
                "Schedule water refill."
        })

    # CROWD
    if crowd_count > 250:

        alerts.append({
            "alert_type": "CROWD_CRITICAL",
            "severity": "CRITICAL",
            "description":
                f"Critical passenger crowd detected ({crowd_count}).",
            "action":
                "Deploy security and activate alternate waiting area."
        })

    elif crowd_count > 150:

        alerts.append({
            "alert_type": "CROWD_OVERFLOW",
            "severity": "HIGH",
            "description":
                f"Platform crowd threshold exceeded ({crowd_count}).",
            "action":
                "Deploy security and open auxiliary waiting zone."
        })

    # CLEANLINESS
    if dustbin_pct > 90:

        alerts.append({
            "alert_type": "CLEANLINESS_CRITICAL",
            "severity": "HIGH",
            "description":
                f"Dustbin almost full ({dustbin_pct}%).",
            "action":
                "Dispatch housekeeping immediately."
        })

    elif dustbin_pct > 80:

        alerts.append({
            "alert_type": "CLEANLINESS_ALERT",
            "severity": "MEDIUM",
            "description":
                f"Dustbin fill level high ({dustbin_pct}%).",
            "action":
                "Create housekeeping service ticket."
        })

    # HEAT
    if temp_c >= 42:

        alerts.append({
            "alert_type": "EXTREME_HEAT",
            "severity": "CRITICAL",
            "description":
                f"Extreme terminal temperature detected ({temp_c}°C).",
            "action":
                "Activate cooling, water and passenger assistance."
        })

    elif temp_c >= 38:

        alerts.append({
            "alert_type": "HIGH_TEMPERATURE",
            "severity": "MEDIUM",
            "description":
                f"High terminal temperature ({temp_c}°C).",
            "action":
                "Increase cooling and drinking-water availability."
        })

    return alerts


# ============================================================
# SAS-READY ANALYTICS FORMAT
# ============================================================

def create_sas_record(
    station_id,
    timestamp,
    score,
    status,
    crowd_count,
    water_level,
    temperature,
    dustbin_level
):

    return {
        "station_id": station_id,
        "timestamp": timestamp,
        "infrastructure_score": score,
        "status": status,
        "crowd_count": crowd_count,
        "water_level_pct": water_level,
        "temperature_c": temperature,
        "dustbin_fill_pct": dustbin_level,
    }