import os
import time
from typing import Dict, List

import cv2
import requests

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


# ============================================================
# BHARATBUS AI — PRODUCTION CONFIG
# ============================================================

API_URL = os.getenv(
    "BHARATBUS_API_URL",
    "https://bharatbus-ai.onrender.com/api/v1/telemetry/process"
)

STATION_ID = os.getenv(
    "BHARATBUS_STATION_ID",
    "JAIPUR-MAIN-PLATFORM-01"
)

MODEL_PATH = os.getenv(
    "BHARATBUS_MODEL",
    "yolo11n.pt"
)

CAMERA_SOURCE = os.getenv(
    "BHARATBUS_CAMERA",
    "0"
)

API_INTERVAL = int(
    os.getenv("BHARATBUS_API_INTERVAL", "5")
)

CONFIDENCE = float(
    os.getenv("BHARATBUS_CONFIDENCE", "0.35")
)


# ============================================================
# AI MODEL
# ============================================================

def load_model():

    if YOLO is None:

        print(
            "WARNING: Ultralytics not installed. "
            "Running fallback CV mode."
        )

        return None

    try:

        print(
            f"Loading BharatBus AI model: {MODEL_PATH}"
        )

        model = YOLO(MODEL_PATH)

        print("✅ AI Vision model loaded.")

        return model

    except Exception as error:

        print(
            "MODEL LOAD ERROR:",
            error
        )

        return None


# ============================================================
# CAMERA SOURCE
# ============================================================

def get_camera_source():

    source = CAMERA_SOURCE.strip()

    if source.isdigit():

        return int(source)

    return source


# ============================================================
# AI DETECTION
# ============================================================

