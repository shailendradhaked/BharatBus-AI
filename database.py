import sqlite3

DB_NAME = "bharatbus_telemetry.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            station_id TEXT,
            score REAL,
            status TEXT,
            crowd_count INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def log_telemetry(station_id, score, status, crowd_count):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO telemetry_logs (station_id, score, status, crowd_count)
        VALUES (?, ?, ?, ?)
    ''', (station_id, score, status, crowd_count))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database Initialized Successfully!")