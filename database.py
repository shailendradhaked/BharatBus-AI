import sqlite3
from pathlib import Path

DB_NAME = str(
    Path(__file__).with_name(
        "bharatbus_telemetry.db"
    )
)


def connect():

    conn = sqlite3.connect(
        DB_NAME,
        timeout=30
    )

    conn.row_factory = sqlite3.Row

    return conn


def init_db():

    conn = connect()

    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            route TEXT NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT NOT NULL,
            time TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            fare INTEGER NOT NULL,
            bus_no TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            station_id TEXT,
            score REAL,
            status TEXT,
            crowd_count INTEGER,
            water_pct REAL DEFAULT 0,
            temp_c REAL DEFAULT 0,
            dustbin_pct REAL DEFAULT 0,
            alerts_json TEXT DEFAULT '[]'
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            alert_type TEXT,
            severity TEXT,
            description TEXT,
            action TEXT,
            station_id TEXT
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS buses (
            bus_no TEXT PRIMARY KEY,
            latitude REAL,
            longitude REAL,
            speed_kmph REAL,
            occupancy INTEGER,
            capacity INTEGER,
            route TEXT,
            status TEXT,
            updated_at TEXT
        )
        """
    )

    count = cursor.execute(
        "SELECT COUNT(*) AS count FROM routes"
    ).fetchone()["count"]

    if count == 0:

        routes = [
            (
                "Kashmere Gate",
                "Anand Vihar",
                30,
                "DL-01-AI-4029",
            ),
            (
                "Connaught Place",
                "AIIMS Delhi",
                40,
                "DL-04-AI-8812",
            ),
            (
                "Rajiv Chowk",
                "IGI Airport T3",
                100,
                "DL-02-AI-9901",
            ),
            (
                "Dwarka Sector 21",
                "Lajpat Nagar",
                50,
                "DL-03-AI-5543",
            ),
            (
                "Jaipur Sindhi Camp",
                "Ajmer Road",
                35,
                "RJ-14-AI-1201",
            ),
        ]

        cursor.executemany(
            """
            INSERT INTO routes
            (source,destination,fare,bus_no)
            VALUES (?,?,?,?)
            """,
            routes,
        )

    bus_count = cursor.execute(
        "SELECT COUNT(*) AS count FROM buses"
    ).fetchone()["count"]

    if bus_count == 0:

        buses = [
            (
                "DL-01-AI-4029",
                28.6304,
                77.2177,
                32,
                42,
                60,
                "Kashmere Gate → Anand Vihar",
                "NORMAL",
            ),
            (
                "DL-04-AI-8812",
                28.6328,
                77.2195,
                21,
                51,
                60,
                "Connaught Place → AIIMS",
                "BUSY",
            ),
            (
                "DL-02-AI-9901",
                28.6150,
                77.2100,
                40,
                28,
                60,
                "Rajiv Chowk → IGI Airport T3",
                "NORMAL",
            ),
            (
                "RJ-14-AI-1201",
                26.9124,
                75.7873,
                18,
                55,
                60,
                "Sindhi Camp → Ajmer Road",
                "BUSY",
            ),
        ]

        cursor.executemany(
            """
            INSERT INTO buses
            (
                bus_no,
                latitude,
                longitude,
                speed_kmph,
                occupancy,
                capacity,
                route,
                status,
                updated_at
            )
            VALUES (
                ?,?,?,?,?,?,?,?,datetime('now')
            )
            """,
            buses,
        )

    conn.commit()

    conn.close()


def rows(query, params=()):

    conn = connect()

    result = [
        dict(row)
        for row in conn.execute(
            query,
            params
        ).fetchall()
    ]

    conn.close()

    return result


def get_routes():

    return rows(
        """
        SELECT
            id,
            source,
            destination,
            fare,
            bus_no
        FROM routes
        ORDER BY id
        """
    )


def create_ticket(
    ticket_id,
    name,
    route,
    amount,
):

    conn = connect()

    try:

        conn.execute(
            """
            INSERT INTO tickets
            (
                id,
                name,
                route,
                amount,
                status,
                time
            )
            VALUES (
                ?,?,?,?,?,
                datetime('now')
            )
            """,
            (
                ticket_id,
                name,
                route,
                amount,
                "Paid & Confirmed (Demo UPI)",
            ),
        )

        conn.commit()

        return True

    except sqlite3.IntegrityError:

        return False

    finally:

        conn.close()


def get_ticket_count():

    conn = connect()

    count = conn.execute(
        "SELECT COUNT(*) AS count FROM tickets"
    ).fetchone()["count"]

    conn.close()

    return int(count)


def save_telemetry(data):

    import json

    conn = connect()

    conn.execute(
        """
        INSERT INTO telemetry
        (
            timestamp,
            station_id,
            score,
            status,
            crowd_count,
            water_pct,
            temp_c,
            dustbin_pct,
            alerts_json
        )
        VALUES (?,?,?,?,?,?,?,?,?)
        """,
        (
            data["timestamp"],
            data["station_id"],
            data["score"],
            data["status"],
            data["crowd_count"],
            data["water_pct"],
            data["temp_c"],
            data["dustbin_pct"],
            json.dumps(
                data.get(
                    "alerts",
                    []
                )
            ),
        ),
    )

    for alert in data.get(
        "alerts",
        []
    ):

        conn.execute(
            """
            INSERT INTO alerts
            (
                timestamp,
                alert_type,
                severity,
                description,
                action,
                station_id
            )
            VALUES (?,?,?,?,?,?)
            """,
            (
                data["timestamp"],
                alert["alert_type"],
                alert["severity"],
                alert["description"],
                alert["action"],
                data["station_id"],
            ),
        )

    conn.commit()

    conn.close()


def get_recent_telemetry(limit=10):

    return {
        "success": True,
        "history": rows(
            """
            SELECT
                timestamp,
                station_id,
                score,
                status,
                crowd_count,
                water_pct,
                temp_c,
                dustbin_pct
            FROM telemetry
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ),
    }


