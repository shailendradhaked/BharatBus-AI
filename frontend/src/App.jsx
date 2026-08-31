import React, { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import X402Payment from "./X402Payment";

// ============================================================
// PRODUCTION BACKEND
// ============================================================

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://bharatbus-ai.onrender.com";

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
// FALLBACK / DEMO DATA
// ============================================================

const fallbackRoute = {
  id: 1,
  source: "Kashmere Gate",
  destination: "Anand Vihar",
  fare: 30,
  bus_no: "DL-01-AI-4029",
};

const initialTelemetry = {
  total_crowd: 1280,
  avg_score: 65.4,
  booked_count: 5,
};

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
// MAP FOLLOW COMPONENT
// ============================================================

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position);
    }
  }, [position, map]);

  return null;
}

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

  const [backendStatus, setBackendStatus] =
    useState("Checking...");

  const [lastUpdated, setLastUpdated] = useState(null);

  const [busPosition, setBusPosition] = useState([
    28.6139,
    77.209,
  ]);

  const [telemetry, setTelemetry] =
    useState(initialTelemetry);

  // ==========================================================
  // API HELPER
  // ==========================================================

  const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(
      `${API_BASE}${endpoint}`,
      {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
          ...(options.headers || {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `${endpoint} failed with ${response.status}`
      );
    }

    return response;
  };

  // ==========================================================
  // FETCH ROUTES
  // ==========================================================

  const fetchRoutes = async () => {
    try {
      const response = await apiFetch("/api/routes");

      const data = await response.json();

      const routes = Array.isArray(data)
        ? data
        : Array.isArray(data?.routes)
        ? data.routes
        : [];

      if (routes.length > 0) {
        setRoutesList(routes);

        setSelectedRoute((previous) => {
          if (!previous) return routes[0];

          return (
            routes.find(
              (route) =>
                String(route.id) ===
                String(previous.id)
            ) || routes[0]
          );
        });
      } else {
        setRoutesList([fallbackRoute]);
        setSelectedRoute(fallbackRoute);
      }

      setBackendStatus("Online");
    } catch (error) {
      console.error("Routes API:", error);

      setRoutesList([fallbackRoute]);
      setSelectedRoute((previous) =>
        previous || fallbackRoute
      );

      setBackendStatus("Online • Demo Fallback");
    }
  };

  // ==========================================================
  // FETCH TELEMETRY
  // ==========================================================

  const fetchTelemetry = async () => {
    try {
      const response = await apiFetch(
        "/api/telemetry"
      );

      const data = await response.json();

      const telemetryData =
        data?.data && typeof data.data === "object"
          ? data.data
          : data;

      setTelemetry((previous) => ({
        ...previous,
        ...telemetryData,
      }));

      setBackendStatus("Online");
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Telemetry API:", error);

      setBackendStatus((previous) =>
        previous === "Checking..."
          ? "Offline • Demo Mode"
          : previous
      );
    }
  };

  // ==========================================================
  // INITIAL LOAD + LIVE POLLING
  // ==========================================================

  useEffect(() => {
    fetchRoutes();
    fetchTelemetry();

    const telemetryInterval = setInterval(() => {
      fetchTelemetry();
    }, 15000);

    const routesInterval = setInterval(() => {
      fetchRoutes();
    }, 60000);

    const gpsInterval = setInterval(() => {
      setBusPosition((previous) => [
        previous[0] +
          (Math.random() - 0.5) * 0.002,
        previous[1] +
          (Math.random() - 0.5) * 0.002,
      ]);
    }, 4000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(routesInterval);
      clearInterval(gpsInterval);
    };
  }, []);

  // ==========================================================
  // BOOK TICKET
  // ==========================================================

  const handlePayment = async () => {
    if (!selectedRoute) return;

    if (!passengerName.trim()) {
      setNotification(
        "⚠️ Please enter passenger name."
      );
      return;
    }

    try {
      const response = await apiFetch(
        "/api/book-ticket",
        {
          method: "POST",
          body: JSON.stringify({
            name: passengerName.trim(),
            route: `${selectedRoute.source} ➔ ${selectedRoute.destination}`,
            amount: Number(selectedRoute.fare || 30),
          }),
        }
      );

      const result = await response.json();

      setNotification(
        `✅ ${
          result.message ||
          "Ticket booked successfully"
        }`
      );

      setBackendStatus("Online");
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
  // REFRESH BUTTON
  // ==========================================================

  const handleRefresh = async () => {
    setBackendStatus("Refreshing...");

    await Promise.all([
      fetchRoutes(),
      fetchTelemetry(),
    ]);
  };

  const updatedText = lastUpdated
    ? lastUpdated.toLocaleTimeString()
    : "Waiting for data";

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f19",
        color: "#f3f4f6",
        padding: "20px",
        fontFamily:
          "Inter, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          borderBottom:
            "1px solid #1f2937",
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
            AI-Powered Smart Public Transport
            Infrastructure
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
            onClick={() =>
              setActiveTab("passenger")
            }
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
            onClick={() =>
              setActiveTab("admin")
            }
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

          <button
            onClick={handleRefresh}
            style={{
              ...button,
              background: "#374151",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* NOTIFICATION */}
      {notification && (
        <div
          style={{
            background: "#065f46",
            border:
              "1px solid #34d399",
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

      {/* PASSENGER PORTAL */}
      {activeTab === "passenger" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",
            gap: "20px",
          }}
        >
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
                  margin:
                    "10px 0 5px",
                }}
              >
                {selectedRoute
                  ? `${selectedRoute.source} ➔ ${selectedRoute.destination}`
                  : "Select a Route"}
              </h2>

              <p style={muted}>
                Smart Ticketing + Live GPS + x402 Web3
              </p>
            </div>

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
                value={
                  selectedRoute?.id || ""
                }
                onChange={(event) => {
                  const route =
                    routesList.find(
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
                  border:
                    "1px solid #374151",
                  borderRadius: "6px",
                }}
              >
                {routesList.map(
                  (route) => (
                    <option
                      key={route.id}
                      value={route.id}
                    >
                      {route.source} →{" "}
                      {route.destination} — ₹
                      {route.fare}
                    </option>
                  )
                )}
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
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "15px",
                  }}
                >
                  <span>
                    Fare:{" "}
                    <b>
                      ₹
                      {selectedRoute?.fare ||
                        30}
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
                  Book Ticket
                </button>
              </div>
            ) : paymentStep === "form" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();

                  if (
                    passengerName.trim()
                  ) {
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
                    boxSizing:
                      "border-box",
                    padding: "11px",
                    background: "#111827",
                    border:
                      "1px solid #374151",
                    color: "#fff",
                    borderRadius: "6px",
                    marginBottom:
                      "12px",
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
                  Proceed to Payment
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
                    marginBottom: "15px",
                  }}
                >
                  Choose Payment Gateway
                </h3>

                {/* Option A: UPI QR */}
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}>
                    Option A: UPI Payment
                  </p>
                  <div
                    style={{
                      display:
                        "inline-block",
                      background: "#fff",
                      padding: "10px",
                      borderRadius: "8px",
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=bharatbus@icici%26pn=BharatBusAI%26am=${selectedRoute?.fare || 30}.00%26cu=INR`}
                      alt="BharatBus UPI QR"
                      width="150"
                      height="150"
                    />
                  </div>
                  <button
                    onClick={handlePayment}
                    style={{
                      ...button,
                      width: "100%",
                      marginTop: "10px",
                      background: "#10b981",
                    }}
                  >
                    Simulate UPI Payment
                  </button>
                </div>

                <hr style={{ borderColor: "#374151", margin: "20px 0" }} />

                {/* Option B: x402 Algorand Web3 Component */}
                <div>
                  <p style={{ fontSize: "12px", color: "#38bdf8", marginBottom: "8px", fontWeight: "bold" }}>
                    Option B: Web3 x402 Micro-Transaction
                  </p>
                  <X402Payment
                    routeId={selectedRoute?.id ? String(selectedRoute.id) : "JAIPUR-MAIN"}
                    fareAmount={(selectedRoute?.fare || 30) * 1000000}
                    passengerName={passengerName}
                  />
                </div>

                <button
                  onClick={() =>
                    setPaymentStep("form")
                  }
                  style={{
                    marginTop: "15px",
                    background:
                      "transparent",
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
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#38bdf8",
                    marginTop: 0,
                    marginBottom: "4px",
                  }}
                >
                  🗺️ Live Bus GPS
                </h3>

                <span style={muted}>
                  Last update: {updatedText}
                </span>
              </div>

              <span
                style={{
                  color:
                    backendStatus.includes(
                      "Offline"
                    )
                      ? "#f87171"
                      : "#34d399",
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
                marginTop: "10px",
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
                <MapUpdater
                  position={busPosition}
                />

                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap"
                />

                <Marker
                  position={busPosition}
                >
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

      {/* ADMIN COMMAND CENTER */}
      {activeTab === "admin" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
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
                🇮🇳 BharatBus AI
                Command Center
              </h2>

              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "12px",
                }}
              >
                National Smart Public
                Transport Infrastructure
                Intelligence
              </p>
            </div>

            <span
              style={{
                background:
                  backendStatus.includes(
                    "Offline"
                  )
                    ? "#7f1d1d"
                    : "#065f46",
                color:
                  backendStatus.includes(
                    "Offline"
                  )
                    ? "#fca5a5"
                    : "#34d399",
                border:
                  "1px solid currentColor",
                padding:
                  "7px 12px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              ● SYSTEM{" "}
              {backendStatus.toUpperCase()}
            </span>
          </div>

          <section
            style={{
              ...section,
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span style={muted}>
                🔄 Live telemetry polling
                every 15 seconds
              </span>

              <span
                style={{
                  color: "#34d399",
                  fontSize: "11px",
                }}
              >
                API: {API_BASE}
              </span>
            </div>
          </section>

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
                  telemetry.total_crowd ||
                    0
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
                {infrastructure.healthScore}
                /100
              </h2>

              <small style={muted}>
                AI + SAS Score
              </small>
            </div>
          </div>

          <section style={section}>
            <h3
              style={{
                color: "#38bdf8",
                marginTop: 0,
              }}
            >
              🚨 Live AI Infrastructure
              Alerts
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
                  Platform 4 —
                  Garbage Overflow
                </h4>

                <p style={muted}>
                  AI detected excessive
                  waste accumulation.
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
                  Platform 2 — High
                  Crowd Density
                </h4>

                <p style={muted}>
                  Occupancy approaching
                  safe capacity.
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
                  Public Toilet —
                  Cleaning Overdue
                </h4>

                <p style={muted}>
                  Maintenance service
                  required.
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
        </div>
      )}
    </div>
  );
}