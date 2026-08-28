from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
import sqlite3
import random
import os
import math

# ============================================================
# BharatBus AI - Smart Public Transport Backend
# ============================================================

app = FastAPI(
    title="BharatBus AI API",
    description="AI-powered Smart Public Transport Infrastructure Platform",
    version="2.0.0"
)

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# DATABASE
# ------------------------------------------------------------

DB_PATH = os.getenv("DATABASE_PATH", "bharatbus_telemetry.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            route TEXT NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT NOT NULL,
            time TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            fare INTEGER NOT NULL,
            bus_no TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_no TEXT,
            latitude REAL,
            longitude REAL,
            passengers INTEGER,
            cleanliness REAL,
            facility_health REAL,
            efficiency REAL,
            timestamp TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_no TEXT,
            location TEXT,
            alert_type TEXT,
            priority TEXT,
            message TEXT,
            status TEXT,
            timestamp TEXT
        )
    """)

    # Default routes
    cursor.execute("SELECT COUNT(*) FROM routes")

    if cursor.fetchone()[0] == 0:
        default_routes = [
            (
                "Kashmere Gate",
                "Anand Vihar",
                30,
                "DL-01-AI-4029"
            ),
            (
                "Connaught Place",
                "AIIMS Delhi",
                40,
                "DL-04-AI-8812"
            ),
            (
                "Rajiv Chowk",
                "IGI Airport T3",
                100,
                "DL-02-AI-9901"
            ),
            (
                "Dwarka Sector 21",
                "Lajpat Nagar",
                50,
                "DL-03-AI-5543"
            )
        ]

        cursor.executemany(
            """
            INSERT INTO routes
            (source, destination, fare, bus_no)
            VALUES (?, ?, ?, ?)
            """,
            default_routes
        )

    conn.commit()
    conn.close()


init_db()


# ============================================================
# MODELS
# ============================================================

class TicketRequest(BaseModel):
    name: str = Field(..., min_length=1)
    route: str = Field(..., min_length=1)
    amount: int = Field(..., ge=0)


class TelemetryRequest(BaseModel):
    bus_no: str
    latitude: float
    longitude: float
    passengers: int = Field(..., ge=0)
    cleanliness: float = Field(ge=0, le=100)
    facility_health: float = Field(ge=0, le=100)
    efficiency: float = Field(ge=0, le=100)


class AlertRequest(BaseModel):
    bus_no: str
    location: str
    alert_type: str
    priority: str
    message: str


# ============================================================
# ROOT / HEALTH
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "BharatBus AI",
        "version": "2.0.0",
        "message": "Smart Public Transport Infrastructure Intelligence API",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "bharatbus-ai",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================
# ROUTES
# ============================================================

@app.get("/api/routes")
def get_routes():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, source, destination, fare, bus_no
        FROM routes
        ORDER BY id
    """)

    routes = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return routes


# ============================================================
# TICKET BOOKING
# ============================================================

@app.post("/api/book-ticket")
def book_ticket(data: TicketRequest):

    ticket_id = "TKT-" + str(random.randint(10000, 99999))

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO tickets
        (id, name, route, amount, status, time)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            ticket_id,
            data.name,
            data.route,
            data.amount,
            "Paid & Confirmed (UPI)",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    )

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "ticket_id": ticket_id,
        "amount": data.amount,
        "payment": "UPI",
        "message": (
            f"Successfully paid ₹{data.amount} "
            f"via UPI for route {data.route}"
        )
    }


# ============================================================
# TICKET LIST
# ============================================================

