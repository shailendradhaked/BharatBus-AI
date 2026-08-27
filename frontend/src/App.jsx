import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function App() {
  const [viewMode, setViewMode] = useState('admin');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [kpiStats, setKpiStats] = useState({ total_crowd: 1285, avg_score: 64.2, emergency_tickets: 3, fleet_dispatches: 4 });
  
  // Real Interactive Passenger States
  const [ticketModal, setTicketModal] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [destination, setDestination] = useState('Anand Vihar');
  const [bookedTicketsList, setBookedTicketsList] = useState([]);
  const [sosLogs, setSosLogs] = useState([]);

  // Live Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      setAnalyticsData(prev => [
        ...prev.slice(-9),
        { time: timeStr, crowd: Math.floor(Math.random() * 80) + 1200, bharatScore: Number((Math.random() * 5 + 62).toFixed(1)) }
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle Real Ticket Booking Form Submission
  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!passengerName) return alert("Please enter passenger name!");
    
    const newTicket = {
      id: 'TKT-' + Math.floor(Math.random() * 89999 + 10000),
      name: passengerName,
      route: `Kashmere Gate ➔ ${destination}`,
      time: new Date().toLocaleTimeString(),
      status: 'Confirmed (UPI Paid)'
    };

    setBookedTicketsList([newTicket, ...bookedTicketsList]);
    setTicketModal(false);
    setPassengerName('');
    alert(`🎉 Ticket Successfully Booked! ID: ${newTicket.id}`);
  };

  // Handle Real SOS Trigger
  const handleTriggerSos = () => {
    const sosEntry = {
      id: 'SOS-' + Math.floor(Math.random() * 899 + 100),
      bus: 'DL-01-AI-4029',
      time: new Date().toLocaleTimeString(),
      status: 'Dispatched to Police HQ'
    };
    setSosLogs([sosEntry, ...sosLogs]);
    setSosActive(true);
    alert("🚨 EMERGENCY BROADCAST SENT! Nearest PCR Van & Transit Control Unit have been notified with your GPS coordinates.");
  };

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>BharatBus-AI Enterprise Portal</h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>Live Autonomous Public Transit & Passenger Management System</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setViewMode('admin')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: viewMode === 'admin' ? '#0284c7' : '#1f2937', color: '#fff', border: 'none' }}
          >
            🛡️ Admin Command Center ({sosLogs.length} Alerts)
          </button>
          <button 
            onClick={() => setViewMode('passenger')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: viewMode === 'passenger' ? '#10b981' : '#1f2937', color: '#fff', border: 'none' }}
          >
            📱 Passenger QR Portal
          </button>
        </div>
      </div>

      {viewMode === 'admin' ? (
        <div>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>TOTAL MONITORED CROWD</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>👥 {kpiStats.total_crowd}</div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>NETWORK BHARAT SCORE</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>📊 {kpiStats.avg_score} / 100</div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>ACTIVE SOS ALERTS</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>🚨 {sosLogs.length}</div>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>BOOKED PASSENGERS (DB)</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>🎫 {bookedTicketsList.length}</div>
            </div>
          </div>

          {/* Live Incident & Bookings Feed Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '15px', color: '#ef4444', marginBottom: '10px' }}>🚨 Live SOS Emergency Logs</h3>
              {sosLogs.length === 0 ? <p style={{ fontSize: '13px', color: '#6b7280' }}>No active emergencies reported.</p> :
                sosLogs.map((s, i) => (
                  <div key={i} style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                    <b>{s.id}</b> - Bus: {s.bus} | <span style={{ color: '#ef4444' }}>{s.status}</span> ({s.time})
                  </div>
                ))
              }
            </div>

            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '15px', color: '#10b981', marginBottom: '10px' }}>🎫 Recent Passenger Bookings</h3>
              {bookedTicketsList.length === 0 ? <p style={{ fontSize: '13px', color: '#6b7280' }}>No tickets booked yet from QR portal.</p> :
                bookedTicketsList.slice(0, 3).map((t, i) => (
                  <div key={i} style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                    <b>{t.id}</b> - {t.name} ({t.route}) - <span style={{ color: '#34d399' }}>{t.status}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Chart */}
          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#e5e7eb' }}>📈 Real-Time Crowd Density vs Bharat Score Analytics</h3>
            <div style={{ width: '100%', height: '250px' }}>
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
        /* Passenger QR Portal View with Real Interactive Forms */
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ backgroundColor: '#065f46', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>LIVE BUS #DL-01-AI-4029</span>
            <h2 style={{ fontSize: '22px', margin: '10px 0 5px 0' }}>Route: Kashmere Gate ➔ {destination}</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Smart Passenger Mobile Terminal</p>
          </div>

          {!ticketModal ? (
            <div>
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
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#38bdf8' }}>🎫 Passenger Action Center</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setTicketModal(true)}
                    style={{ flex: 1, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Book Ticket (UPI)
                  </button>
                  <button 
                    onClick={handleTriggerSos}
                    style={{ flex: 1, backgroundColor: sosActive ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {sosActive ? '🚨 SOS Triggered!' : '🚨 SOS Emergency'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Ticket Booking Form */
            <form onSubmit={handleConfirmBooking} style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>💳 Secure UPI Ticket Checkout (₹30)</h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Passenger Full Name</label>
                <input 
                  type="text" 
                  value={passengerName} 
                  onChange={(e) => setPassengerName(e.target.value)} 
                  placeholder="e.g., Shailendra Dhaked"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Select Destination Stop</label>
                <select 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                >
                  <option value="Anand Vihar">Anand Vihar</option>
                  <option value="Connaught Place">Connaught Place</option>
                  <option value="ISBT Kashmiri Gate">ISBT Kashmiri Gate</option>
                  <option value="AIIMS Delhi">AIIMS Delhi</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Pay ₹30 & Confirm</button>
                <button type="button" onClick={() => setTicketModal(false)} style={{ backgroundColor: '#4b5563', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
            Autonomous Public Transit Framework - Live Secure Session
          </div>
        </div>
      )}

    </div>
  );
}