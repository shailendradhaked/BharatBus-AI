import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [telemetryData, setTelemetryData] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [telemetryRes, ticketsRes, fleetRes] = await Promise.all([
        fetch("https://bharatbus-ai.onrender.com/api/v1/telemetry/history?limit=10"),
        fetch("https://bharatbus-ai.onrender.com/api/v1/tickets"),
        fetch("https://bharatbus-ai.onrender.com/api/v1/fleet/suggestions")
      ]);

      const telemetryJson = await telemetryRes.json();
      const ticketsJson = await ticketsRes.json();
      const fleetJson = await fleetRes.json();

      if (telemetryJson.success && telemetryJson.history) setTelemetryData(telemetryJson.history);
      if (ticketsJson.success && ticketsJson.tickets) setTickets(ticketsJson.tickets);
      if (fleetJson.success && fleetJson.dispatches) setDispatches(fleetJson.dispatches);

    } catch (error) {
      console.error("Error fetching live data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await fetch(`https://bharatbus-ai.onrender.com/api/v1/tickets/resolve/${ticketId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => prev.filter(t => t.ticket_id !== ticketId));
      }
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Format data for Chart (Reverse so latest is right)
  const chartData = [...telemetryData].reverse().map(item => ({
    time: item.timestamp ? item.timestamp.split(' ')[1] : '',
    Crowd: item.crowd_count,
    Score: item.score
  }));

  const totalCrowd = telemetryData.reduce((acc, curr) => acc + curr.crowd_count, 0);
  const avgScore = telemetryData.length > 0 ? (telemetryData.reduce((acc, curr) => acc + curr.score, 0) / telemetryData.length).toFixed(1) : 0;

  return (
    <div style={{ padding: '24px', backgroundColor: '#090d16', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>BharatBus-AI Command Center</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>National Transport Infrastructure, Analytics & AI Task Automation</p>
        </div>
        <span style={{ backgroundColor: '#0284c7', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Live AI Engine Active</span>
      </header>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>TOTAL MONITORED CROWD</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', color: '#38bdf8' }}>👥 {totalCrowd}</h2>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>NETWORK AVG BHARAT SCORE</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', color: avgScore < 50 ? '#f43f5e' : '#10b981' }}>📊 {avgScore} / 100</h2>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>ACTIVE EMERGENCY TICKETS</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', color: tickets.length > 0 ? '#f43f5e' : '#10b981' }}>🚨 {tickets.length}</h2>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>AI FLEET DISPATCHES</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', color: '#0284c7' }}>🚌 {dispatches.length}</h2>
        </div>
      </div>

      {/* Analytics Chart Section */}
      <section style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0, marginBottom: '16px' }}>📈 Real-Time Crowd Density vs Bharat Score Analytics</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155' }} />
              <Area type="monotone" dataKey="Crowd" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} name="Crowd Count" />
              <Area type="monotone" dataKey="Score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} name="Bharat Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Grid Layout for AI Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Section 1: Emergency Tickets */}
        <section style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '16px', color: '#f43f5e', marginTop: 0 }}>🚨 Emergency Task Automation ({tickets.length})</h2>
          {tickets.length === 0 ? (
            <p style={{ color: '#10b981', fontSize: '14px' }}>✅ Zero pending task alerts.</p>
          ) : (
            tickets.map(t => (
              <div key={t.ticket_id} style={{ backgroundColor: '#1e1b4b', padding: '12px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #3730a3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a5b4fc' }}>
                  <span>{t.ticket_id}</span>
                  <span>{t.station_id}</span>
                </div>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#fca5a5' }}><strong>Issue:</strong> {t.issue}</p>
                <button onClick={() => handleResolveTicket(t.ticket_id)} style={{ width: '100%', padding: '6px', backgroundColor: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                  Mark Resolved ✓
                </button>
              </div>
            ))
          )}
        </section>

        {/* Section 2: AI Fleet Re-Routing Engine */}
        <section style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0 }}>🚌 AI Smart Fleet Dispatch ({dispatches.length})</h2>
          {dispatches.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>No congestion detected. Extra buses not required.</p>
          ) : (
            dispatches.map(d => (
              <div key={d.dispatch_id} style={{ backgroundColor: '#0c4a6e', padding: '12px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #0284c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7dd3fc' }}>
                  <span>{d.dispatch_id}</span>
                  <span>ETA: {d.estimated_arrival}</span>
                </div>
                <h4 style={{ margin: '4px 0', color: '#fff' }}>Deploy +{d.extra_buses} Extra Buses → {d.target_station}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#bae6fd' }}>Source: {d.depot_source}</p>
              </div>
            ))
          )}
        </section>

      </div>

      {/* Telemetry Table */}
      <section>
        <h2 style={{ fontSize: '18px', color: '#38bdf8' }}>Live Terminal Logs Stream</h2>
        {loading ? <p>Loading stream...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', textAlign: 'left', color: '#94a3b8', fontSize: '14px' }}>
                <th style={{ padding: '12px' }}>Timestamp</th>
                <th style={{ padding: '12px' }}>Station ID</th>
                <th style={{ padding: '12px' }}>Crowd Count</th>
                <th style={{ padding: '12px' }}>Bharat Score</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {telemetryData.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b', fontSize: '14px' }}>
                  <td style={{ padding: '12px' }}>{item.timestamp}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.station_id}</td>
                  <td style={{ padding: '12px' }}>👤 {item.crowd_count}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.score}</td>
                  <td style={{ padding: '12px', color: item.status === 'RED' ? '#f43f5e' : '#10b981', fontWeight: 'bold' }}>
                    {item.status === 'RED' ? '⚠️ Critical' : '🟢 Optimal'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;