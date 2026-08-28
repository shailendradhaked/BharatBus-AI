from datetime import datetime, timezone
from typing import Optional


# ============================================================
# NORMALIZATION
# ============================================================

def clamp(
    value,
    minimum=0.0,
    maximum=100.0
):
    """
    Keep any numeric value within a safe range.
    """

    try:
        value = float(value)
    except (TypeError, ValueError):
        value = minimum

    return max(
        minimum,
        min(maximum, value)
    )


# ============================================================
# TEMPERATURE SCORE
# ============================================================

def calculate_heat_score(temp_c):

    try:
        temp_c = float(temp_c)
    except (TypeError, ValueError):
        temp_c = 30.0

    # Ideal / comfortable range
    if 20 <= temp_c <= 30:
        return 100.0

    # Slightly uncomfortable
    if temp_c < 20:
        score = 100 - ((20 - temp_c) * 3)
    else:
        score = 100 - ((temp_c - 30) * 5)

    return clamp(score)


# ============================================================
# CROWD SCORE
# ============================================================

def calculate_crowd_score(crowd_count):

    try:
        crowd_count = int(crowd_count)
    except (TypeError, ValueError):
        crowd_count = 0

    if crowd_count <= 100:
        return 100.0

    score = 100 - (
        (crowd_count - 100) * 1.5
    )

    return clamp(score)


# ============================================================
# AI RISK SCORE
# ============================================================

def calculate_ai_risk_score(
    water_pct,
    temp_c,
    dustbin_pct,
    crowd_count
):

    water_pct = clamp(water_pct)
    dustbin_pct = clamp(dustbin_pct)

    heat_score = calculate_heat_score(
        temp_c
    )

    crowd_score = calculate_crowd_score(
        crowd_count
    )

    # Convert health scores into risk
    water_risk = 100 - water_pct

    cleanliness_risk = dustbin_pct

    heat_risk = 100 - heat_score

    crowd_risk = 100 - crowd_score

    # Weighted AI risk
    risk = (
        (0.30 * crowd_risk)
        + (0.25 * cleanliness_risk)
        + (0.25 * heat_risk)
        + (0.20 * water_risk)
    )

    return round(
        clamp(risk),
        2
    )


# ============================================================
# RISK STATUS
# ============================================================

def get_risk_status(
    risk_score
):

    risk_score = clamp(
        risk_score
    )

    if risk_score >= 70:
        return "CRITICAL"

    if risk_score >= 45:
        return "HIGH"

    if risk_score >= 25:
        return "MEDIUM"

    return "LOW"


# ============================================================
# INFRASTRUCTURE SCORE
# ============================================================

