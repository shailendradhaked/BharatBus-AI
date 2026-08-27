import sqlite3

DB_NAME = "bharatbus_telemetry.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            station_id TEXT,
            score REAL,
            status TEXT,
            crowd_count INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def save_telemetry(data):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO telemetry (timestamp, station_id, score, status, crowd_count)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data.get("timestamp"),
        data.get("station_id"),
        data.get("score"),
        data.get("status"),
        data.get("crowd_count")
    ))
    conn.commit()
    conn.close()

def get_recent_telemetry(limit: int = 10):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT timestamp, station_id, score, status, crowd_count 
        FROM telemetry 
        ORDER BY id DESC 
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "timestamp": row[0],
            "station_id": row[1],
            "score": row[2],
            "status": row[3],
            "crowd_count": row[4]
        })
    return {"success": True, "history": history}