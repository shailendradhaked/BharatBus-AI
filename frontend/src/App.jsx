import React, { useState, useEffect } from 'react';

export default function App() {
  const [viewMode, setViewMode] = useState('passenger');
  const [routesList, setRoutesList] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Passenger Form
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [paymentStep, setPaymentStep] = useState('form');
  const [notification, setNotification] = useState(null);
  const [bookedCount, setBookedCount] = useState(0);

  // Fetch Routes from Backend Database
  const fetchRoutes = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/routes');
      const data = await res.json();
      setRoutesList(data);
      if (data.length > 0 && !selectedRoute) setSelectedRoute(data[0]);
    } catch (e) {
      console.log("Using offline fallback routes.");
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Confirm UPI Payment
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
      setBookedCount(prev => prev + 1);
    } catch (err) {
      alert("Payment error.");
    }
    setTimeout(() => setNotification(null), 6000);
  };

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '22px', color: '#38bdf8', margin: 0 }}>BharatBus-AI Dynamic Route & Payment Portal</h1>
      </div>

      {notification && (
        <div style={{ backgroundColor: '#065f46', border: '1px solid #34d399', color: '#ecfdf5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
          {notification}
        </div>
      )}

      {/* Passenger QR Portal with Route Change Option */}
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ backgroundColor: '#065f46', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
            BUS #{selectedRoute ? selectedRoute.bus_no : 'DL-01-AI-4029'}
          </span>
          <h2 style={{ fontSize: '20px', margin: '10px 0 5px 0' }}>
            {selectedRoute ? `${selectedRoute.source} ➔ ${selectedRoute.destination}` : 'Select a Route'}
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>Dynamic Route Selector & UPI Payment Gateway</p>
        </div>

        {/* Route Changer Dropdown */}
        <div style={{ backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#38bdf8', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📍 Change Bus Route / Destination:</label>
          <select 
            onChange={(e) => {
              const found = routesList.find(r => r.id.toString() === e.target.value);
              setSelectedRoute(found);
            }}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '14px' }}
          >
            {routesList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.source} to {r.destination} (Fare: ₹{r.fare}) - Bus {r.bus_no}
              </option>
            ))}
          </select>
        </div>

        {!showPaymentModal ? (
          <div style={{ backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
              <span>Ticket Fare: <b>₹{selectedRoute ? selectedRoute.fare : 30}</b></span>
              <span style={{ color: '#34d399' }}>Status: Available</span>
            </div>
            <button 
              onClick={() => { setShowPaymentModal(true); setPaymentStep('form'); }}
              style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Book Ticket for this Route (UPI QR)
            </button>
          </div>
        ) : paymentStep === 'form' ? (
          <form onSubmit={(e) => { e.preventDefault(); if(passengerName) setPaymentStep('qr'); else alert('Enter name'); }} style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>Enter Passenger Details</h4>
            <input 
              type="text" 
              value={passengerName} 
              onChange={(e) => setPassengerName(e.target.value)} 
              placeholder="Passenger Full Name"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', marginBottom: '15px' }}
              required
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Proceed to QR (₹{selectedRoute.fare})</button>
              <button type="button" onClick={() => setShowPaymentModal(false)} style={{ backgroundColor: '#4b5563', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Scan & Pay ₹{selectedRoute.fare} via UPI</h4>
            <div style={{ background: '#fff', padding: '15px', display: 'inline-block', borderRadius: '8px', marginBottom: '15px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=bharatbus@icici&pn=BharatBusAI&am=${selectedRoute.fare}.00&cu=INR`} 
                alt="UPI QR" 
              />
            </div>
            <button 
              onClick={handleVerifyUpiPayment} 
              style={{ width: '100%', backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
            >
              Simulate Successful Bank Debit (₹{selectedRoute.fare})
            </button>
            <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>Back</button>
          </div>
        )}

      </div>
    </div>
  );
}