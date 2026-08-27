import cv2
import requests
import time

API_URL = "http://127.0.0.1:8000/api/v1/telemetry/process"

def start_camera_monitoring():
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Camera feed not available.")
        return

    print("BharatBus AI - Starting CCTV Feed... Press 'q' to stop.")
    last_api_call = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 60, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        passenger_count = sum(1 for c in contours if cv2.contourArea(c) > 700)

        for c in contours:
            if cv2.contourArea(c) > 700:
                x, y, w, h = cv2.boundingRect(c)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

        cv2.putText(frame, f"BharatBus AI Crowd Count: {passenger_count}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        cv2.imshow("Jaipur Bus Terminal - Live CCTV Feed", frame)

        if time.time() - last_api_call > 5:
            payload = {
                "station_id": "JAIPUR-MAIN-PL3",
                "water_tank_level_pct": 35.0,
                "ambient_temp_c": 37.5,
                "dustbin_fill_pct": 75.0,
                "platform_crowd_count": passenger_count
            }
            try:
                res = requests.post(API_URL, json=payload)
                data = res.json()
                score = data["data"]["bharat_infrastructure_score"]
                status = data["data"]["health_status"]
                print(f"[LIVE SYNC] Station Score: {score}/100 | Status: {status}")
            except Exception as e:
                print(f"[SYNC ERROR]: {e}")
            
            last_api_call = time.time()

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    start_camera_monitoring()