import os
import sqlite3
from pathlib import Path
from datetime import datetime


# ============================================================
# DATABASE PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DB_NAME = os.getenv(
    "DATABASE_PATH",
    str(BASE_DIR / "bharatbus_telemetry.db")
)


# ============================================================
# CONNECTION
# ============================================================

def get_connection():

    conn = sqlite3.connect(
        DB_NAME,
        timeout=30,
        check_same_thread=False
    )

    conn.row_factory = sqlite3.Row

    return conn


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def init_db():

    conn = get_connection()
    cursor = conn.cursor()

    # --------------------------------------------------------
    # ROUTES
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            fare INTEGER NOT NULL,
            bus_no TEXT NOT NULL
        )
    """)

    # --------------------------------------------------------
    # TICKETS
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # TELEMETRY
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            station_id TEXT,
            score REAL,
            status TEXT,
            crowd_count INTEGER,
            water_level REAL DEFAULT 0,
            temperature REAL DEFAULT 0,
            dustbin_level REAL DEFAULT 0
        )
    """)

    # --------------------------------------------------------
    # ALERTS
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            station_id TEXT,
            alert_type TEXT,
            severity TEXT,
            description TEXT,
            action TEXT,
            resolved INTEGER DEFAULT 0
        )
    """)

    # --------------------------------------------------------
    # DEFAULT ROUTES
    # --------------------------------------------------------

    cursor.execute(
        "SELECT COUNT(*) FROM routes"
    )

    count = cursor.fetchone()[0]

    if count == 0:

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


# ============================================================
# ROUTES
# ============================================================

def get_routes_db():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, source, destination, fare, bus_no
        FROM routes
        ORDER BY id
    """)

    rows = cursor.fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]


# ============================================================
# TICKET
# ============================================================

def create_ticket(
    ticket_id,
    name,
    route,
    amount
):

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    status = "Paid & Confirmed (UPI)"

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO tickets
        (id, name, route, amount, status, time)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            ticket_id,
            name,
            route,
            amount,
            status,
            timestamp,
        )
    )

    conn.commit()
    conn.close()

    return {
        "ticket_id": ticket_id,
        "name": name,
        "route": route,
        "amount": amount,
        "status": status,
        "time": timestamp,
    }


# ============================================================
# SAVE TELEMETRY
# ============================================================

def save_telemetry(data):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO telemetry
        (
            timestamp,
            station_id,
            score,
            status,
            crowd_count,
            water_level,
            temperature,
            dustbin_level
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.get("timestamp"),
            data.get("station_id"),
            data.get("score"),
            data.get("status"),
            data.get("crowd_count"),
            data.get("water_level", 0),
            data.get("temperature", 0),
            data.get("dustbin_level", 0),
        )
    )

    conn.commit()
    conn.close()


# ============================================================
# SAVE ALERTS
# ============================================================

def save_alerts(
    station_id,
    alerts
):

    if not alerts:
        return

    conn = get_connection()
    cursor = conn.cursor()

    timestamp = datetime.now().isoformat()

    for alert in alerts:

        cursor.execute(
            """
            INSERT INTO alerts
            (
                timestamp,
                station_id,
                alert_type,
                severity,
                description,
                action
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                timestamp,
                station_id,
                alert["alert_type"],
                alert["severity"],
                alert["description"],
                alert["action"],
            )
        )

    conn.commit()
    conn.close()


# ============================================================
# RECENT TELEMETRY
# ============================================================

def get_recent_telemetry(
    limit=20
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            timestamp,
            station_id,
            score,
            status,
            crowd_count,
            water_level,
            temperature,
            dustbin_level
        FROM telemetry
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = cursor.fetchall()

    conn.close()

    history = [
        dict(row)
        for row in rows
    ]

    return {
        "success": True,
        "history": history,
    }


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

def get_dashboard_summary():

    conn = get_connection()
    cursor = conn.cursor()

    # Crowd
    cursor.execute("""
        SELECT COALESCE(SUM(crowd_count), 0)
        FROM telemetry
        WHERE id IN (
            SELECT MAX(id)
            FROM telemetry
            GROUP BY station_id
        )
    """)

    total_crowd = cursor.fetchone()[0] or 0

    # Score
    cursor.execute("""
        SELECT AVG(score)
        FROM telemetry
    """)

    avg_score = cursor.fetchone()[0]

    if avg_score is None:
        avg_score = 65.4

    # Tickets
    cursor.execute("""
        SELECT COUNT(*)
        FROM tickets
    """)

    booked_count = cursor.fetchone()[0]

    # Active alerts
    cursor.execute("""
        SELECT COUNT(*)
        FROM alerts
        WHERE resolved = 0
    """)

    active_alerts = cursor.fetchone()[0]

    # Stations
    cursor.execute("""
        SELECT COUNT(DISTINCT station_id)
        FROM telemetry
    """)

    stations_monitored = cursor.fetchone()[0]

    conn.close()

    # Demo fallback
    if total_crowd == 0:
        total_crowd = 1280

    if stations_monitored == 0:
        stations_monitored = 4

    return {
        "total_crowd": int(total_crowd),
        "avg_score": round(float(avg_score), 2),
        "booked_count": int(booked_count),
        "active_alerts": int(active_alerts),
        "stations_monitored": int(stations_monitored),
    }