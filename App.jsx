import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Droplet, 
  Users, 
  Sparkles, 
  Thermometer, 
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
      setTelemetryData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // 5 sec auto refresh
    return () => clearInterval(interval);
  }, []);

  const getScoreBadge = (score) => {
    if (score >= 75) return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 text-xs font-semibold">Optimal ({score})</span>;
    if (score >= 50) return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30 text-xs font-semibold font-medium">Moderate ({score})</span>;
    return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 text-xs font-semibold animate-pulse">Critical ({score})</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              BharatBus-AI Command Center
            </h1>
            <p className="text-sm text-slate-400">Multi-Station Infrastructure Intelligence Platform</p>
          </div>
        </div>

        <button 
          onClick={fetchTelemetry}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto mt-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Unable to connect to live backend. ({error})</p>
          </div>
        )}

        {/* Real-time Telemetry Stream */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Live Terminal Logs Stream
            </h2>
            <span className="text-xs text-slate-500">Auto-refreshing every 5s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Station ID</th>
                  <th className="p-4">Water Level</th>
                  <th className="p-4">Cleanliness</th>
                  <th className="p-4">Crowd</th>
                  <th className="p-4">Temp</th>
                  <th className="p-4">Bharat Score</th>
                  <th className="p-4">Status / Escalation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {telemetryData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      {loading ? 'Fetching terminal logs...' : 'No telemetry records found.'}
                    </td>
                  </tr>
                ) : (
                  telemetryData.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 text-slate-400 text-xs font-mono">{log.timestamp}</td>
                      <td className="p-4 font-semibold text-slate-200">{log.station_id}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <Droplet className="w-4 h-4" /> {log.water_level}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Sparkles className="w-4 h-4" /> {log.cleanliness}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-purple-400">
                          <Users className="w-4 h-4" /> {log.crowd_count}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Thermometer className="w-4 h-4" /> {log.temperature}°C
                        </span>
                      </td>
                      <td className="p-4">{getScoreBadge(log.bharat_score)}</td>
                      <td className="p-4">
                        {log.escalation_needed ? (
                          <span className="flex items-center gap-1.5 text-red-400 font-medium">
                            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                            {log.escalation_reason || 'Escalation Triggered'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}