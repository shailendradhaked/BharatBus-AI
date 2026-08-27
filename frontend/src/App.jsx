import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  Bus,
  ShieldAlert
} from 'lucide-react';

const BACKEND_URL = 'https://bharatbus-ai.onrender.com';

export default function App() {
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/telemetry/history?limit=10`);
      if (!res.ok) throw new Error('Failed to fetch telemetry data');
      
      const data = await res.json();
      
      // Extract history array from API response
      const list = data.history || data; 
      setTelemetryData(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const getScoreBadge = (score) => {
    const numScore = parseFloat(score || 0);
    if (numScore >= 75) return <span style={{ padding: '4px 8px', backgroundColor: '#14532d', color: '#4ade80', borderRadius: '12px', fontSize: '12px' }}>Optimal ({numScore})</span>;
    if (numScore >= 50) return <span style={{ padding: '4px 8px', backgroundColor: '#713f12', color: '#facc15', borderRadius: '12px', fontSize: '12px' }}>Moderate ({numScore})</span>;
    return <span style={{ padding: '4px 8px', backgroundColor: '#7f1d1d', color: '#f87171', borderRadius: '12px', fontSize: '12px' }}>Critical ({numScore})</span>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', fontFamily: 'sans-serif', padding: '24px' }}>
      <header style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '12px', backgroundColor: '#2563eb', borderRadius: '12px' }}>
            <Bus style={{ width: '32px', height: '32px', color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>BharatBus-AI Command Center</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Multi-Station Infrastructure Intelligence Platform</p>
          </div>
        </div>

        <button 
          onClick={fetchTelemetry}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} />
          <span>Refresh Data</span>
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '32px auto 0' }}>
        {error && (
          <div style={{ padding: '16px', backgroundColor: '#450a0a', border: '1px solid #991b1b', borderRadius: '12px', color: '#f87171', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle style={{ width: '20px', height: '20px' }} />
            <span>Unable to connect to live backend server: {error}</span>
          </div>
        )}

        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
              Live Terminal Logs Stream
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Auto-refreshing every 5s</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#020617', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                <th style={{ padding: '16px' }}>Timestamp</th>
                <th style={{ padding: '16px' }}>Station ID</th>
                <th style={{ padding: '16px' }}>Crowd Count</th>
                <th style={{ padding: '16px' }}>Bharat Score</th>
                <th style={{ padding: '16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {telemetryData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'Fetching terminal logs...' : 'No telemetry records found.'}
                  </td>
                </tr>
              ) : (
                telemetryData.map((log, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>{log.timestamp}</td>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{log.station_id}</td>
                    <td style={{ padding: '16px', color: '#c084fc' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users style={{ width: '14px', height: '14px' }} /> {log.crowd_count}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>{getScoreBadge(log.score)}</td>
                    <td style={{ padding: '16px' }}>
                      {log.status === 'RED' ? (
                        <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert style={{ width: '16px', height: '16px' }} /> Critical Alert
                        </span>
                      ) : (
                        <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle style={{ width: '16px', height: '16px' }} /> {log.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}