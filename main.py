from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_recent_telemetry

app = FastAPI(title="BharatBus-AI Core Engine")

# Enable CORS for live React App access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"system": "BharatBus-AI Core Engine", "status": "Operational"}

@app.get("/api/v1/telemetry/history")
def get_telemetry_history(limit: int = 10):
    return get_recent_telemetry(limit)