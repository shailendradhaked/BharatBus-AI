from datetime import datetime, timezone
from typing import Optional
import csv
import io

from pydantic import BaseModel

from database import (
    get_recent_telemetry,
    get_latest_telemetry,
    get_ticket_count,
    get_buses,
    get_alerts,
)


class SensorTelemetry(BaseModel):

    station_id: str
    water_tank_level_pct: float
    ambient_temp_c: float
    dustbin_fill_pct: float
    platform_crowd_count: int
    timestamp: Optional[datetime] = None


def clamp(value, low=0.0, high=100.0):

    return max(
        low,
        min(high, float(value))
    )


def calculate_infrastructure_score(
    water_pct,
    temp_c,
    dustbin_pct,
    crowd_count,
):

    water_score = clamp(water_pct)

    cleanliness_score = clamp(
        100 - dustbin_pct
    )

    heat_score = clamp(
        100 -
        max(
            0,
            (temp_c - 30) * 5
        )
    )

    crowd_score = clamp(
        100 -
        max(
            0,
            (crowd_count - 100) * 1.5
        )
    )

    total_score = round(
        (
            0.30 * cleanliness_score
            +
            0.30 * water_score
            +
            0.20 * crowd_score
            +
            0.20 * heat_score
        ),
        2,
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


def generate_escalations(
    water_pct,
    dustbin_pct,
    crowd_count,
):

    alerts = []

    if water_pct < 20:

        alerts.append(
            {
                "alert_type": "WATER_CRITICAL",
                "severity": "HIGH",
                "description":
                    f"Water tank level low "
                    f"({water_pct:.1f}%).",
                "action":
                    "Create refill/tanker service request.",
            }
        )

    if crowd_count > 150:

        alerts.append(
            {
                "alert_type": "CROWD_OVERFLOW",
                "severity": "HIGH",
                "description":
                    f"Crowd threshold exceeded "
                    f"({crowd_count}).",
                "action":
                    "Deploy staff and open auxiliary "
                    "waiting area.",
            }
        )

    if dustbin_pct > 80:

        alerts.append(
            {
                "alert_type": "CLEANLINESS_ALERT",
                "severity": "MEDIUM",
                "description":
                    f"Dustbin fill level high "
                    f"({dustbin_pct:.1f}%).",
                "action":
                    "Dispatch housekeeping service.",
            }
        )

    return alerts


def predict_crowd(current_crowd: int):

    history = get_recent_telemetry(12).get(
        "history",
        []
    )

    values = [
        int(x.get("crowd_count") or 0)
        for x in history
    ]

    if values:

        recent_avg = (
            sum(values) / len(values)
        )

        trend = (
            values[0] - values[-1]
            if len(values) > 1
            else 0
        )

    else:

        recent_avg = current_crowd
        trend = 0

    predicted = round(
        max(
            0,
            (
                0.65 * current_crowd
                +
                0.35 * recent_avg
                +
                0.15 * trend
            )
        )
    )

    if predicted >= 180:
        level = "CRITICAL"
    elif predicted >= 150:
        level = "HIGH"
    elif predicted >= 100:
        level = "MODERATE"
    else:
        level = "NORMAL"

    probability = round(
        min(
            0.99,
            max(
                0.05,
                predicted / 220
            )
        ),
        2,
    )

    return {
        "current_crowd": int(current_crowd),
        "predicted_next_window": predicted,
        "crowd_level": level,
        "overcrowding_probability": probability,
        "model":
            "BharatBus AI baseline demand predictor",
        "recommendation":
            (
                "Dispatch an additional bus / "
                "open auxiliary waiting zone."
                if level in ("HIGH", "CRITICAL")
                else
                "Maintain current service frequency."
            ),
    }


def build_analytics_summary():

    history = get_recent_telemetry(
        100
    ).get(
        "history",
        []
    )

    buses = get_buses()

    alerts = get_alerts(50)

    latest = get_latest_telemetry()

    current_crowd = int(
        latest.get(
            "crowd_count",
            0
        )
        or 0
    )

    scores = [
        float(x.get("score") or 0)
        for x in history
    ]

    avg_score = (
        round(
            sum(scores) / len(scores),
            1,
        )
        if scores
        else 65.4
    )

    active_buses = len(buses)

    overcrowded_buses = sum(
        1
        for bus in buses
        if bus.get("status") == "OVERLOADED"
    )

    if buses:

        total_crowd = sum(
            int(
                bus.get(
                    "occupancy",
                    0
                )
                or 0
            )
            for bus in buses
        )

    else:

        total_crowd = current_crowd

    if avg_score >= 75:
        health = "GREEN"
    elif avg_score >= 50:
        health = "YELLOW"
    else:
        health = "RED"

    trend = []

    for row in reversed(history[:12]):

        timestamp = row.get(
            "timestamp",
            ""
        )

        try:

            label = datetime.fromisoformat(
                timestamp.replace(
                    "Z",
                    "+00:00"
                )
            ).strftime("%H:%M")

        except Exception:

            label = "--:--"

        trend.append(
            {
                "time": label,
                "crowd": int(
                    row.get(
                        "crowd_count",
                        0
                    )
                    or 0
                ),
                "score": float(
                    row.get(
                        "score",
                        0
                    )
                    or 0
                ),
            }
        )

    if not trend:

        trend = [
            {
                "time": "10:00",
                "crowd": 380,
                "score": 78,
            },
            {
                "time": "11:00",
                "crowd": 720,
                "score": 73,
            },
            {
                "time": "12:00",
                "crowd": 1100,
                "score": 68,
            },
            {
                "time": "13:00",
                "crowd": 900,
                "score": 71,
            },
            {
                "time": "14:00",
                "crowd": 1280,
                "score": 65,
            },
        ]

    return {
        "total_crowd": total_crowd,
        "avg_score": avg_score,
        "booked_count": get_ticket_count(),
        "active_buses": active_buses,
        "overcrowded_buses": overcrowded_buses,
        "alerts": len(alerts),
        "health_status": health,
        "prediction": predict_crowd(
            current_crowd
        ),
        "hourly_trends": trend,
        "buses": buses,
        "recent_alerts": alerts[:10],
        "generated_at":
            datetime.now(
                timezone.utc
            ).isoformat(),
    }


def telemetry_to_csv():

    history = get_recent_telemetry(
        500
    ).get(
        "history",
        []
    )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow(
        [
            "timestamp",
            "station_id",
            "score",
            "status",
            "crowd_count",
            "water_pct",
            "temperature_c",
            "dustbin_pct",
        ]
    )

    for row in history:

        writer.writerow(
            [
                row.get("timestamp", ""),
                row.get("station_id", ""),
                row.get("score", ""),
                row.get("status", ""),
                row.get("crowd_count", ""),
                row.get("water_pct", ""),
                row.get("temp_c", ""),
                row.get("dustbin_pct", ""),
            ]
        )

    return output.getvalue()