def get_latest_telemetry():

    result = rows(
        """
        SELECT
            timestamp,
            station_id,
            score,
            status,
            crowd_count,
            water_pct,
            temp_c,
            dustbin_pct
        FROM telemetry
        ORDER BY id DESC
        LIMIT 1
        """
    )

    if result:
        return result[0]

    return {
        "score": 65.4,
        "status": "YELLOW",
        "crowd_count": 1280,
    }


def get_alerts(limit=30):

    return rows(
        """
        SELECT
            id,
            timestamp,
            alert_type,
            severity,
            description,
            action,
            station_id
        FROM alerts
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )


def get_buses():

    return rows(
        """
        SELECT
            bus_no,
            latitude,
            longitude,
            speed_kmph,
            occupancy,
            capacity,
            route,
            status,
            updated_at
        FROM buses
        ORDER BY bus_no
        """
    )


def upsert_bus(data):

    conn = connect()

    conn.execute(
        """
        INSERT INTO buses
        (
            bus_no,
            latitude,
            longitude,
            speed_kmph,
            occupancy,
            capacity,
            route,
            status,
            updated_at
        )
        VALUES (?,?,?,?,?,?,?,?,?)

        ON CONFLICT(bus_no)
        DO UPDATE SET
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            speed_kmph=excluded.speed_kmph,
            occupancy=excluded.occupancy,
            capacity=excluded.capacity,
            route=excluded.route,
            status=excluded.status,
            updated_at=excluded.updated_at
        """,
        (
            data["bus_no"],
            data["latitude"],
            data["longitude"],
            data["speed_kmph"],
            data["occupancy"],
            data["capacity"],
            data.get("route", ""),
            data.get("status", "NORMAL"),
            data.get("updated_at"),
        ),
    )

    conn.commit()

    conn.close()