import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';


// ============================================================
// LEAFLET MARKER FIX
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',

  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',

  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});


// ============================================================
// DEMO CHART DATA
// ============================================================

const chartData = [
  { time: '10:00 AM', crowd: 400 },
  { time: '11:00 AM', crowd: 850 },
  { time: '12:00 PM', crowd: 1200 },
  { time: '01:00 PM', crowd: 950 },
  { time: '02:00 PM', crowd: 1400 }
];


// ============================================================
// DEMO INFRASTRUCTURE DATA
// ============================================================

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
  airQuality: 118
};


// ============================================================
// STYLES
// ============================================================

const cardStyle = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};

const labelStyle = {
  margin: '0 0 7px',
  color: '#9ca3af',
  fontSize: '13px'
};

const valueStyle = {
  margin: 0,
  fontSize: '28px',
  fontWeight: '800'
};

const mutedStyle = {
  color: '#6b7280',
  fontSize: '11px'
};

const sectionStyle = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '18px'
};

const alertCard = (borderColor) => ({
  backgroundColor: '#1f2937',
  border: `1px solid ${borderColor}`,
  borderRadius: '9px',
  padding: '16px',
  minHeight: '145px'
});

const insightCard = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '9px',
  padding: '16px',
  minHeight: '125px'
};

const workflowCard = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '9px',
  padding: '14px 8px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};


// ============================================================
// APP
// ============================================================

