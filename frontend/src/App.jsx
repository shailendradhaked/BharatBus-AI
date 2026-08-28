import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ============================================================
// PRODUCTION BACKEND
// ============================================================

const API_URL = "https://bharatbus-ai.onrender.com";

// ============================================================
// LEAFLET MARKER FIX
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ============================================================
// DEMO ANALYTICS DATA
// ============================================================

const crowdData = [
  { time: "10 AM", crowd: 400 },
  { time: "11 AM", crowd: 850 },
  { time: "12 PM", crowd: 1200 },
  { time: "1 PM", crowd: 950 },
  { time: "2 PM", crowd: 1400 },
  { time: "3 PM", crowd: 1250 },
  { time: "4 PM", crowd: 1650 },
];

const infrastructure = {
  busStands: 248,
  alerts: 6,
  cleanliness: 82,
  facilities: 74,
  healthScore: 78,
  temperature: 38.6,
  humidity: 61,
  waterLevel: 74,
  toiletHealth: 41,
  dustbinLevel: 92,
  airQuality: 118,
};

// ============================================================
// STYLES
// ============================================================

const card = {
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: "12px",
  padding: "18px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.18)",
};

const section = {
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "18px",
};

const muted = {
  color: "#9ca3af",
  fontSize: "12px",
};

const button = {
  border: "none",
  borderRadius: "7px",
  padding: "10px 15px",
  cursor: "pointer",
  fontWeight: "700",
  color: "#fff",
};

// ============================================================
// APP
// ============================================================