@app.get("/api/tickets")
def get_tickets():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM tickets
        ORDER BY rowid DESC
    """)

    tickets = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return tickets


# ============================================================
# TELEMETRY POST
# ============================================================

@app.post("/api/telemetry")
def receive_telemetry(data: TelemetryRequest):

    timestamp = datetime.now().isoformat()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO telemetry
        (
            bus_no,
            latitude,
            longitude,
            passengers,
            cleanliness,
            facility_health,
            efficiency,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.bus_no,
            data.latitude,
            data.longitude,
            data.passengers,
            data.cleanliness,
            data.facility_health,
            data.efficiency,
            timestamp
        )
    )

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": "Telemetry received",
        "bus_no": data.bus_no,
        "timestamp": timestamp
    }


# ============================================================
# TELEMETRY / DASHBOARD
# ============================================================

@app.get("/api/telemetry")
def get_telemetry():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM tickets")
    total_tickets = cursor.fetchone()[0]

    cursor.execute("""
        SELECT *
        FROM telemetry
        ORDER BY id DESC
        LIMIT 1
    """)

    latest = cursor.fetchone()

    conn.close()

    if latest:

        total_crowd = latest["passengers"]
        cleanliness = latest["cleanliness"]
        facility_health = latest["facility_health"]
        efficiency = latest["efficiency"]

    else:

        # Prototype fallback data
        total_crowd = 1280 + total_tickets * 2
        cleanliness = 82
        facility_health = 74
        efficiency = 65.4

    infrastructure_health = round(
        (
            cleanliness
            + facility_health
            + efficiency
        ) / 3,
        1
    )

    return {
        "total_crowd": total_crowd,
        "avg_score": efficiency,
        "booked_count": total_tickets,
        "cleanliness_score": cleanliness,
        "facility_health": facility_health,
        "infrastructure_health": infrastructure_health
    }


# ============================================================
# LIVE GPS
# ============================================================

@app.get("/api/gps")
def get_gps():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            bus_no,
            latitude,
            longitude,
            passengers,
            timestamp
        FROM telemetry
        ORDER BY id DESC
        LIMIT 20
    """)

    rows = [dict(row) for row in cursor.fetchall()]

    conn.close()

    # Prototype GPS if no sensor data exists
    if not rows:

        rows = [
            {
                "bus_no": "DL-01-AI-4029",
                "latitude": 28.6448,
                "longitude": 77.2167,
                "passengers": 320,
                "timestamp": datetime.now().isoformat()
            },
            {
                "bus_no": "DL-04-AI-8812",
                "latitude": 28.6328,
                "longitude": 77.2197,
                "passengers": 245,
                "timestamp": datetime.now().isoformat()
            }
        ]

    return {
        "status": "online",
        "buses": rows
    }


# ============================================================
# BUS STATUS
# ============================================================

@app.get("/api/buses")
def get_buses():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            bus_no,
            latitude,
            longitude,
            passengers,
            cleanliness,
            facility_health,
            efficiency,
            timestamp
        FROM telemetry
        ORDER BY id DESC
        LIMIT 50
    """)

    buses = [dict(row) for row in cursor.fetchall()]

    conn.close()

    if not buses:

        buses = [
            {
                "bus_no": "DL-01-AI-4029",
                "latitude": 28.6448,
                "longitude": 77.2167,
                "passengers": 320,
                "cleanliness": 82,
                "facility_health": 74,
                "efficiency": 65.4,
                "timestamp": datetime.now().isoformat()
            }
        ]

    return {
        "total_buses": len(buses),
        "buses": buses
    }


# ============================================================
# AI ALERTS
# ============================================================

@app.get("/api/alerts")
def get_alerts():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM alerts
        WHERE status = 'ACTIVE'
        ORDER BY id DESC
    """)

    alerts = [dict(row) for row in cursor.fetchall()]

    conn.close()

    # Demo AI alerts
    if not alerts:

        alerts = [
            {
                "id": 1,
                "bus_no": "DL-01-AI-4029",
                "location": "Platform 4",
                "alert_type": "Garbage Overflow",
                "priority": "HIGH",
                "message": "Waste level exceeds safe threshold",
                "status": "ACTIVE",
                "timestamp": datetime.now().isoformat()
            },
            {
                "id": 2,
                "bus_no": "DL-04-AI-8812",
                "location": "Platform 2",
                "alert_type": "High Crowd Density",
                "priority": "MEDIUM",
                "message": "Passenger density above recommended limit",
                "status": "ACTIVE",
                "timestamp": datetime.now().isoformat()
            },
            {
                "id": 3,
                "bus_no": "DL-02-AI-9901",
                "location": "Public Toilet",
                "alert_type": "Cleanliness Issue",
                "priority": "HIGH",
                "message": "AI vision detected cleanliness issue",
                "status": "ACTIVE",
                "timestamp": datetime.now().isoformat()
            }
        ]

    return {
        "total_alerts": len(alerts),
        "high_priority": sum(
            1 for a in alerts
            if a["priority"] == "HIGH"
        ),
        "alerts": alerts
    }