export default function App() {

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const [activeTab, setActiveTab] = useState('passenger');


  // ----------------------------------------------------------
  // PASSENGER
  // ----------------------------------------------------------

  const [routesList, setRoutesList] = useState([]);

  const [selectedRoute, setSelectedRoute] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [passengerName, setPassengerName] = useState('');

  const [paymentStep, setPaymentStep] = useState('form');

  const [notification, setNotification] = useState(null);

  const [busPosition, setBusPosition] = useState([
    28.6139,
    77.2090
  ]);


  // ----------------------------------------------------------
  // ADMIN TELEMETRY
  // ----------------------------------------------------------

  const [telemetry, setTelemetry] = useState({
    total_crowd: 1280,
    avg_score: 65.4,
    booked_count: 5
  });


  // ==========================================================
  // FETCH ROUTES
  // ==========================================================

  const fetchRoutes = async () => {

    try {

      const response = await fetch(
        'http://localhost:8000/api/routes'
      );

      const data = await response.json();

      setRoutesList(data);

      if (data.length > 0) {
        setSelectedRoute(data[0]);
      }

    } catch (error) {

      console.log(
        'Backend unavailable. Using demo route.'
      );

      const fallbackRoute = {
        id: 1,
        source: 'Kashmere Gate',
        destination: 'Anand Vihar',
        fare: 30,
        bus_no: 'DL-01-AI-4029'
      };

      setRoutesList([fallbackRoute]);

      setSelectedRoute(fallbackRoute);
    }
  };


  // ==========================================================
  // FETCH TELEMETRY
  // ==========================================================

  const fetchTelemetry = async () => {

    try {

      const response = await fetch(
        'http://localhost:8000/api/telemetry'
      );

      const data = await response.json();

      setTelemetry(data);

    } catch (error) {

      console.log(
        'Using demo telemetry data.'
      );

    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    fetchRoutes();

    fetchTelemetry();


    // Demo live GPS movement
    const gpsInterval = setInterval(() => {

      setBusPosition((previous) => [
        previous[0] +
          (Math.random() - 0.5) * 0.002,

        previous[1] +
          (Math.random() - 0.5) * 0.002
      ]);

    }, 4000);


    return () => clearInterval(gpsInterval);

  }, []);


  // ==========================================================
  // PAYMENT
  // ==========================================================

  const handleVerifyUpiPayment = async () => {

    try {

      if (!selectedRoute) return;

      const response = await fetch(
        'http://localhost:8000/api/book-ticket',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            name: passengerName,

            route:
              `${selectedRoute.source} ➔ ${selectedRoute.destination}`,

            amount: selectedRoute.fare
          })
        }
      );

      const result = await response.json();

      setNotification(
        `✅ ${result.message}`
      );

      fetchTelemetry();

    } catch (error) {

      setNotification(
        '✅ Payment successful — Demo Simulation'
      );

    }

    setShowPaymentModal(false);

    setPaymentStep('form');

    setPassengerName('');

    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      style={{
        backgroundColor: '#0b0f19',
        color: '#f3f4f6',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Inter, Arial, sans-serif'
      }}
    >


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap',
          borderBottom: '1px solid #1f2937',
          paddingBottom: '15px',
          marginBottom: '20px'
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              color: '#38bdf8',
              fontSize: '21px'
            }}
          >
            🇮🇳 BharatBus AI
          </h1>

          <div
            style={{
              color: '#6b7280',
              fontSize: '10px',
              marginTop: '4px'
            }}
          >
            Smart Public Transport Infrastructure Intelligence
          </div>

        </div>


        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >

          <button
            onClick={() => setActiveTab('passenger')}

            style={{
              padding: '9px 15px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor:
                activeTab === 'passenger'
                  ? '#0284c7'
                  : '#1f2937'
            }}
          >
            🎫 Passenger QR & Live Map
          </button>


          <button
            onClick={() => setActiveTab('admin')}

            style={{
              padding: '9px 15px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor:
                activeTab === 'admin'
                  ? '#0284c7'
                  : '#1f2937'
            }}
          >
            🏢 Smart Infrastructure
          </button>

        </div>

      </header>


      {/* ======================================================
          NOTIFICATION
      ====================================================== */}

      {notification && (

        <div
          style={{
            backgroundColor: '#065f46',
            border: '1px solid #34d399',
            color: '#ecfdf5',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          {notification}
        </div>

      )}


      {/* ======================================================
          PASSENGER PORTAL
      ====================================================== */}

      {activeTab === 'passenger' && (

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px'
          }}
        >


          {/* BOOKING */}

          <div style={sectionStyle}>

            <div
              style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}
            >

              <span
                style={{
                  backgroundColor: '#065f46',
                  color: '#34d399',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                BUS #
                {selectedRoute?.bus_no ||
                  'DL-01-AI-4029'}
              </span>


              <h2
                style={{
                  fontSize: '18px',
                  margin: '10px 0 5px'
                }}
              >
                {selectedRoute
                  ? `${selectedRoute.source} ➔ ${selectedRoute.destination}`
                  : 'Select a Route'}
              </h2>


              <p
                style={{
                  color: '#9ca3af',
                  fontSize: '12px'
                }}
              >
                Select Route & UPI Payment Terminal
              </p>

            </div>


            {/* ROUTE SELECT */}

            <div
              style={{
                backgroundColor: '#1f2937',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            >

              <label
                style={{
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                📍 Select Bus Route
              </label>


              <select
                value={selectedRoute?.id || ''}
                onChange={(event) => {

                  const route =
                    routesList.find(
                      item =>
                        String(item.id) ===
                        event.target.value
                    );

                  setSelectedRoute(route);

                }}

                style={{
                  width: '100%',
                  marginTop: '7px',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#111827',
                  color: '#fff',
                  border: '1px solid #374151'
                }}
              >

                {routesList.map(route => (

                  <option
                    key={route.id}
                    value={route.id}
                  >
                    {route.source} to {route.destination}
                    {' '}
                    (₹{route.fare})
                  </option>

                ))}

              </select>

            </div>


            {/* PAYMENT */}

            {!showPaymentModal ? (

              <div
                style={{
                  backgroundColor: '#1f2937',
                  padding: '15px',
                  borderRadius: '8px'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '15px'
                  }}
                >

                  <span>
                    Fare:
                    {' '}
                    <b>
                      ₹{selectedRoute?.fare || 30}
                    </b>
                  </span>

                  <span
                    style={{
                      color: '#34d399'
                    }}
                  >
                    GPS: Online 🟢
                  </span>

                </div>


                <button
                  onClick={() => {
                    setShowPaymentModal(true);
                    setPaymentStep('form');
                  }}

                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Book Ticket (UPI QR)
                </button>

              </div>

            ) : paymentStep === 'form' ? (

              <form
                onSubmit={(event) => {

                  event.preventDefault();

                  if (
                    passengerName.trim()
                  ) {
                    setPaymentStep('qr');
                  }

                }}

                style={{
                  backgroundColor: '#1f2937',
                  padding: '20px',
                  borderRadius: '8px'
                }}
              >

                <h3
                  style={{
                    color: '#38bdf8',
                    fontSize: '15px'
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
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px',
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    color: '#fff',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}
                />


                <div
                  style={{
                    display: 'flex',
                    gap: '10px'
                  }}
                >

                  <button
                    type="submit"

                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Proceed ₹
                    {selectedRoute?.fare || 30}
                  </button>


                  <button
                    type="button"

                    onClick={() =>
                      setShowPaymentModal(false)
                    }

                    style={{
                      padding: '10px',
                      backgroundColor: '#4b5563',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            ) : (

              <div
                style={{
                  backgroundColor: '#1f2937',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >

                <h3
                  style={{
                    color: '#38bdf8',
                    fontSize: '15px'
                  }}
                >
                  Scan & Pay ₹
                  {selectedRoute?.fare || 30}
                </h3>


                <div
                  style={{
                    backgroundColor: '#fff',
                    display: 'inline-block',
                    padding: '15px',
                    borderRadius: '8px'
                  }}
                >

                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=bharatbus@icici%26pn=BharatBusAI%26am=${selectedRoute?.fare || 30}.00%26cu=INR`}
                    alt="UPI QR"
                  />

                </div>


                <button
                  onClick={handleVerifyUpiPayment}

                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Simulate Bank Payment
                </button>


                <button
                  onClick={() =>
                    setShowPaymentModal(false)
                  }

                  style={{
                    marginTop: '10px',
                    background: 'transparent',
                    color: '#9ca3af',
                    border: 'none',
                    cursor: 'pointer'
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
              ...sectionStyle,
              height: '420px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >

            <h3
              style={{
                color: '#38bdf8',
                fontSize: '15px',
                marginTop: 0
              }}
            >
              🗺️ Live Bus GPS Tracking
            </h3>


            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                borderRadius: '8px'
              }}
            >

              <MapContainer
                center={busPosition}
                zoom={13}
                style={{
                  width: '100%',
                  height: '100%'
                }}
              >

                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                <Marker
                  position={busPosition}
                >

                  <Popup>
                    Bus #
                    {selectedRoute?.bus_no ||
                      'DL-01-AI-4029'}
                    <br />
                    Status: Moving Live 🟢
                  </Popup>

                </Marker>

              </MapContainer>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          ADMIN — SMART INFRASTRUCTURE COMMAND CENTER
      ====================================================== */}

      {activeTab === 'admin' && (

        <div>


          {/* TITLE */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap',
              marginBottom: '18px'
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0,
                  color: '#38bdf8',
                  fontSize: '22px'
                }}
              >
                🇮🇳 BharatBus AI
              </h2>


              <p
                style={{
                  color: '#9ca3af',
                  fontSize: '13px',
                  margin: '6px 0 0'
                }}
              >
                Smart Public Transport Infrastructure Command Center
              </p>

            </div>


            <span
              style={{
                backgroundColor: '#172554',
                color: '#60a5fa',
                border: '1px solid #1d4ed8',
                padding: '7px 12px',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
            >
              DEMO DATA • AI/SAS PROTOTYPE
            </span>

          </div>


          {/* ==================================================
              KPI CARDS
          ================================================== */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '15px',
              marginBottom: '18px'
            }}
          >

            <div style={cardStyle}>

              <p style={labelStyle}>
                🚌 Active Bus Stands
              </p>

              <h3
                style={{
                  ...valueStyle,
                  color: '#38bdf8'
                }}
              >
                {infrastructure.busStands}
              </h3>

              <span style={mutedStyle}>
                Monitored network
              </span>

            </div>


            <div style={cardStyle}>

              <p style={labelStyle}>
                👥 Current Passengers
              </p>

              <h3
                style={{
                  ...valueStyle,
                  color: '#34d399'
                }}
              >
                {Number(
                  telemetry.total_crowd || 0
                ).toLocaleString()}
              </h3>

              <span style={mutedStyle}>
                Live crowd telemetry
              </span>

            </div>


            <div style={cardStyle}>

              <p style={labelStyle}>
                🚨 Active AI Alerts
              </p>

              <h3
                style={{
                  ...valueStyle,
                  color: '#f87171'
                }}
              >
                {infrastructure.alerts}
              </h3>

              <span style={mutedStyle}>
                2 high priority
              </span>

            </div>


            <div style={cardStyle}>

              <p style={labelStyle}>
                🧹 Cleanliness Score
              </p>

              <h3
                style={{
                  ...valueStyle,
                  color: '#fbbf24'
                }}
              >
                {infrastructure.cleanliness}%
              </h3>

              <span style={mutedStyle}>
                AI assessment
              </span>

            </div>


            <div style={cardStyle}>

              <p style={labelStyle}>
                🚻 Facility Health
              </p>

              <h3
                style={{
                  ...valueStyle,
                  color: '#a78bfa'
                }}
              >
                {infrastructure.facilities}%
              </h3>

              <span style={mutedStyle}>
                Water + Toilet + Waiting
              </span>

            </div>


            <div style={cardStyle}>

              <p style={labelStyle}>
                🏥 Infrastructure Health
              </p>

              <h3
                style={{
                  ...valueStyle,
                  color: '#22d3ee'
                }}
              >
                {infrastructure.healthScore}/100
              </h3>

              <span style={mutedStyle}>
                AI/SAS composite score
              </span>

            </div>

          </div>


          {/* ==================================================
              LIVE AI ALERTS
          ================================================== */}

          <section style={sectionStyle}>

            <h3
              style={{
                color: '#38bdf8',
                fontSize: '16px',
                marginTop: 0
              }}
            >
              🚨 Live AI Infrastructure Alerts
            </h3>


            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px'
              }}
            >

              <div style={alertCard('#7f1d1d')}>

                <strong
                  style={{
                    color: '#f87171',
                    fontSize: '11px'
                  }}
                >
                  🔴 HIGH PRIORITY
                </strong>


                <h4>
                  Platform 4 — Garbage Overflow
                </h4>


                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: 1.5
                  }}
                >
                  AI detected excessive waste
                  accumulation.
                </p>


                <span
                  style={{
                    backgroundColor: '#065f46',
                    padding: '5px 9px',
                    borderRadius: '5px',
                    fontSize: '10px'
                  }}
                >
                  Cleaning Team Assigned
                </span>

              </div>


              <div style={alertCard('#78350f')}>

                <strong
                  style={{
                    color: '#fbbf24',
                    fontSize: '11px'
                  }}
                >
                  🟠 MEDIUM PRIORITY
                </strong>


                <h4>
                  Platform 2 — High Crowd Density
                </h4>


                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: 1.5
                  }}
                >
                  Occupancy is approaching safe
                  capacity.
                </p>


                <span
                  style={{
                    backgroundColor: '#78350f',
                    padding: '5px 9px',
                    borderRadius: '5px',
                    fontSize: '10px'
                  }}
                >
                  AI Monitoring
                </span>

              </div>


              <div style={alertCard('#7f1d1d')}>

                <strong
                  style={{
                    color: '#f87171',
                    fontSize: '11px'
                  }}
                >
                  🔴 HIGH PRIORITY
                </strong>


                <h4>
                  Public Toilet — Cleaning Overdue
                </h4>


                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: 1.5
                  }}
                >
                  Cleaning service required
                  immediately.
                </p>


                <span
                  style={{
                    backgroundColor: '#92400e',
                    padding: '5px 9px',
                    borderRadius: '5px',
                    fontSize: '10px'
                  }}
                >
                  Maintenance Pending
                </span>

              </div>

            </div>

          </section>


          {/* ==================================================
              FACILITY MONITORING
          ================================================== */}

          <section style={sectionStyle}>

            <h3
              style={{
                color: '#38bdf8',
                fontSize: '16px',
                marginTop: 0
              }}
            >
              🏢 Smart Bus Stand Facility Monitoring
            </h3>


            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px'
              }}
            >

              <div style={insightCard}>

                <strong
                  style={{
                    color: '#f87171'
                  }}
                >
                  🌡️ Temperature
                </strong>

                <h2>
                  {infrastructure.temperature}°C
                </h2>

                <span
                  style={{
                    color: '#f87171',
                    fontSize: '11px'
                  }}
                >
                  🔴 High Heat Risk
                </span>

              </div>


              <div style={insightCard}>

                <strong
                  style={{
                    color: '#38bdf8'
                  }}
                >
                  💧 Humidity
                </strong>

                <h2>
                  {infrastructure.humidity}%
                </h2>

                <span
                  style={{
                    color: '#fbbf24',
                    fontSize: '11px'
                  }}
                >
                  🟡 Monitor Comfort
                </span>

              </div>


              <div style={insightCard}>

                <strong
                  style={{
                    color: '#38bdf8'
                  }}
                >
                  🚰 Water Level
                </strong>

                <h2>
                  {infrastructure.waterLevel}%
                </h2>

                <span
                  style={{
                    color: '#34d399',
                    fontSize: '11px'
                  }}
                >
                  🟢 Available
                </span>

              </div>


              <div style={insightCard}>

                <strong
                  style={{
                    color: '#a78bfa'
                  }}
                >
                  🚻 Toilet Health
                </strong>

                <h2>
                  {infrastructure.toiletHealth}%
                </h2>

                <span
                  style={{
                    color: '#f87171',
                    fontSize: '11px'
                  }}
                >
                  🔴 Cleaning Required
                </span>

              </div>


              <div style={insightCard}>

                <strong
                  style={{
                    color: '#fbbf24'
                  }}
                >
                  🗑️ Smart Dustbin
                </strong>

                <h2>
                  {infrastructure.dustbinLevel}%
                </h2>

                <span
                  style={{
                    color: '#f87171',
                    fontSize: '11px'
                  }}
                >
                  🔴 Near Capacity
                </span>

              </div>


              <div style={insightCard}>

                <strong
                  style={{
                    color: '#22d3ee'
                  }}
                >
                  🌫️ Air Quality
                </strong>

                <h2>
                  AQI {infrastructure.airQuality}
                </h2>

                <span
                  style={{
                    color: '#fbbf24',
                    fontSize: '11px'
                  }}
                >
                  🟡 Moderate Risk
                </span>

              </div>

            </div>

          </section>


          {/* ==================================================
              AI INSIGHTS
          ================================================== */}

          <section style={sectionStyle}>

            <h3
              style={{
                color: '#38bdf8',
                fontSize: '16px',
                marginTop: 0
              }}
            >
              🧠 AI Infrastructure Insights
            </h3>


            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px'
              }}
            >

              <div style={insightCard}>

                <strong
                  style={{
                    color: '#38bdf8'
                  }}
                >
                  👥 Crowd Prediction
                </strong>

                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: 1.6
                  }}
                >
                  Platform 3 is expected to exceed
                  safe capacity during the evening
                  peak.
                </p>

                <b
                  style={{
                    color: '#fbbf24',
                    fontSize: '11px'
                  }}
                >
                  Prediction Risk: MEDIUM
                </b>

              </div>


              <div style={insightCard}>

                <strong
                  style={{
                    color: '#f87171'
                  }}
                >
                  🌡️ Heat Risk Prediction
                </strong>

                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: 1.6
                  }}
                >
                  Waiting-area comfort risk is
                  increasing. Additional cooling
                  capacity is recommended.
                </p>

                <b
                  style={{
                    color: '#f87171',
                    fontSize: '11px'
                  }}
                >
                  Risk Level: HIGH
                </b>

              </div>


              <div style={insightCard}>

                <strong
                  style={{
                    color: '#a78bfa'
                  }}
                >
                  🔧 Predictive Maintenance
                </strong>

                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: 1.6
                  }}
                >
                  Cooling equipment requires
                  inspection based on recent
                  operating patterns.
                </p>

                <b
                  style={{
                    color: '#fbbf24',
                    fontSize: '11px'
                  }}
                >
                  Preventive Action Recommended
                </b>

              </div>

            </div>

          </section>


          {/* ==================================================
              AI WORKFLOW
          ================================================== */}

          <section style={sectionStyle}>

            <h3
              style={{
                color: '#38bdf8',
                fontSize: '16px',
                marginTop: 0
              }}
            >
              🔄 BharatBus AI Response Workflow
            </h3>


            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px'
              }}
            >

              <div style={workflowCard}>
                <div style={{ fontSize: '25px' }}>
                  📹
                </div>
                <strong>Detect</strong>
                <small style={{ color: '#9ca3af' }}>
                  Camera / IoT
                </small>
              </div>


              <div style={workflowCard}>
                <div style={{ fontSize: '25px' }}>
                  🤖
                </div>
                <strong>Analyze</strong>
                <small style={{ color: '#9ca3af' }}>
                  AI Engine
                </small>
              </div>


              <div style={workflowCard}>
                <div style={{ fontSize: '25px' }}>
                  📊
                </div>
                <strong>Predict</strong>
                <small style={{ color: '#9ca3af' }}>
                  SAS Analytics
                </small>
              </div>


              <div style={workflowCard}>
                <div style={{ fontSize: '25px' }}>
                  🚨
                </div>
                <strong>Act</strong>
                <small style={{ color: '#9ca3af' }}>
                  Authority Alert
                </small>
              </div>


              <div style={workflowCard}>
                <div style={{ fontSize: '25px' }}>
                  ✅
                </div>
                <strong>Verify</strong>
                <small style={{ color: '#9ca3af' }}>
                  AI Verification
                </small>
              </div>

            </div>

          </section>


          {/* ==================================================
              CROWD ANALYTICS
          ================================================== */}

          <section style={sectionStyle}>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >

              <h3
                style={{
                  color: '#38bdf8',
                  fontSize: '16px',
                  margin: 0
                }}
              >
                📊 Hourly Passenger Crowd Trends
              </h3>


              <span
                style={{
                  color: '#6b7280',
                  fontSize: '10px'
                }}
              >
                AI/SAS Analytics Ready
              </span>

            </div>


            <div
              style={{
                width: '100%',
                height: '300px',
                marginTop: '15px'
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={chartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />


                  <XAxis
                    dataKey="time"
                    stroke="#9ca3af"
                  />


                  <YAxis
                    stroke="#9ca3af"
                  />


                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      color: '#fff'
                    }}
                  />


                  <Line
                    type="monotone"
                    dataKey="crowd"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </section>


          {/* ==================================================
              FOOTER
          ================================================== */}

          <div
            style={{
              textAlign: 'center',
              padding: '15px',
              color: '#6b7280',
              fontSize: '10px'
            }}
          >
            BharatBus AI • AI + IoT + SAS Powered
            Public Transport Infrastructure Intelligence
            <br />
            <span>
              DEMO PROTOTYPE — Infrastructure metrics are simulated
              until live sensors/backend are connected.
            </span>
          </div>

        </div>

      )}

    </div>
  );
}