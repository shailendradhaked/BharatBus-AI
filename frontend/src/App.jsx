import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Dummy Chart Data for Admin Dashboard
const chartData = [
  { time: '10:00 AM', crowd: 400, score: 70 },
  { time: '11:00 AM', crowd: 850, score: 60 },
  { time: '12:00 PM', crowd: 1200, score: 55 },
  { time: '01:00 PM', crowd: 950, score: 65 },
  { time: '02:00 PM', crowd: 1400, score: 50 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('passenger'); // 'passenger' or 'admin'
  const [routesList, setRoutesList] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Passenger Booking States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [paymentStep, setPaymentStep] = useState('form');
  const [notification, setNotification] = useState(null);
  const [busPosition, setBusPosition] = useState([28.6139, 77.2090]);

  // Admin Analytics State
  const [telemetry, setTelemetry] = useState({ total_crowd: 1280, avg_score: 65.4, booked_count: 5 });

  const fetchRoutes = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/routes');
      const data = await res.json();
      setRoutesList(data);
      if (data.length > 0 && !selectedRoute) setSelectedRoute(data[0]);
    } catch (e) {
      const fallback = [{ id: 1, source: 'Kashmere Gate', destination: 'Anand Vihar', fare: 30, bus_no: 'DL-01-AI-4029' }];
      setRoutesList(fallback);
      setSelectedRoute(fallback[0]);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/telemetry');
      const data = await res.json();
      setTelemetry(data);
    } catch (e) {
      console.log("Using offline telemetry");
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchTelemetry();
    
    const gpsInterval = setInterval(() => {
      setBusPosition(prev => [
        prev[0] + (Math.random() - 0.5) * 0.002,
        prev[1] + (Math.random() - 0.5) * 0.002
      ]);
    }, 4000);

    return () => clearInterval(gpsInterval);
  }, []);

  const handleVerifyUpiPayment = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/book-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: passengerName, 
          route: `${selectedRoute.source} ➔ ${selectedRoute.destination}`, 
          amount: selectedRoute.fare 
        })
      });
      const result = await response.json();
      setNotification(`✅ ${result.message}`);
      setShowPaymentModal(false);
      setPaymentStep('form');
      setPassengerName('');
      fetchTelemetry();
    } catch (err) {
      alert("Payment successful (Offline Simulation).");
      setShowPaymentModal(false);
    }
    setTimeout(() => setNotification(null), 6000);
  };

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header with Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '20px', color: '#38bdf8', margin: 0 }}>BharatBus-AI Portal</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('passenger')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none', backgroundColor: activeTab === 'passenger' ? '#0284c7' : '#1f2937', color: '#fff' }}
          >
            🎫 Passenger QR & Live Map
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none', backgroundColor: activeTab === 'admin' ? '#0284c7' : '#1f2937', color: '#fff' }}
          >
            📊 Admin Analytics & Charts
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ backgroundColor: '#065f46', border: '1px solid #34d399', color: '#ecfdf5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
          {notification}
        </div>
      )}

      {/* TAB 1: PASSENGER PORTAL & LIVE MAP */}
      {activeTab === 'passenger' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ backgroundColor: '#065f46', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                BUS #{selectedRoute ? selectedRoute.bus_no : 'DL-01-AI-4029'}
              </span>
              <h2 style={{ fontSize: '18px', margin: '10px 0 5px 0' }}>
                {selectedRoute ? `${selectedRoute.source} ➔ ${selectedRoute.destination}` : 'Select a Route'}
              </h2>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Select Route & UPI Payment Terminal</p>
            </div>

            <div style={{ backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#38bdf8', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📍 Select Bus Route:</label>
              <select 
                onChange={(e) => {
                  const found = routesList.find(r => r.id.toString() === e.target.value);
                  setSelectedRoute(found);
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '14px' }}
              >
                {routesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.source} to {r.destination} (₹{r.fare})
                  </option>
                ))}
              </select>
            </div>

            {!showPaymentModal ? (
              <div style={{ backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
                  <span>Fare: <b>₹{selectedRoute ? selectedRoute.fare : 30}</b></span>
                  <span style={{ color: '#34d399' }}>GPS: Online 🟢</span>
                </div>
                <button 
                  onClick={() => { setShowPaymentModal(true); setPaymentStep('form'); }}
                  style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Book Ticket (UPI QR)
                </button>
              </div>
            ) : paymentStep === 'form' ? (
              <form onSubmit={(e) => { e.preventDefault(); if(passengerName) setPaymentStep('qr'); else alert('Enter name'); }} style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>Passenger Details</h4>
                <input 
                  type="text" 
                  value={passengerName} 
                  onChange={(e) => setPassengerName(e.target.value)} 
                  placeholder="Full Name"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', marginBottom: '15px' }}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Proceed (₹{selectedRoute.fare})</button>
                  <button type="button" onClick={() => setShowPaymentModal(false)} style={{ backgroundColor: '#4b5563', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Scan & Pay ₹{selectedRoute.fare}</h4>
                <div style={{ background: '#fff', padding: '15px', display: 'inline-block', borderRadius: '8px', marginBottom: '15px' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=bharatbus@icici&pn=BharatBusAI&am=${selectedRoute.fare}.00&cu=INR`} 
                    alt="UPI QR" 
                  />
                </div>
                <button 
                  onClick={handleVerifyUpiPayment} 
                  style={{ width: '100%', backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
                >
                  Simulate Bank Payment
                </button>
                <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>Back</button>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '12px', border: '1px solid #374151', height: '420px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '14px', color: '#38bdf8', marginBottom: '10px', marginTop: 0 }}>🗺️ Live Bus GPS Tracking</h3>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
              <MapContainer center={busPosition} zoom={13} style={{ width: '100%', height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={busPosition}>
                  <Popup>Bus #{selectedRoute?.bus_no} <br /> Status: Moving Live 🟢</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ADMIN ANALYTICS & CHARTS DASHBOARD */}
      {activeTab === 'admin' && (
        <div>
          <h2 style={{ fontSize: '18px', color: '#38bdf8', marginBottom: '15px' }}>📈 Fleet & Crowd Analytics Dashboard</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
              <p style={{ margin: '0 0 5px 0', color: '#9ca3af', fontSize: '13px' }}>Total Fleet Crowd</p>
              <h3 style={{ margin: 0, color: '#34d399', fontSize: '24px' }}>{telemetry.total_crowd}</h3>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
              <p style={{ margin: '0 0 5px 0', color: '#9ca3af', fontSize: '13px' }}>Average Efficiency Score</p>
              <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>{telemetry.avg_score}%</h3>
            </div>
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
              <p style={{ margin: '0 0 5px 0', color: '#9ca3af', fontSize: '13px' }}>Total Tickets Booked</p>
              <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '24px' }}>{telemetry.booked_count}</h3>
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #374151' }}>
            <h3 style={{ fontSize: '15px', color: '#38bdf8', marginBottom: '15px', marginTop: 0 }}>Hourly Passenger Crowd Trends</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="crowd" stroke="#38bdf8" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}