# ============================================================
# CREATE AI ALERT
# ============================================================

@app.post("/api/alerts")
def create_alert(data: AlertRequest):

    timestamp = datetime.now().isoformat()

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO alerts
        (
            bus_no,
            location,
            alert_type,
            priority,
            message,
            status,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.bus_no,
            data.location,
            data.alert_type,
            data.priority.upper(),
            data.message,
            "ACTIVE",
            timestamp
        )
    )

    conn.commit()

    alert_id = cursor.lastrowid

    conn.close()

    return {
        "status": "success",
        "alert_id": alert_id,
        "message": "AI infrastructure alert created"
    }


# ============================================================
# ANALYTICS
# ============================================================

@app.get("/api/analytics")
def analytics():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM tickets")
    tickets = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM alerts WHERE status='ACTIVE'")
    active_alerts = cursor.fetchone()[0]

    cursor.execute("""
        SELECT
            AVG(passengers),
            AVG(cleanliness),
            AVG(facility_health),
            AVG(efficiency)
        FROM telemetry
    """)

    result = cursor.fetchone()

    conn.close()

    avg_passengers = result[0] if result[0] else 1280
    avg_cleanliness = result[1] if result[1] else 82
    avg_facility = result[2] if result[2] else 74
    avg_efficiency = result[3] if result[3] else 65.4

    infrastructure_health = round(
        (
            avg_cleanliness
            + avg_facility
            + avg_efficiency
        ) / 3,
        1
    )

    return {
        "total_fleet_crowd": round(avg_passengers),
        "average_efficiency": round(avg_efficiency, 1),
        "total_tickets": tickets,
        "active_alerts": active_alerts,
        "cleanliness_score": round(avg_cleanliness, 1),
        "facility_health": round(avg_facility, 1),
        "infrastructure_health": infrastructure_health
    }


# ============================================================
# HOURLY CROWD TREND
# ============================================================

@app.get("/api/crowd-trends")
def crowd_trends():

    return {
        "labels": [
            "10:00 AM",
            "11:00 AM",
            "12:00 PM",
            "01:00 PM",
            "02:00 PM"
        ],
        "values": [
            380,
            850,
            1180,
            950,
            1400
        ]
    }


# ============================================================
# AI PREDICTION
# ============================================================

@app.get("/api/prediction")
def prediction():

    current_crowd = 1280

    if current_crowd > 1200:
        level = "HIGH"
    elif current_crowd > 700:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "current_crowd": current_crowd,
        "predicted_next_hour": round(current_crowd * 1.12),
        "crowd_level": level,
        "recommended_action": (
            "Deploy additional buses"
            if level == "HIGH"
            else "Normal fleet operation"
        )
    }


# ============================================================
# SYSTEM SUMMARY
# ============================================================

@app.get("/api/dashboard")
def dashboard():

    telemetry = get_telemetry()
    alerts = get_alerts()
    analytics_data = analytics()

    return {
        "system": "BharatBus AI",
        "status": "ONLINE",

        "fleet": {
            "active_bus_stands": 248,
            "current_passengers": telemetry["total_crowd"]
        },

        "ai": {
            "active_alerts": alerts["total_alerts"],
            "high_priority_alerts": alerts["high_priority"],
            "cleanliness_score": telemetry["cleanliness_score"],
            "facility_health": telemetry["facility_health"],
            "infrastructure_health": telemetry[
                "infrastructure_health"
            ]
        },

        "analytics": analytics_data,

        "timestamp": datetime.now().isoformat()
    }