export default function App() {
  const [activeTab, setActiveTab] = useState("passenger");

  const [routesList, setRoutesList] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const [passengerName, setPassengerName] = useState("");

  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState("form");

  const [notification, setNotification] = useState("");

  const [backendStatus, setBackendStatus] = useState("Checking...");

  const [busPosition, setBusPosition] = useState([
    28.6139,
    77.209,
  ]);

  const [telemetry, setTelemetry] = useState({
    total_crowd: 1280,
    avg_score: 65.4,
    booked_count: 5,
  });

  // ==========================================================
  // FETCH ROUTES
  // ==========================================================

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/routes`);

      if (!response.ok) {
        throw new Error("Routes API failed");
      }

      const data = await response.json();

      setRoutesList(data);

      if (data.length > 0) {
        setSelectedRoute(data[0]);
      }

      setBackendStatus("Online");
    } catch (error) {
      console.error("Routes API:", error);

      setBackendStatus("Online • Demo Mode");

      const fallbackRoute = {
        id: 1,
        source: "Kashmere Gate",
        destination: "Anand Vihar",
        fare: 30,
        bus_no: "DL-01-AI-4029",
      };

      setRoutesList([fallbackRoute]);
      setSelectedRoute(fallbackRoute);
    }
  };

  // ==========================================================
  // FETCH TELEMETRY
  // ==========================================================

  const fetchTelemetry = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/telemetry`
      );

      if (!response.ok) {
        throw new Error("Telemetry API failed");
      }

      const data = await response.json();

      setTelemetry((previous) => ({
        ...previous,
        ...data,
      }));

      setBackendStatus("Online");
    } catch (error) {
      console.error("Telemetry API:", error);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchRoutes();
    fetchTelemetry();

    const telemetryInterval = setInterval(() => {
      fetchTelemetry();
    }, 15000);

    const gpsInterval = setInterval(() => {
      setBusPosition((previous) => [
        previous[0] + (Math.random() - 0.5) * 0.002,
        previous[1] + (Math.random() - 0.5) * 0.002,
      ]);
    }, 4000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(gpsInterval);
    };
  }, []);

  // ==========================================================
  // BOOK TICKET
  // ==========================================================

  const handlePayment = async () => {
    try {
      if (!selectedRoute) return;

      const response = await fetch(
        `${API_URL}/api/book-ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: passengerName,
            route: `${selectedRoute.source} ➔ ${selectedRoute.destination}`,
            amount: selectedRoute.fare,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Booking API failed");
      }

      const result = await response.json();

      setNotification(
        `✅ ${result.message || "Ticket booked successfully"}`
      );
    } catch (error) {
      console.error("Booking API:", error);

      setNotification(
        "✅ Payment successful — Demo Simulation"
      );
    }

    setShowPayment(false);
    setPaymentStep("form");
    setPassengerName("");

    setTimeout(() => {
      setNotification("");
    }, 5000);

    fetchTelemetry();
  };

  // ==========================================================
  // APP
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f19",
        color: "#f3f4f6",
        padding: "20px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          borderBottom: "1px solid #1f2937",
          paddingBottom: "15px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#38bdf8",
              fontSize: "22px",
            }}
          >
            🇮🇳 BharatBus AI
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              color: "#9ca3af",
              fontSize: "11px",
            }}
          >
            AI-Powered Smart Public Transport Infrastructure
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setActiveTab("passenger")}
            style={{
              ...button,
              background:
                activeTab === "passenger"
                  ? "#0284c7"
                  : "#1f2937",
            }}
          >
            🎫 Passenger Portal
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            style={{
              ...button,
              background:
                activeTab === "admin"
                  ? "#0284c7"
                  : "#1f2937",
            }}
          >
            🏢 AI Command Center
          </button>
        </div>
      </header>

      {/* ======================================================
          NOTIFICATION
      ====================================================== */}

      {notification && (
        <div
          style={{
            background: "#065f46",
            border: "1px solid #34d399",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "18px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {notification}
        </div>
      )}

      {/* ======================================================
          PASSENGER PORTAL
      ====================================================== */}

      {activeTab === "passenger" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",
            gap: "20px",
          }}
        >
          {/* BOOKING */}

          <div style={section}>
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  background: "#065f46",
                  color: "#34d399",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                }}
              >
                BUS #
                {selectedRoute?.bus_no ||
                  "DL-01-AI-4029"}
              </span>

              <h2
                style={{
                  fontSize: "18px",
                  margin: "10px 0 5px",
                }}
              >
                {selectedRoute
                  ? `${selectedRoute.source} ➔ ${selectedRoute.destination}`
                  : "Select a Route"}
              </h2>

              <p style={muted}>
                Smart Ticketing + Live GPS
              </p>
            </div>

            {/* ROUTE */}

            <div
              style={{
                background: "#1f2937",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px",
              }}
            >
              <label
                style={{
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                📍 Select Bus Route
              </label>

              <select
                value={selectedRoute?.id || ""}
                onChange={(event) => {
                  const route = routesList.find(
                    (item) =>
                      String(item.id) ===
                      event.target.value
                  );

                  setSelectedRoute(route);
                }}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "10px",
                  background: "#111827",
                  color: "#fff",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                }}
              >
                {routesList.map((route) => (
                  <option
                    key={route.id}
                    value={route.id}
                  >
                    {route.source} →{" "}
                    {route.destination} — ₹
                    {route.fare}
                  </option>
                ))}
              </select>
            </div>

            {!showPayment ? (
              <div
                style={{
                  background: "#1f2937",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "15px",
                  }}
                >
                  <span>
                    Fare:{" "}
                    <b>
                      ₹{selectedRoute?.fare || 30}
                    </b>
                  </span>

                  <span
                    style={{
                      color: "#34d399",
                    }}
                  >
                    GPS 🟢
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowPayment(true);
                    setPaymentStep("form");
                  }}
                  style={{
                    ...button,
                    width: "100%",
                    background: "#0284c7",
                  }}
                >
                  Book Ticket — UPI QR
                </button>
              </div>
            ) : paymentStep === "form" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();

                  if (passengerName.trim()) {
                    setPaymentStep("qr");
                  }
                }}
                style={{
                  background: "#1f2937",
                  padding: "20px",
                  borderRadius: "8px",
                }}
              >
                <h3
                  style={{
                    color: "#38bdf8",
                  }}
                >
                  Passenger Details
                </h3>

                <input
                  value={passengerName}
                  onChange={(event) =>
                    setPassengerName(
                      event.target.value
                    )
                  }
                  placeholder="Full Name"
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px",
                    background: "#111827",
                    border: "1px solid #374151",
                    color: "#fff",
                    borderRadius: "6px",
                    marginBottom: "12px",
                  }}
                />

                <button
                  type="submit"
                  style={{
                    ...button,
                    width: "100%",
                    background: "#10b981",
                  }}
                >
                  Proceed ₹
                  {selectedRoute?.fare || 30}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowPayment(false)
                  }
                  style={{
                    ...button,
                    width: "100%",
                    marginTop: "8px",
                    background: "#4b5563",
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div
                style={{
                  background: "#1f2937",
                  padding: "20px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    color: "#38bdf8",
                  }}
                >
                  Scan & Pay ₹
                  {selectedRoute?.fare || 30}
                </h3>

                <div
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=bharatbus@icici%26pn=BharatBusAI%26am=${selectedRoute?.fare || 30}.00%26cu=INR`}
                    alt="BharatBus UPI QR"
                  />
                </div>

                <button
                  onClick={handlePayment}
                  style={{
                    ...button,
                    width: "100%",
                    marginTop: "15px",
                    background: "#10b981",
                  }}
                >
                  Simulate Bank Payment
                </button>

                <button
                  onClick={() =>
                    setShowPayment(false)
                  }
                  style={{
                    marginTop: "10px",
                    background: "transparent",
                    color: "#9ca3af",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* GPS MAP */}

          <div
            style={{
              ...section,
              height: "420px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  color: "#38bdf8",
                  marginTop: 0,
                }}
              >
                🗺️ Live Bus GPS
              </h3>

              <span
                style={{
                  color: "#34d399",
                  fontSize: "11px",
                }}
              >
                {backendStatus}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                overflow: "hidden",
                borderRadius: "8px",
              }}
            >
              <MapContainer
                center={busPosition}
                zoom={13}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap"
                />

                <Marker position={busPosition}>
                  <Popup>
                    <b>
                      Bus #
                      {selectedRoute?.bus_no ||
                        "DL-01-AI-4029"}
                    </b>
                    <br />
                    Status: Moving 🟢
                    <br />
                    BharatBus AI GPS
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ADMIN COMMAND CENTER
      ====================================================== */}

      {activeTab === "admin" && (
        <div>
          {/* TITLE */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#38bdf8",
                }}
              >
                🇮🇳 BharatBus AI Command Center
              </h2>

              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "12px",
                }}
              >
                National Smart Public Transport
                Infrastructure Intelligence
              </p>
            </div>

            <span
              style={{
                background: "#065f46",
                color: "#34d399",
                border: "1px solid #34d399",
                padding: "7px 12px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              ● SYSTEM {backendStatus.toUpperCase()}
            </span>
          </div>

          {/* KPI */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(170px,1fr))",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div style={card}>
              <p style={muted}>
                🚌 Active Bus Stands
              </p>

              <h2
                style={{
                  color: "#38bdf8",
                  margin: 0,
                }}
              >
                {infrastructure.busStands}
              </h2>

              <small style={muted}>
                Monitored network
              </small>
            </div>

            <div style={card}>
              <p style={muted}>
                👥 Current Passengers
              </p>

              <h2
                style={{
                  color: "#34d399",
                  margin: 0,
                }}
              >
                {Number(
                  telemetry.total_crowd || 0
                ).toLocaleString()}
              </h2>

              <small style={muted}>
                Live telemetry
              </small>
            </div>

            <div style={card}>
              <p style={muted}>
                🚨 Active AI Alerts
              </p>

              <h2
                style={{
                  color: "#f87171",
                  margin: 0,
                }}
              >
                {infrastructure.alerts}
              </h2>

              <small style={muted}>
                2 high priority
              </small>
            </div>

            <div style={card}>
              <p style={muted}>
                🧹 Cleanliness
              </p>

              <h2
                style={{
                  color: "#fbbf24",
                  margin: 0,
                }}
              >
                {infrastructure.cleanliness}%
              </h2>

              <small style={muted}>
                AI assessment
              </small>
            </div>

            <div style={card}>
              <p style={muted}>
                🚻 Facility Health
              </p>

              <h2
                style={{
                  color: "#a78bfa",
                  margin: 0,
                }}
              >
                {infrastructure.facilities}%
              </h2>

              <small style={muted}>
                Infrastructure
              </small>
            </div>

            <div style={card}>
              <p style={muted}>
                🏥 Overall Health
              </p>

              <h2
                style={{
                  color: "#22d3ee",
                  margin: 0,
                }}
              >
                {infrastructure.healthScore}/100
              </h2>

              <small style={muted}>
                AI + SAS Score
              </small>
            </div>
          </div>

          {/* AI ALERTS */}

          <section style={section}>
            <h3
              style={{
                color: "#38bdf8",
                marginTop: 0,
              }}
            >
              🚨 Live AI Infrastructure Alerts
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(240px,1fr))",
                gap: "12px",
              }}
            >
              <div
                style={{
                  ...card,
                  borderColor: "#7f1d1d",
                }}
              >
                <strong
                  style={{
                    color: "#f87171",
                  }}
                >
                  🔴 HIGH PRIORITY
                </strong>

                <h4>
                  Platform 4 — Garbage Overflow
                </h4>

                <p style={muted}>
                  AI detected excessive waste
                  accumulation.
                </p>

                <span
                  style={{
                    color: "#34d399",
                    fontSize: "11px",
                  }}
                >
                  Cleaning Team Assigned
                </span>
              </div>

              <div
                style={{
                  ...card,
                  borderColor: "#78350f",
                }}
              >
                <strong
                  style={{
                    color: "#fbbf24",
                  }}
                >
                  🟠 MEDIUM PRIORITY
                </strong>

                <h4>
                  Platform 2 — High Crowd Density
                </h4>

                <p style={muted}>
                  Occupancy approaching safe
                  capacity.
                </p>

                <span
                  style={{
                    color: "#fbbf24",
                    fontSize: "11px",
                  }}
                >
                  AI Monitoring
                </span>
              </div>

              <div
                style={{
                  ...card,
                  borderColor: "#7f1d1d",
                }}
              >
                <strong
                  style={{
                    color: "#f87171",
                  }}
                >
                  🔴 HIGH PRIORITY
                </strong>

                <h4>
                  Public Toilet — Cleaning
                  Overdue
                </h4>

                <p style={muted}>
                  Maintenance service required.
                </p>

                <span
                  style={{
                    color: "#f87171",
                    fontSize: "11px",
                  }}
                >
                  Maintenance Pending
                </span>
              </div>
            </div>
          </section>

          {/* FACILITY MONITORING */}

          <section style={section}>
            <h3
              style={{
                color: "#38bdf8",
                marginTop: 0,
              }}
            >
              🏢 Smart Bus Stand Facility
              Monitoring
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(170px,1fr))",
                gap: "12px",
              }}
            >
              <div style={card}>
                <strong>🌡️ Temperature</strong>

                <h2>
                  {infrastructure.temperature}°C
                </h2>

                <span
                  style={{
                    color: "#f87171",
                    fontSize: "11px",
                  }}
                >
                  🔴 High Heat Risk
                </span>
              </div>

              <div style={card}>
                <strong>💧 Humidity</strong>

                <h2>
                  {infrastructure.humidity}%
                </h2>

                <span
                  style={{
                    color: "#fbbf24",
                    fontSize: "11px",
                  }}
                >
                  🟡 Monitor Comfort
                </span>
              </div>

              <div style={card}>
                <strong>🚰 Water Level</strong>

                <h2>
                  {infrastructure.waterLevel}%
                </h2>

                <span
                  style={{
                    color: "#34d399",
                    fontSize: "11px",
                  }}
                >
                  🟢 Available
                </span>
              </div>

              <div style={card}>
                <strong>🚻 Toilet Health</strong>

                <h2>
                  {infrastructure.toiletHealth}%
                </h2>

                <span
                  style={{
                    color: "#f87171",
                    fontSize: "11px",
                  }}
                >
                  🔴 Cleaning Required
                </span>
              </div>

              <div style={card}>
                <strong>🗑️ Smart Dustbin</strong>

                <h2>
                  {infrastructure.dustbinLevel}%
                </h2>

                <span
                  style={{
                    color: "#f87171",
                    fontSize: "11px",
                  }}
                >
                  🔴 Near Capacity
                </span>
              </div>

              <div style={card}>
                <strong>🌫️ Air Quality</strong>

                <h2>
                  AQI {infrastructure.airQuality}
                </h2>

                <span
                  style={{
                    color: "#fbbf24",
                    fontSize: "11px",
                  }}
                >
                  🟡 Moderate Risk
                </span>
              </div>
            </div>
          </section>

          {/* AI INSIGHTS */}

          <section style={section}>
            <h3
              style={{
                color: "#38bdf8",
                marginTop: 0,
              }}
            >
              🧠 AI Predictive Insights
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(240px,1fr))",
                gap: "12px",
              }}
            >
              <div style={card}>
                <strong
                  style={{
                    color: "#38bdf8",
                  }}
                >
                  👥 Crowd Prediction
                </strong>

                <p style={muted}>
                  Platform 3 is expected to
                  exceed safe capacity during
                  evening peak hours.
                </p>

                <b
                  style={{
                    color: "#fbbf24",
                    fontSize: "11px",
                  }}
                >
                  Prediction Risk: MEDIUM
                </b>
              </div>

              <div style={card}>
                <strong
                  style={{
                    color: "#f87171",
                  }}
                >
                  🌡️ Heat Risk Prediction
                </strong>

                <p style={muted}>
                  Waiting-area heat stress risk
                  is increasing.
                </p>

                <b
                  style={{
                    color: "#f87171",
                    fontSize: "11px",
                  }}
                >
                  Risk Level: HIGH
                </b>
              </div>

              <div style={card}>
                <strong
                  style={{
                    color: "#a78bfa",
                  }}
                >
                  🔧 Predictive Maintenance
                </strong>

                <p style={muted}>
                  Cooling equipment requires
                  preventive inspection.
                </p>

                <b
                  style={{
                    color: "#fbbf24",
                    fontSize: "11px",
                  }}
                >
                  Action Recommended
                </b>
              </div>
            </div>
          </section>

          {/* WORKFLOW */}

          <section style={section}>
            <h3
              style={{
                color: "#38bdf8",
                marginTop: 0,
              }}
            >
              🔄 BharatBus AI Response Workflow
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(120px,1fr))",
                gap: "8px",
              }}
            >
              {[
                ["📹", "Detect", "Camera / IoT"],
                ["🤖", "Analyze", "AI Engine"],
                ["📊", "Predict", "SAS Analytics"],
                ["🚨", "Act", "Authority Alert"],
                ["✅", "Verify", "AI Verification"],
              ].map(([icon, title, subtitle]) => (
                <div
                  key={title}
                  style={{
                    ...card,
                    textAlign: "center",
                    padding: "15px 8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "27px",
                    }}
                  >
                    {icon}
                  </div>

                  <strong>{title}</strong>

                  <small style={muted}>
                    {subtitle}
                  </small>
                </div>
              ))}
            </div>
          </section>

          {/* CROWD ANALYTICS */}

          <section style={section}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h3
                style={{
                  color: "#38bdf8",
                  margin: 0,
                }}
              >
                📊 Passenger Crowd Analytics
              </h3>

              <span style={muted}>
                AI + SAS Analytics
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: "300px",
                marginTop: "15px",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={crowdData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />

                  <XAxis
                    dataKey="time"
                    stroke="#9ca3af"
                  />

                  <YAxis
                    stroke="#9ca3af"
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "1px solid #374151",
                      color: "#fff",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="crowd"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* NATIONAL VISION */}

          <section style={section}>
            <h3
              style={{
                color: "#38bdf8",
                marginTop: 0,
              }}
            >
              🇮🇳 National Deployment Vision
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(220px,1fr))",
                gap: "12px",
              }}
            >
              <div style={card}>
                <h3>🚌 Transport</h3>
                <p style={muted}>
                  Monitor buses, routes, crowd
                  levels and passenger demand.
                </p>
              </div>

              <div style={card}>
                <h3>🏢 Infrastructure</h3>
                <p style={muted}>
                  Monitor cleanliness, toilets,
                  water, lighting and waiting
                  areas.
                </p>
              </div>

              <div style={card}>
                <h3>🧠 AI + SAS</h3>
                <p style={muted}>
                  Predict problems before they
                  become major public-service
                  failures.
                </p>
              </div>

              <div style={card}>
                <h3>🚨 Government Action</h3>
                <p style={muted}>
                  Convert AI alerts into
                  maintenance and authority
                  actions.
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <footer
            style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: "10px",
              padding: "15px",
            }}
          >
            <b>BharatBus AI</b>
            <br />
            AI + IoT + SAS Powered Public
            Transport Infrastructure Intelligence
            <br />
            Prototype data is simulated until
            live IoT/CCTV infrastructure is
            connected.
          </footer>
        </div>
      )}
    </div>
  );
}