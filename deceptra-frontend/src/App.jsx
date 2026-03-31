import { useState, useRef, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";
import { Canvas, useFrame } from "@react-three/fiber";

// ================= 3D =================
function Dodecahedron() {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.002;
      ref.current.rotation.y += 0.003;
    }
  });
  return (
    <mesh ref={ref}>
      <dodecahedronGeometry args={[1.2, 0]} />
      <meshStandardMaterial color="#38bdf8" emissive="#0a2f44" emissiveIntensity={0.8} wireframe />
    </mesh>
  );
}

function FloatingParticles() {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0005;
      ref.current.rotation.x += 0.0003;
    }
  });
  const particles = [...Array(200)].map((_, i) => ({
    pos: [(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6 - 3],
    color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`
  }));
  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ================= APP =================
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, scam: 0, safe: 0 });
  const [alertSensitivity, setAlertSensitivity] = useState("medium");
  const [riskThreshold, setRiskThreshold] = useState(85);
  const [alerts, setAlerts] = useState([
    { id: 1, text: "Suspicious link detected in 'Your account is locked'", risk: 92, time: "2 min ago" },
    { id: 2, text: "High urgency message from 'Amazon Support'", risk: 88, time: "15 min ago" },
  ]);

  // For step‑by‑step analysis
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // For history detail modal
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // For reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Step definitions
  const analysisSteps = [
    { label: "Scanning message content...", completed: false },
    { label: "Extracting URLs (if any)...", completed: false },
    { label: "Analyzing scam indicators...", completed: false },
    { label: "Computing risk score...", completed: false },
    { label: "Generating report...", completed: false }
  ];

  const analyzeMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    // Reset steps
    setSteps(analysisSteps.map(s => ({ ...s, completed: false })));
    setCurrentStep(0);
    setResult(null);

    // Slow step interval (1.2 seconds per step)
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < analysisSteps.length - 1) {
          setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[prev] = { ...newSteps[prev], completed: true };
            return newSteps;
          });
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 1200);  // slower: 1200ms

    try {
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();

      // Mark all steps as completed
      setSteps(analysisSteps.map(s => ({ ...s, completed: true })));
      clearInterval(stepInterval);
      setCurrentStep(analysisSteps.length);

      // Small delay to show final step
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 300);

      setStats(prev => ({
        total: prev.total + 1,
        scam: prev.scam + (data.classification === "Scam" ? 1 : 0),
        safe: prev.safe + (data.classification === "Safe" ? 1 : 0)
      }));

      // Check if this should trigger a new alert
      if (data.risk_score >= riskThreshold && alertSensitivity === "high") {
        setAlerts(prev => [{
          id: Date.now(),
          text: message.slice(0, 60) + "...",
          risk: data.risk_score,
          time: "just now"
        }, ...prev.slice(0, 4)]);
      }

      fetchHistory();
    } catch (err) {
      console.error("Analysis failed", err);
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const pieData = [
    { name: "Scam", value: stats.scam, color: "#ef4444" },
    { name: "Safe", value: stats.safe, color: "#22c55e" }
  ];

  const barData = result ? [
    { name: "Urgency", value: result.indicators?.urgency === "high" ? 90 : 30 },
    { name: "Authority", value: result.indicators?.authority === "high" ? 80 : 20 },
    { name: "Greed", value: result.indicators?.greed === "high" ? 85 : 25 },
    { name: "Links", value: result.indicators?.links === "high" ? 75 : 15 }
  ] : [];

  const trendData = history.slice(0, 8).map((item, i) => ({
    name: `#${history.length - i}`,
    risk: item.result.risk_score
  })).reverse();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md p-2 rounded-lg border border-cyan-400/30 text-sm">
          <p className="text-cyan-300">{`${label} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const getIndicatorBarData = (res) => {
    if (!res) return [];
    return [
      { name: "Urgency", value: res.indicators?.urgency === "high" ? 90 : 30 },
      { name: "Authority", value: res.indicators?.authority === "high" ? 80 : 20 },
      { name: "Greed", value: res.indicators?.greed === "high" ? 85 : 25 },
      { name: "Links", value: res.indicators?.links === "high" ? 75 : 15 }
    ];
  };

  const clearAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const handleResetData = () => {
    setHistory([]);
    setStats({ total: 0, scam: 0, safe: 0 });
    setAlerts([]);
    setResult(null);
    setShowResetConfirm(false);
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 -z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Dodecahedron />
          <FloatingParticles />
        </Canvas>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 -z-5" />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-black/30 backdrop-blur-2xl border-r border-white/10 p-6 z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="text-3xl animate-pulse">🛡️</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
            ScamShield AI
          </h1>
        </div>
        {["dashboard", "scanner", "history", "analytics", "alerts", "settings"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`w-full text-left mb-4 px-4 py-2 rounded-xl transition-all duration-300 ${
              tab === t
                ? "bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20"
                : "text-gray-400 hover:text-cyan-300 hover:bg-white/5"
            }`}
          >
            <span className="capitalize">{t}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8 space-y-8 relative z-0">
        {/* Dashboard Tab (unchanged) */}
        {tab === "dashboard" && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Security Dashboard
              </h2>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${stats.scam > stats.safe ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                {stats.scam > stats.safe ? "🚨 HIGH THREAT" : "✅ LOW THREAT"}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-cyan-400/50 transition-all">
                <p className="text-gray-400 text-sm">Total Scans</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-red-400/50 transition-all">
                <p className="text-gray-400 text-sm">Scams Detected</p>
                <p className="text-3xl font-bold text-red-400">{stats.scam}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-green-400/50 transition-all">
                <p className="text-gray-400 text-sm">Safe Messages</p>
                <p className="text-3xl font-bold text-green-400">{stats.safe}</p>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold mb-2">Detection Ratio</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold mb-2">Latest Risk Indicators</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#38bdf8" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <h3 className="text-lg font-semibold mb-2">Risk Score Trend (Last 8 scans)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="risk" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Scanner Tab with Step‑by‑Step (slower) */}
        {tab === "scanner" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              AI Scam Scanner
            </h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste suspicious message, email, or SMS here..."
              rows={5}
              className="w-full p-4 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
            />
            <button
              onClick={analyzeMessage}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-cyan-500/20"
            >
              {loading ? "Analyzing..." : "Analyze Message"}
            </button>

            {/* Step‑by‑Step Progress */}
            {loading && steps.length > 0 && (
              <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-white/10 space-y-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      step.completed ? "bg-green-500" : idx === currentStep ? "bg-cyan-500 animate-pulse" : "bg-gray-600"
                    }`}>
                      {step.completed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`${step.completed ? "text-green-400" : idx === currentStep ? "text-cyan-400" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Result Card */}
            {result && (
              <div className="mt-6 p-6 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <p className="text-lg">Classification</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.classification === "Scam" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                    {result.classification}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{ width: `${result.risk_score}%` }} />
                </div>
                <p className="text-right text-sm">Risk Score: {result.risk_score}%</p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {Object.entries(result.indicators).map(([k, v]) => (
                    <div key={k} className="bg-white/5 p-2 rounded text-center">
                      <span className="capitalize text-gray-300">{k}</span>
                      <span className={`block font-semibold ${v === "high" ? "text-red-400" : "text-green-400"}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Indicator Scores</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={getIndicatorBarData(result)} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" width={70} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#38bdf8" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab with clickable entries */}
        {tab === "history" && (
          <>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Scan History
            </h2>
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center text-gray-400 py-12">No scans yet. Try the scanner!</div>
              ) : (
                history.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedHistory(item);
                      setShowModal(true);
                    }}
                    className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:border-cyan-400/30 transition cursor-pointer"
                  >
                    <p className="font-mono text-sm break-all">{item.message}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className={`${item.result.classification === "Scam" ? "text-red-400" : "text-green-400"}`}>
                        {item.result.classification}
                      </span>
                      <span className="text-cyan-300">Risk: {item.result.risk_score}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Analytics Tab (unchanged) */}
        {tab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-xl text-center">
                <p className="text-gray-400">Total Scans</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl text-center">
                <p className="text-gray-400">Scam %</p>
                <p className="text-2xl font-bold text-red-400">{stats.total ? ((stats.scam / stats.total) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl text-center">
                <p className="text-gray-400">Safe %</p>
                <p className="text-2xl font-bold text-green-400">{stats.total ? ((stats.safe / stats.total) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <h3 className="text-lg font-semibold mb-2">Indicator Frequency</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { name: "Urgency", value: history.filter(h => h.result.indicators?.urgency === "high").length },
                  { name: "Authority", value: history.filter(h => h.result.indicators?.authority === "high").length },
                  { name: "Greed", value: history.filter(h => h.result.indicators?.greed === "high").length },
                  { name: "Links", value: history.filter(h => h.result.indicators?.links === "high").length }
                ]}>
                  <CartesianGrid stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <h3 className="text-lg font-semibold mb-2">Risk Score Timeline</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history.slice(0, 10).map((h, i) => ({ name: `${i + 1}`, risk: h.result.risk_score }))}>
                  <CartesianGrid stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="risk" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Alerts Tab with enhanced controls */}
        {tab === "alerts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Security Alerts
              </h2>
              {alerts.length > 0 && (
                <button
                  onClick={clearAllAlerts}
                  className="text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-lg transition"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <p>Alert Sensitivity</p>
                <select
                  value={alertSensitivity}
                  onChange={(e) => setAlertSensitivity(e.target.value)}
                  className="bg-black/40 p-2 rounded border border-white/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <p>Risk Threshold for Alerts</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{riskThreshold}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={riskThreshold}
                    onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Only messages with risk score ≥ {riskThreshold}% will trigger alerts when sensitivity is set to "High".
              </p>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center text-gray-400 py-12">No alerts yet. Try high‑risk messages!</div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="bg-red-500/10 backdrop-blur-sm p-4 rounded-xl border border-red-500/30 relative group">
                    <button
                      onClick={() => clearAlert(alert.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                    <p className="font-medium pr-6">{alert.text}</p>
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                      <span>Risk: {alert.risk}%</span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Tab with enhanced options */}
        {tab === "settings" && (
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Settings
            </h2>
            <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
              <p>Enable High Risk Alerts</p>
              <input
                type="checkbox"
                checked={alertSensitivity === "high"}
                onChange={(e) => setAlertSensitivity(e.target.checked ? "high" : "medium")}
                className="w-5 h-5"
              />
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <p className="mb-2">Default Detection Sensitivity</p>
              <select
                className="bg-black/40 p-2 rounded w-full"
                value={alertSensitivity}
                onChange={(e) => setAlertSensitivity(e.target.value)}
              >
                <option value="low">Low (only very obvious scams)</option>
                <option value="medium">Medium (balanced)</option>
                <option value="high">High (alerts for moderate risks)</option>
              </select>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <p className="mb-2">Alert Risk Threshold</p>
              <div className="flex items-center gap-4">
                <span className="text-sm">0%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm">{riskThreshold}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Messages with risk score above this value will trigger alerts (if alerts are enabled).
              </p>
            </div>
            <div className="bg-red-500/10 p-4 rounded-xl text-center">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-red-400 hover:text-red-300 transition"
              >
                Reset All Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Detail Modal */}
      {showModal && selectedHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Analysis Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Original Message</p>
                <p className="font-mono text-sm break-all bg-white/5 p-3 rounded-lg">{selectedHistory.message}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-lg">Classification</p>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedHistory.result.classification === "Scam" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                  {selectedHistory.result.classification}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{ width: `${selectedHistory.result.risk_score}%` }} />
              </div>
              <p className="text-right text-sm">Risk Score: {selectedHistory.result.risk_score}%</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(selectedHistory.result.indicators).map(([k, v]) => (
                  <div key={k} className="bg-white/5 p-2 rounded text-center">
                    <span className="capitalize text-gray-300">{k}</span>
                    <span className={`block font-semibold ${v === "high" ? "text-red-400" : "text-green-400"}`}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Indicator Scores</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={getIndicatorBarData(selectedHistory.result)} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#38bdf8" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Reset</h3>
            <p className="text-gray-300 mb-6">
              This will permanently delete all scan history, statistics, and alerts. This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}