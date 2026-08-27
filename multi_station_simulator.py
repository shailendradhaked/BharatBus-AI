import requests
import random
import time

API_URL = "https://bharatbus-ai.onrender.com/api/v1/telemetry"

STATIONS = [
    "JAIPUR-ISBT-MAIN",
    "JODHPUR-CENTRAL-PL1",
    "KOTA-JUNCTION-PL2",
    "AJMER-BUS-TERMINAL",
    "UDAIPUR-CITY-HUB"
]

print("🚀 Starting BharatBus Multi-Station Simulation Network...")

while True:
    payload = {
        "station_id": random.choice(STATIONS),
        "water_level": round(random.uniform(10.0, 100.0), 2),
        "cleanliness_score": round(random.uniform(20.0, 100.0), 2),
        "crowd_count": random.randint(10, 250),
        "temperature": round(random.uniform(20.0, 42.0), 1)
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=10)
        if response.status_code == 200:
            res_data = response.json()
            print(f"✅ Data Sent Successfully | Station: {payload['station_id']} | Score: {res_data.get('score', 'N/A')}")
        else:
            print(f"❌ Server Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

    time.sleep(3)