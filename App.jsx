import React, { useState, useEffect } from 'react';

export default function App() {
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch Live Telemetry Logs from SQLite Database API
  const fetchLiveTelemetry = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/telemetry/history?limit=7');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
        setIsConnected(true);
      }
    } catch (err) {
      console.error("Backend Connection Error:", err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '28px', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* 1. Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#818cf8', fontWeight: '800' }}>BharatBus AI</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>National Infrastructure Intelligence & Real-Time Command Dashboard</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '20px', border: '1px solid #334155' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isConnected ? '#22c55e' : '#ef4444' }}></span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: isConnected ? '#4ade80' : '#f87171' }}>
            {isConnected ? "SYSTEM LIVE (SQLITE SYNC)" : "BACKEND OFFLINE"}
          </span>
        </div>
      </div>

      {/* 2. Top Metric Highlight */}
      {history.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '24px 0' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>LATEST NODE UPDATED</span>
            <h3 style={{ margin: '4px 0 0 0', color: '#38bdf8' }}>{history[0].station_id}</h3>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>INFRASTRUCTURE SCORE</span>
            <h3 style={{ margin: '4px 0 0 0', color: '#facc15' }}>{history[0].score} / 100</h3>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>HEALTH STATUS</span>
            <h3 style={{ margin: '4px 0 0 0', color: history[0].status === 'GREEN' ? '#4ade80' : history[0].status === 'YELLOW' ? '#facc15' : '#f87171' }}>
              {history[0].status}
            </h3>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>PASSENGER DENSITY</span>
            <h3 style={{ margin: '4px 0 0 0', color: '#c084fc' }}>{history[0].crowd_count} Persons</h3>
          </div>
        </div>
      )}

      {/* 3. Real-Time Telemetry Logs Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', marginTop: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f1f5f9' }}>📊 Live Multi-Station Telemetry Audit (SQLite Log Stream)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', color: '#64748b', fontSize: '13px' }}>
              <th style={{ padding: '12px' }}>TIMESTAMP</th>
              <th style={{ padding: '12px' }}>STATION NODE</th>
              <th style={{ padding: '12px' }}>SCORE</th>
              <th style={{ padding: '12px' }}>STATUS</th>
              <th style={{ padding: '12px' }}>CCTV CROWD COUNT</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                <td style={{ padding: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{row.timestamp}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#f8fafc' }}>{row.station_id}</td>
                <td style={{ padding: '12px', color: '#38bdf8', fontWeight: '600' }}>{row.score}/100</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                    backgroundColor: row.status === 'GREEN' ? '#14532d' : row.status === 'YELLOW' ? '#713f12' : '#7f1d1d',
                    color: row.status === 'GREEN' ? '#4ade80' : row.status === 'YELLOW' ? '#facc15' : '#f87171'
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '12px', color: '#cbd5e1' }}>{row.crowd_count} Passengers</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}