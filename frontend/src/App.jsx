import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://bharatbus-ai.onrender.com";

export default function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [telemetryRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/telemetry`),
        fetch(`${API_BASE_URL}/api/alerts`)
      ]);

      if (!telemetryRes.ok || !alertsRes.ok) {
        throw new Error("Failed to fetch data from backend API");
      }

      const telemetryData = await telemetryRes.json();
      const alertsData = await alertsRes.json();

      setTelemetry(telemetryData);
      setAlerts(alertsData.alerts || []);
      setError(null);
    } catch (err) {
      console.error("API Error:", err);
      setError("Unable to connect to BharatBus AI backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #ccc", paddingBottom: "10px" }}>
        <h1>🇮🇳 BharatBus AI — Command Dashboard</h1>
        <button onClick={fetchDashboardData} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Refresh Telemetry
        </button>
      </header>

      {error && (
        <div style={{ backgroundColor: "#ffdddd", border: "1px solid red", padding: "10px", margin: "15px 0", borderRadius: "5px" }}>
          ⚠️ {error}
        </div>
      )}

      {loading && !telemetry ? (
        <p>Loading real-time infrastructure data...</p>
      ) : (
        <main style={{ marginTop: "20px" }}>
          {/* Telemetry Overview Cards */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
            <div style={cardStyle}>
              <h3>Current Passengers</h3>
              <p style={metricStyle}>{telemetry?.total_crowd ?? 0}</p>
            </div>
            <div style={cardStyle}>
              <h3>Infrastructure Health</h3>
              <p style={{ ...metricStyle, color: (telemetry?.infrastructure_health ?? 0) > 70 ? "green" : "orange" }}>
                {telemetry?.infrastructure_health ?? 0}%
              </p>
            </div>
            <div style={cardStyle}>
              <h3>Cleanliness Score</h3>
              <p style={metricStyle}>{telemetry?.cleanliness_score ?? 0}/100</p>
            </div>
            <div style={cardStyle}>
              <h3>Facility Health</h3>
              <p style={metricStyle}>{telemetry?.facility_health ?? 0}/100</p>
            </div>
          </section>

          {/* Active AI Infrastructure Alerts */}
          <section style={{ marginTop: "30px" }}>
            <h2>🚨 Active AI Infrastructure Alerts</h2>
            {alerts.length === 0 ? (
              <p>No active anomalies detected across bus stands.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {alerts.map((alert) => (
                  <div
                    key={alert.id || Math.random()}
                    style={{
                      padding: "15px",
                      borderRadius: "6px",
                      backgroundColor: alert.priority === "HIGH" ? "#fff0f0" : "#fffbe6",
                      borderLeft: alert.priority === "HIGH" ? "6px solid #ff4d4f" : "6px solid #faad14"
                    }}
                  >
                    <strong>[{alert.priority}] {alert.alert_type}</strong> — {alert.location} ({alert.bus_no})
                    <p style={{ margin: "5px 0 0 0", color: "#555" }}>{alert.message}</p>
                    <small style={{ color: "#888" }}>{new Date(alert.timestamp).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: "#fff",
  padding: "15px",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  textAlign: "center"
};

const metricStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: "10px 0 0 0"
};