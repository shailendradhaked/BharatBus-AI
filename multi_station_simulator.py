import requests
import random
import time

API_URL = "http://127.0.0.1:8000/api/v1/telemetry/process"

STATIONS = [
    "JAIPUR-ISBT-MAIN",
    "JODHPUR-CENTRAL-PL1",
    "KOTA-JUNCTION-PL2",
    "AJMER-BUS-TERMINAL",
    "UDAIPUR-CITY-HUB"
]

def run_multi_station_simulator():
    print("🚀 Starting BharatBus Multi-Station Simulation Network...")
    while True:
        station = random.choice(STATIONS)
        payload = {
            "station_id": station,
            "water_tank_level_pct": round(random.uniform(10.0, 95.0), 1),
            "ambient_temp_c": round(random.uniform(28.0, 42.0), 1),
            "dustbin_fill_pct": round(random.uniform(20.0, 95.0), 1),
            "platform_crowd_count": random.randint(40, 220)
        }
        
        try:
            res = requests.post(API_URL, json=payload)
            data = res.json()["data"]
            print(f"[NODE UPDATED] {data['station_id']} | Score: {data['bharat_infrastructure_score']}/100 | Alerts: {len(data['active_alerts'])}")
        except Exception as e:
            print(f"❌ Error sending data: {e}")
            
        time.sleep(3)

if __name__ == "__main__":
    run_multi_station_simulator()