def calculate_infrastructure_score(
    water_pct,
    temp_c,
    dustbin_pct,
    crowd_count
):

    water_score = clamp(
        water_pct
    )

    cleanliness_score = clamp(
        100.0 - float(dustbin_pct)
    )

    heat_score = calculate_heat_score(
        temp_c
    )

    crowd_score = calculate_crowd_score(
        crowd_count
    )

    # --------------------------------------------------------
    # BHARATBUS AI WEIGHTED SCORE
    # --------------------------------------------------------

    total_score = round(
        (0.30 * cleanliness_score)
        + (0.30 * water_score)
        + (0.20 * crowd_score)
        + (0.20 * heat_score),
        2
    )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if total_score >= 75:

        status = "GREEN"

    elif total_score >= 50:

        status = "YELLOW"

    else:

        status = "RED"

    # --------------------------------------------------------
    # AI RISK
    # --------------------------------------------------------

    ai_risk_score = calculate_ai_risk_score(
        water_pct,
        temp_c,
        dustbin_pct,
        crowd_count
    )

    ai_risk_status = get_risk_status(
        ai_risk_score
    )

    return {

        "bharat_infrastructure_score":
            total_score,

        "health_status":
            status,

        "ai_risk_score":
            ai_risk_score,

        "ai_risk_status":
            ai_risk_status,

        "sub_scores": {

            "water":
                round(
                    water_score,
                    2
                ),

            "cleanliness":
                round(
                    cleanliness_score,
                    2
                ),

            "crowd":
                round(
                    crowd_score,
                    2
                ),

            "comfort":
                round(
                    heat_score,
                    2
                ),
        },

        "analytics_engine":
            "BharatBus AI",

        "analytics_type":
            "AI + SAS-ready",

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

    # ========================================================
    # WATER
    # ========================================================

    if water_pct < 20:

        alerts.append({

            "alert_type":
                "WATER_CRITICAL",

            "severity":
                "HIGH",

            "description":
                f"Water tank level critically low "
                f"({water_pct}%).",

            "action":
                "Trigger municipal tanker/refill request.",

        })

    elif water_pct < 35:

        alerts.append({

            "alert_type":
                "WATER_WARNING",

            "severity":
                "MEDIUM",

            "description":
                f"Water tank level falling "
                f"({water_pct}%).",

            "action":
                "Schedule water refill.",

        })

    # ========================================================
    # CROWD
    # ========================================================

    if crowd_count > 250:

        alerts.append({

            "alert_type":
                "CROWD_CRITICAL",

            "severity":
                "CRITICAL",

            "description":
                f"Critical passenger crowd detected "
                f"({crowd_count}).",

            "action":
                "Deploy security and activate "
                "alternate waiting area.",

        })

    elif crowd_count > 150:

        alerts.append({

            "alert_type":
                "CROWD_OVERFLOW",

            "severity":
                "HIGH",

            "description":
                f"Platform crowd threshold exceeded "
                f"({crowd_count}).",

            "action":
                "Deploy security and open "
                "auxiliary waiting zone.",

        })

    # ========================================================
    # CLEANLINESS
    # ========================================================

    if dustbin_pct > 90:

        alerts.append({

            "alert_type":
                "CLEANLINESS_CRITICAL",

            "severity":
                "HIGH",

            "description":
                f"Dustbin almost full "
                f"({dustbin_pct}%).",

            "action":
                "Dispatch housekeeping immediately.",

        })

    elif dustbin_pct > 80:

        alerts.append({

            "alert_type":
                "CLEANLINESS_ALERT",

            "severity":
                "MEDIUM",

            "description":
                f"Dustbin fill level high "
                f"({dustbin_pct}%).",

            "action":
                "Create housekeeping service ticket.",

        })

    # ========================================================
    # HEAT
    # ========================================================

    if temp_c >= 42:

        alerts.append({

            "alert_type":
                "EXTREME_HEAT",

            "severity":
                "CRITICAL",

            "description":
                f"Extreme terminal temperature detected "
                f"({temp_c}°C).",

            "action":
                "Activate cooling, water and "
                "passenger assistance.",

        })

    elif temp_c >= 38:

        alerts.append({

            "alert_type":
                "HIGH_TEMPERATURE",

            "severity":
                "MEDIUM",

            "description":
                f"High terminal temperature "
                f"({temp_c}°C).",

            "action":
                "Increase cooling and "
                "drinking-water availability.",

        })

    return alerts


# ============================================================
# PREDICTIVE INSIGHT ENGINE
# ============================================================

def generate_predictive_insights(
    water_pct,
    temp_c,
    dustbin_pct,
    crowd_count
):

    insights = []

    # Crowd prediction
    if crowd_count >= 180:

        insights.append({

            "category":
                "CROWD_PREDICTION",

            "risk":
                "HIGH",

            "message":
                "Passenger demand is approaching "
                "terminal capacity.",

            "recommendation":
                "Prepare additional buses and "
                "waiting zones.",

        })

    elif crowd_count >= 120:

        insights.append({

            "category":
                "CROWD_PREDICTION",

            "risk":
                "MEDIUM",

            "message":
                "Passenger density is increasing.",

            "recommendation":
                "Continue AI monitoring.",

        })

    # Heat prediction
    if temp_c >= 38:

        insights.append({

            "category":
                "HEAT_RISK",

            "risk":
                "HIGH",

            "message":
                "Waiting-area heat stress risk "
                "is increasing.",

            "recommendation":
                "Activate cooling and drinking "
                "water support.",

        })

    # Waste prediction
    if dustbin_pct >= 75:

        insights.append({

            "category":
                "CLEANLINESS",

            "risk":
                "MEDIUM",

            "message":
                "Waste accumulation is increasing.",

            "recommendation":
                "Schedule preventive housekeeping.",

        })

    # Water prediction
    if water_pct <= 35:

        insights.append({

            "category":
                "WATER",

            "risk":
                "MEDIUM",

            "message":
                "Water reserve is declining.",

            "recommendation":
                "Schedule refill before critical level.",

        })

    if not insights:

        insights.append({

            "category":
                "SYSTEM",

            "risk":
                "LOW",

            "message":
                "Infrastructure operating normally.",

            "recommendation":
                "Continue monitoring.",

        })

    return insights


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
    dustbin_level,
    ai_risk_score=None,
    ai_risk_status=None
):

    # Generate timestamp if missing
    if not timestamp:

        timestamp = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )

    return {

        "station_id":
            station_id,

        "timestamp":
            timestamp,

        "infrastructure_score":
            round(
                float(score),
                2
            ),

        "status":
            status,

        "crowd_count":
            int(crowd_count),

        "water_level_pct":
            round(
                float(water_level),
                2
            ),

        "temperature_c":
            round(
                float(temperature),
                2
            ),

        "dustbin_fill_pct":
            round(
                float(dustbin_level),
                2
            ),

        "ai_risk_score":
            (
                round(
                    float(ai_risk_score),
                    2
                )
                if ai_risk_score is not None
                else None
            ),

        "ai_risk_status":
            ai_risk_status,

    }


# ============================================================
# SAS FEATURE VECTOR
# ============================================================

def create_sas_feature_vector(
    water_pct,
    temp_c,
    dustbin_pct,
    crowd_count
):

    result = calculate_infrastructure_score(
        water_pct,
        temp_c,
        dustbin_pct,
        crowd_count
    )

    return {

        "water_pct":
            round(
                float(water_pct),
                2
            ),

        "temperature_c":
            round(
                float(temp_c),
                2
            ),

        "dustbin_pct":
            round(
                float(dustbin_pct),
                2
            ),

        "crowd_count":
            int(crowd_count),

        "water_score":
            result["sub_scores"]["water"],

        "cleanliness_score":
            result["sub_scores"]["cleanliness"],

        "crowd_score":
            result["sub_scores"]["crowd"],

        "comfort_score":
            result["sub_scores"]["comfort"],

        "infrastructure_score":
            result[
                "bharat_infrastructure_score"
            ],

        "ai_risk_score":
            result[
                "ai_risk_score"
            ],

        "risk_status":
            result[
                "ai_risk_status"
            ],

    }