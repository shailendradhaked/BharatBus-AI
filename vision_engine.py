import os
import time

import cv2
import requests


# ============================================================
# RENDER BACKEND
# ============================================================

API_URL = os.getenv(
    "BHARATBUS_API_URL",
    "https://bharatbus-ai.onrender.com/api/v1/telemetry/process"
)

STATION_ID = os.getenv(
    "BHARATBUS_STATION_ID",
    "JAIPUR-MAIN-PLATFORM-01"
)


# ============================================================
# CAMERA MONITORING
# ============================================================

def start_camera_monitoring():

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():

        print(
            "ERROR: Camera feed not available."
        )

        return

    print(
        "🇮🇳 BharatBus AI CCTV started."
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
                break

            # ------------------------------------------------
            # Basic Computer Vision
            # ------------------------------------------------

            gray = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2GRAY
            )

            blur = cv2.GaussianBlur(
                gray,
                (5, 5),
                0
            )

            _, thresh = cv2.threshold(
                blur,
                60,
                255,
                cv2.THRESH_BINARY
            )

            contours, _ = cv2.findContours(
                thresh,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )

            passenger_count = 0

            for contour in contours:

                area = cv2.contourArea(
                    contour
                )

                if area > 700:

                    passenger_count += 1

                    x, y, w, h = cv2.boundingRect(
                        contour
                    )

                    cv2.rectangle(
                        frame,
                        (x, y),
                        (x + w, y + h),
                        (0, 255, 0),
                        2
                    )

            # ------------------------------------------------
            # Display
            # ------------------------------------------------

            cv2.putText(
                frame,
                f"BharatBus AI Crowd: {passenger_count}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 0, 255),
                2
            )

            cv2.imshow(
                "BharatBus AI - CCTV",
                frame
            )

            # ------------------------------------------------
            # Send telemetry every 5 seconds
            # ------------------------------------------------

            if time.time() - last_api_call >= 5:

                payload = {

                    "station_id": STATION_ID,

                    "water_tank_level_pct": 35.0,

                    "ambient_temp_c": 37.5,

                    "dustbin_fill_pct": 75.0,

                    "platform_crowd_count":
                        passenger_count
                }

                try:

                    response = requests.post(
                        API_URL,
                        json=payload,
                        timeout=10
                    )

                    if response.ok:

                        result = response.json()

                        score = result[
                            "data"
                        ][
                            "bharat_infrastructure_score"
                        ]

                        status = result[
                            "data"
                        ][
                            "health_status"
                        ]

                        print(
                            f"[LIVE AI] "
                            f"Score={score}/100 "
                            f"Status={status} "
                            f"Crowd={passenger_count}"
                        )

                    else:

                        print(
                            "API ERROR:",
                            response.status_code
                        )

                except Exception as error:

                    print(
                        "SYNC ERROR:",
                        error
                    )

                last_api_call = time.time()

            # ------------------------------------------------
            # Quit
            # ------------------------------------------------

            if cv2.waitKey(1) & 0xFF == ord("q"):

                break

    finally:

        cap.release()

        cv2.destroyAllWindows()


if __name__ == "__main__":

    start_camera_monitoring()