import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://bharatbus-ai.onrender.com";

export default function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ticket Form State
  const [passengerName, setPassengerName] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [bookingStatus, setBookingStatus] = useState(null);

  // Fetch Dashboard Data
  const fetchData = async () => {
    try {
      const [telemetryRes, alertsRes, routesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/telemetry`),
        fetch(`${API_BASE_URL}/api/alerts`),
        fetch(`${API_BASE_URL}/api/routes`)
      ]);

      if (!telemetryRes.ok || !alertsRes.ok) {
        throw new Error("Failed to connect to backend APIs");
      }

      const telemetryData = await telemetryRes.json();
      const alertsData = await alertsRes.json();
      const routesData = routesRes.ok ? await routesRes.json() : [];

      setTelemetry(telemetryData);
      setAlerts(alertsData.alerts || []);
      setRoutes(routesData);
      setError(null);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError("Unable to sync live telemetry from BharatBus AI server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleBookTicket = async (e) => {
    e.preventDefault();
    if (!passengerName || !selectedRoute) return;

    const routeObj = routes.find((r) => r.bus_no === selectedRoute || r.source === selectedRoute);
    const fare = routeObj ? routeObj.fare : 50;
    const routeName = routeObj ? `${routeObj.source} -> ${routeObj.destination}` : selectedRoute;

    try {
      const res = await fetch(`${API_BASE_URL}/api/book-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: passengerName,
          route: routeName,
          amount: fare
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBookingStatus({ success: true, message: `Ticket Confirmed! ID: ${data.ticket_id}` });
        setPassengerName("");
        setSelectedRoute("");
        fetchData();
      } else {
        setBookingStatus({ success: false, message: "Booking failed. Try again." });
      }
    } catch (err) {
      setBookingStatus({ success: false, message: "Server connection failed." });
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Top Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#1a202c", lineHeight: "1.2" }}>🇮🇳 BharatBus AI</h1>
          <p style={{ margin: "5px 0 0 0", color: "#718096", fontSize: "14px" }}>Smart Public Transport Infrastructure & Telemetry</p>
        </div>
        <button onClick={fetchData} style={{ padding: "10px 16px", backgroundColor: "#3182ce", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
          🔄 Refresh
        </button>
      </header>

      {error && <div style={{ backgroundColor: "#fed7d7", color: "#9b2c2c", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>⚠️ {error}</div>}

      {loading && !telemetry ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#4a5568" }}>Loading Telemetry Data...</div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
              <div style={{ color: "#4a5568", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Current Passengers</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2d3748" }}>{telemetry?.total_crowd ?? 0}</div>
            </div>
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
              <div style={{ color: "#4a5568", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Infrastructure Health</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: (telemetry?.infrastructure_health ?? 0) >= 70 ? "#38a169" : "#e53e3e" }}>
                {telemetry?.infrastructure_health ?? 0}%
              </div>
            </div>
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
              <div style={{ color: "#4a5568", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Cleanliness Score</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#3182ce" }}>{telemetry?.cleanliness_score ?? 0}/100</div>
            </div>
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
              <div style={{ color: "#4a5568", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Facility Health</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#dd6b20" }}>{telemetry?.facility_health ?? 0}/100</div>
            </div>
          </div>

          {/* Section: Alerts & Booking */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Alerts Panel */}
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ marginTop: 0, fontSize: "18px", color: "#2d3748" }}>🚨 Active AI Infrastructure Alerts</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {alerts.length === 0 ? (
                  <p style={{ color: "#718096" }}>No active alerts.</p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} style={{ padding: "12px", borderRadius: "6px", backgroundColor: alert.priority === "HIGH" ? "#fff5f5" : "#fffff0", borderLeft: alert.priority === "HIGH" ? "4px solid #e53e3e" : "4px solid #d69e2e" }}>
                      <strong style={{ color: alert.priority === "HIGH" ? "#c53030" : "#b7791f" }}>[{alert.priority}] {alert.alert_type}</strong>
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#4a5568" }}>{alert.message}</p>
                      <small style={{ color: "#a0aec0" }}>{alert.location} | {alert.bus_no}</small>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ticket Booking Panel */}
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ marginTop: 0, fontSize: "18px", color: "#2d3748" }}>🎫 Ticket Booking</h3>
              <form onSubmit={handleBookTicket} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  required
                  placeholder="Passenger Name"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0" }}
                />
                <select
                  required
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0" }}
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.bus_no}>{r.source} ➔ {r.destination} (₹{r.fare})</option>
                  ))}
                </select>
                <button type="submit" style={{ padding: "10px", backgroundColor: "#38a169", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                  Book Ticket
                </button>
                {bookingStatus && (
                  <div style={{ padding: "10px", borderRadius: "6px", backgroundColor: bookingStatus.success ? "#f0fff4" : "#fff5f5", color: bookingStatus.success ? "#276749" : "#9b2c2c", fontSize: "14px" }}>
                    {bookingStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}