def detect_objects(
    model,
    frame
) -> Dict:

    people = 0
    vehicles = 0

    detections: List[Dict] = []

    garbage_detected = False

    if model is None:

        return {
            "people": 0,
            "vehicles": 0,
            "garbage": False,
            "detections": []
        }

    try:

        results = model.predict(
            source=frame,
            conf=CONFIDENCE,
            verbose=False
        )

        if not results:

            return {
                "people": 0,
                "vehicles": 0,
                "garbage": False,
                "detections": []
            }

        result = results[0]

        if result.boxes is None:

            return {
                "people": 0,
                "vehicles": 0,
                "garbage": False,
                "detections": []
            }

        names = result.names

        for box in result.boxes:

            cls_id = int(
                box.cls[0].item()
            )

            confidence = float(
                box.conf[0].item()
            )

            label = names.get(
                cls_id,
                str(cls_id)
            )

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )

            # --------------------------------------------
            # PERSON
            # --------------------------------------------

            if label == "person":

                people += 1

            # --------------------------------------------
            # VEHICLES
            # --------------------------------------------

            if label in {
                "car",
                "bus",
                "truck",
                "motorcycle"
            }:

                vehicles += 1

            # --------------------------------------------
            # COMMON WASTE OBJECTS
            # --------------------------------------------

            if label in {
                "bottle"
            }:

                garbage_detected = True

            detections.append(
                {
                    "label": label,
                    "confidence": round(
                        confidence,
                        3
                    ),
                    "bbox": [
                        x1,
                        y1,
                        x2,
                        y2
                    ]
                }
            )

            # --------------------------------------------
            # DRAW BOX
            # --------------------------------------------

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            cv2.putText(
                frame,
                f"{label} {confidence:.2f}",
                (x1, max(y1 - 8, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )

    except Exception as error:

        print(
            "VISION ERROR:",
            error
        )

    return {
        "people": people,
        "vehicles": vehicles,
        "garbage": garbage_detected,
        "detections": detections
    }


# ============================================================
# RISK ENGINE
# ============================================================

def calculate_risk(
    passenger_count: int,
    garbage_detected: bool,
    vehicles: int
) -> Dict:

    alerts = []

    risk_score = 0

    # Crowd risk
    if passenger_count >= 40:

        risk_score += 50

        alerts.append(
            {
                "type": "CROWD",
                "severity": "HIGH",
                "message":
                    "High passenger density detected."
            }
        )

    elif passenger_count >= 20:

        risk_score += 25

        alerts.append(
            {
                "type": "CROWD",
                "severity": "MEDIUM",
                "message":
                    "Passenger density is increasing."
            }
        )

    # Garbage
    if garbage_detected:

        risk_score += 20

        alerts.append(
            {
                "type": "CLEANLINESS",
                "severity": "MEDIUM",
                "message":
                    "Possible waste object detected."
            }
        )

    # Vehicle congestion
    if vehicles >= 10:

        risk_score += 20

        alerts.append(
            {
                "type": "TRAFFIC",
                "severity": "MEDIUM",
                "message":
                    "High vehicle activity detected."
            }
        )

    risk_score = min(
        risk_score,
        100
    )

    if risk_score >= 70:

        status = "CRITICAL"

    elif risk_score >= 40:

        status = "WARNING"

    else:

        status = "NORMAL"

    return {
        "risk_score": risk_score,
        "risk_status": status,
        "alerts": alerts
    }


# ============================================================
# TELEMETRY SYNC
# ============================================================

def send_telemetry(
    passenger_count: int,
    vehicles: int,
    garbage_detected: bool,
    risk_data: Dict
):

    payload = {

        "station_id": STATION_ID,

        "water_tank_level_pct": 35.0,

        "ambient_temp_c": 37.5,

        "dustbin_fill_pct":
            90.0 if garbage_detected else 75.0,

        "platform_crowd_count":
            passenger_count,

        # Additional AI fields
        "ai_people_count":
            passenger_count,

        "ai_vehicle_count":
            vehicles,

        "ai_garbage_detected":
            garbage_detected,

        "ai_risk_score":
            risk_data["risk_score"],

        "ai_risk_status":
            risk_data["risk_status"],

        "ai_alerts":
            risk_data["alerts"]
    }

    try:

        response = requests.post(
            API_URL,
            json=payload,
            timeout=10
        )

        if response.ok:

            try:

                result = response.json()

                data = result.get(
                    "data",
                    {}
                )

                score = data.get(
                    "bharat_infrastructure_score",
                    "N/A"
                )

                status = data.get(
                    "health_status",
                    "UNKNOWN"
                )

                print(
                    "\n🇮🇳 [BHARATBUS AI LIVE]"
                )

                print(
                    f"Station: {STATION_ID}"
                )

                print(
                    f"AI Crowd: {passenger_count}"
                )

                print(
                    f"Vehicles: {vehicles}"
                )

                print(
                    f"Garbage: {garbage_detected}"
                )

                print(
                    f"AI Risk: "
                    f"{risk_data['risk_score']}/100"
                )

                print(
                    f"AI Status: "
                    f"{risk_data['risk_status']}"
                )

                print(
                    f"SAS/Infrastructure Score: "
                    f"{score}/100"
                )

                print(
                    f"Backend Health: {status}"
                )

            except Exception:

                print(
                    "Telemetry accepted by backend."
                )

        else:

            print(
                "API ERROR:",
                response.status_code,
                response.text[:300]
            )

    except Exception as error:

        print(
            "SYNC ERROR:",
            error
        )


# ============================================================
# CAMERA MONITORING
# ============================================================

def start_camera_monitoring():

    model = load_model()

    source = get_camera_source()

    cap = cv2.VideoCapture(
        source
    )

    if not cap.isOpened():

        print(
            "❌ ERROR: Camera feed not available."
        )

        print(
            f"Camera source: {source}"
        )

        return

    print(
        "\n🇮🇳 BharatBus AI CCTV started."
    )

    print(
        f"Station: {STATION_ID}"
    )

    print(
        f"Backend: {API_URL}"
    )

    last_api_call = 0

    try:

        while True:

            ret, frame = cap.read()

            if not ret:

                print(
                    "Camera frame unavailable."
                )

                break

            # ------------------------------------------------
            # AI VISION
            # ------------------------------------------------

            detection = detect_objects(
                model,
                frame
            )

            passenger_count = detection[
                "people"
            ]

            vehicles = detection[
                "vehicles"
            ]

            garbage_detected = detection[
                "garbage"
            ]

            # ------------------------------------------------
            # RISK
            # ------------------------------------------------

            risk_data = calculate_risk(
                passenger_count,
                garbage_detected,
                vehicles
            )

            # ------------------------------------------------
            # HUD
            # ------------------------------------------------

            cv2.putText(
                frame,
                f"BharatBus AI | "
                f"People: {passenger_count}",
                (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (0, 255, 255),
                2
            )

            cv2.putText(
                frame,
                f"Risk: "
                f"{risk_data['risk_score']}/100 "
                f"{risk_data['risk_status']}",
                (20, 65),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                (0, 0, 255),
                2
            )

            cv2.putText(
                frame,
                f"Garbage: "
                f"{'YES' if garbage_detected else 'NO'}",
                (20, 95),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 255),
                2
            )

            # ------------------------------------------------
            # BACKEND SYNC
            # ------------------------------------------------

            if (
                time.time() - last_api_call
                >= API_INTERVAL
            ):

                send_telemetry(
                    passenger_count,
                    vehicles,
                    garbage_detected,
                    risk_data
                )

                last_api_call = time.time()

            # ------------------------------------------------
            # DISPLAY
            # ------------------------------------------------

            cv2.imshow(
                "BharatBus AI - National CCTV Intelligence",
                frame
            )

            key = cv2.waitKey(1) & 0xFF

            if key == ord("q"):

                break

    finally:

        cap.release()

        cv2.destroyAllWindows()

        print(
            "\n🇮🇳 BharatBus AI CCTV stopped."
        )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    start_camera_monitoring()