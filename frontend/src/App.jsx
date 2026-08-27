import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function App() {
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'passenger'
  const [analyticsData, setAnalyticsData] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    total_crowd: 1271,
    avg_score: 61.3,
    emergency_tickets: 5,
    fleet_dispatches: 3
  });

  // Modal / Notification State for Passenger Actions
  const [notification, setNotification] = useState(null);

  // Fetch Real Data from Backend (FastAPI telemetry or simulated live updates)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Agar aapka backend localhost:8000 par chal raha hai toh yahan real API call kar sakte hain:
        // const response = await fetch('http://localhost:8000/analytics');
        // const data = await response.json();
        
        // Current simulated live update with real dynamic timestamps
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        
        const newPoint = {
          time: timeStr,
          crowd: Math.floor(Math.random() * 100) + 1100,
          bharatScore: Number((Math.random() * 10 + 55).toFixed(1))
        };

        setAnalyticsData(prev => [...prev.slice(-9), newPoint]);
      } catch (error) {
        console.error("Error fetching live data:", error);
      }
    };

    fetchData(); // Initial call
    const timer = setInterval(fetchData, 4000); // Poll every 4 seconds

    return () => clearInterval(timer);
  }, []);

  // Handle Interactive Passenger Actions
  const handleBookTicket = () => {
    setNotification("🎫 Redirecting to secure UPI Payment Gateway (₹30 ticket booked successfully for Bus #DL-01-AI-4029)...");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSosEmergency = () => {
    setNotification("🚨 SOS Alert Dispatched to Central Command & Nearest Traffic Control Unit! Help is on the way.");
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>BharatBus-AI Portal</h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>National Transport Infrastructure, Analytics & Passenger QR Engine</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setViewMode('admin')}
            style={{
              padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: viewMode === 'admin' ? '#0284c7' : '#1f2937',
              color: '#fff', border: 'none', transition: '0.2s'
            }}
          >
            🛡️ Admin Command Center
          </button>
          <button 
            onClick={() => setViewMode('passenger')}
            style={{
              padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: viewMode === 'passenger' ? '#10b981' : '#1f2937',
              color: '#fff', border: 'none', transition: '0.2s'
            }}
          >
            📱 Passenger QR View
          </button>
        </div>
      </div>

      {/* Interactive Global Alert / Notification Banner */}
      {notification && (
        <div style={{ backgroundColor: '#1e3a8a', border: '1px solid #3b82f6', color: '#bfdbfe', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
          {notification}
        </div>
      )}

      {/* Conditional Rendering based on View Mode */}
      {viewMode === 'admin' ? (
        <div>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>TOTAL MONITORED CROWD</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>👥 {kpiStats.total_crowd}</div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>NETWORK AVG BHARAT SCORE</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>📊 {kpiStats.avg_score} / 100</div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>ACTIVE EMERGENCY TICKETS</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>🚨 {kpiStats.emergency_tickets}</div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>AI FLEET DISPATCHES</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>🚌 {kpiStats.fleet_dispatches}</div>
            </div>
          </div>

          {/* Recharts Analytics Section */}
          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#e5e7eb' }}>📈 Real-Time Crowd Density vs Bharat Score Analytics (Live Telemetry)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="crowd" fill="#3b82f6" name="Crowd Density" />
                  <Bar dataKey="bharatScore" fill="#10b981" name="Bharat Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Passenger QR Portal View (Fully Clickable) */
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #374151', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ backgroundColor: '#065f46', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>LIVE BUS #DL-01-AI-4029</span>
            <h2 style={{ fontSize: '22px', margin: '10px 0 5px 0' }}>Route: Kashmere Gate ➔ Anand Vihar</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Scanned via Smart Passenger QR Terminal</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Current Crowd Load</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b', marginTop: '5px' }}>Moderate (68%)</div>
            </div>
            <div style={{ backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Next Stop ETA</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', marginTop: '5px' }}>3 mins</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#38bdf8' }}>🎫 AI Quick Services (Interactive)</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleBookTicket}
                style={{ flex: 1, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0369a1'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#0284c7'}
              >
                Book Ticket (UPI)
              </button>
              <button 
                onClick={handleSosEmergency}
                style={{ flex: 1, backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                SOS Emergency
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
            Powered by BharatBus-AI Autonomous Public Transit Framework
          </div>
        </div>
      )}

    </div>
  );
}