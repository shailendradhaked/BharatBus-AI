import os
import time
import requests

try:
    import cv2
except ImportError:
    cv2 = None


BACKEND_URL = os.getenv(
    "BHARATBUS_BACKEND_URL",
    "http://127.0.0.1:8000"
)

STATION_ID = os.getenv(
    "BHARATBUS_STATION_ID",
    "JAIPUR-MAIN-PL3"
)

SEND_EVERY = float(
    os.getenv(
        "VISION_SEND_INTERVAL",
        "5"
    )
)


def send_telemetry(
    passenger_count,
    temperature=35,
    water=70,
    dustbin=40,
):

    url = (
        f"{BACKEND_URL.rstrip('/')}"
        "/api/v1/telemetry/process"
    )

    payload = {
        "station_id": STATION_ID,
        "water_tank_level_pct": water,
        "ambient_temp_c": temperature,
        "dustbin_fill_pct": dustbin,
        "platform_crowd_count":
            int(passenger_count),
    }

    response = requests.post(
        url,
        json=payload,
        timeout=8,
    )

    response.raise_for_status()

    return response.json()


def start_camera_monitoring(
    camera_index=0
):

    if cv2 is None:

        raise RuntimeError(
            "Install OpenCV and requests:\n"
            "pip install opencv-python requests"
        )

    cap = cv2.VideoCapture(
        camera_index
    )

    if not cap.isOpened():

        raise RuntimeError(
            "Camera feed not available."
        )

    hog = cv2.HOGDescriptor()

    hog.setSVMDetector(
        cv2.HOGDescriptor_getDefaultPeopleDetector()
    )

    print(
        "🇮🇳 BharatBus AI CCTV started."
    )

    print(
        "Press Q to stop."
    )

    last_api_call = 0

    while True:

        ok, frame = cap.read()

        if not ok:
            break

        boxes, weights = (
            hog.detectMultiScale(
                frame,
                winStride=(8, 8),
                padding=(8, 8),
                scale=1.05,
            )
        )

        people = [
            (box, weight)
            for box, weight
            in zip(boxes, weights)
            if float(weight) >= 0.25
        ]

        for (
            x,
            y,
            w,
            h
        ), weight in people:

            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                (0, 220, 80),
                2,
            )

        count = len(people)

        cv2.putText(
            frame,
            f"BharatBus AI | Crowd: {count}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (30, 180, 255),
            2,
        )

        if (
            time.time() - last_api_call
            >= SEND_EVERY
        ):

            try:

                result = send_telemetry(
                    count
                )

                data = result["data"]

                print(
                    f"[LIVE] "
                    f"Crowd={count} | "
                    f"Score="
                    f"{data['bharat_infrastructure_score']} | "
                    f"Status="
                    f"{data['health_status']}"
                )

            except Exception as error:

                print(
                    "[SYNC ERROR]",
                    error
                )

            last_api_call = time.time()

        cv2.imshow(
            "BharatBus AI - Live CCTV",
            frame
        )

        if (
            cv2.waitKey(1) & 0xFF
            == ord("q")
        ):
            break

    cap.release()

    cv2.destroyAllWindows()


if __name__ == "__main__":

    start_camera_monitoring()