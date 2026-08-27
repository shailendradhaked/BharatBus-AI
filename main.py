from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect("bharatbus_telemetry.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            name TEXT,
            route TEXT,
            amount INTEGER,
            status TEXT,
            time TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            destination TEXT,
            fare INTEGER,
            bus_no TEXT
        )
    """)
    # Default Routes Insert karein agar table khali ho
    cursor.execute("SELECT COUNT(*) FROM routes")
    if cursor.fetchone()[0] == 0:
        default_routes = [
            ("Kashmere Gate", "Anand Vihar", 30, "DL-01-AI-4029"),
            ("Connaught Place", "AIIMS Delhi", 40, "DL-04-AI-8812"),
            ("Rajiv Chowk", "IGI Airport T3", 100, "DL-02-AI-9901"),
            ("Dwarka Sector 21", "Lajpat Nagar", 50, "DL-03-AI-5543")
        ]
        cursor.executemany("INSERT INTO routes (source, destination, fare, bus_no) VALUES (?, ?, ?, ?)", default_routes)
    
    conn.commit()
    conn.close()

init_db()

class TicketRequest(BaseModel):
    name: str
    route: str
    amount: int

@app.get("/api/routes")
def get_routes():
    conn = sqlite3.connect("bharatbus_telemetry.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM routes")
    routes = [{"id": r[0], "source": r[1], "destination": r[2], "fare": r[3], "bus_no": r[4]} for r in cursor.fetchall()]
    conn.close()
    return routes

@app.post("/api/book-ticket")
def book_ticket(data: TicketRequest):
    ticket_id = "TKT-" + str(random.randint(10000, 99999))
    conn = sqlite3.connect("bharatbus_telemetry.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?)", 
                   (ticket_id, data.name, data.route, data.amount, "Paid & Confirmed (UPI)", "Just now"))
    conn.commit()
    conn.close()
    return {"status": "success", "ticket_id": ticket_id, "message": f"Successfully paid ₹{data.amount} via UPI for route {data.route}!"}

@app.get("/api/telemetry")
def get_telemetry():
    conn = sqlite3.connect("bharatbus_telemetry.db")
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM tickets")
    total_tickets = cursor.fetchone()[0]
    conn.close()
    return {
        "total_crowd": 1280 + total_tickets * 2,
        "avg_score": 65.4,
        "booked_count": total_tickets
    }