import React, { useState, useEffect } from 'react';

function App() {
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch("https://bharatbus-ai.onrender.com/api/v1/telemetry/history?limit=10");
      const data = await response.json();
      if (data.success && data.history) {
        setTelemetryData(data.history);
      }
    } catch (error) {
      console.error("Error fetching telemetry:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Component Mount होने पर पहली बार डेटा लाएगा
    fetchTelemetry();

    // हर 5 सेकंड में ऑटोमैटिकली Backend से नया डेटा खींचकर UI अपडेट करेगा
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#0b0f19', minHeight: '100vh' }}>
      <h2>Live Terminal Logs Stream</h2>
      <p style={{ color: '#888' }}>Auto-refreshing every 5s</p>

      {loading ? (
        <p>Loading telemetry data...</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'left', borderColor: '#222' }}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Station ID</th>
              <th>Crowd Count</th>
              <th>Bharat Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {telemetryData.map((item, index) => (
              <tr key={index}>
                <td>{item.timestamp}</td>
                <td>{item.station_id}</td>
                <td>{item.crowd_count}</td>
                <td>{item.score}</td>
                <td style={{ color: item.status === 'RED' ? 'red' : 'green' }}>
                  {item.status === 'RED' ? 'Critical Alert' : 'GREEN'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;