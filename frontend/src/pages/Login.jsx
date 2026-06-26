import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Server, Activity, Database, Droplet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'HEALTH_WORKER') {
        navigate('/worker/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    }
  }, [user, navigate]);

  // AI telemetry log stream for aesthetic command center look
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const messages = [
      "AQUASHIELD PROTOCOL v4.9.1 INITIALIZING...",
      "ESTABLISHING SECURE POSTGRESQL LINK...",
      "ML WEKA RANDOMFOREST AGENT STATUS: ONLINE",
      "OUTBREAK PREDICTION MATRIX: 89.2% CONFIDENCE",
      "EPIDEMIOLOGY TELEMETRY STABILIZED.",
      "SCANNING 128 MONITORING STATIONS...",
      "WATER PATHOGEN CLUSTER ANOMALY DETECTED: 0",
      "ALL SYSTEMS NOMINAL. STANDBY FOR HANDSHAKE..."
    ];
    let counter = 0;
    const interval = setInterval(() => {
      setLogs(prev => [...prev, messages[counter % messages.length]].slice(-5));
      counter++;
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        login(data);
        if (data.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (data.role === 'HEALTH_WORKER') {
          navigate('/worker/dashboard');
        } else {
          navigate('/citizen/dashboard');
        }
      } else {
        let errorMsg = 'Authentication failed';
        try {
          const data = await res.json();
          errorMsg = data.message || errorMsg;
        } catch {}
        setError(errorMsg);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to establish link with backend command server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background grid grid-cols-1 lg:grid-cols-12 font-sans relative overflow-hidden">
      
      {/* Background neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-brand-success/5 rounded-full blur-[140px] pointer-events-none" />

      {/* LEFT COLUMN: Animated Command Screen Visuals */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 border-r border-brand-border/60 relative overflow-hidden bg-[#070B14]">
        
        {/* Subtle matrix dots overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <Shield className="w-8 h-8 text-brand-accent drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <div>
            <span className="text-xs font-black text-brand-secondaryText tracking-widest uppercase">National Surveillance Network</span>
            <h2 className="text-xl font-black text-white tracking-wide">AQUASHIELD AI</h2>
          </div>
        </div>

        {/* Cyber India Map Visualization */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center">
          <div className="relative w-80 h-96 flex items-center justify-center">
            {/* Pulsing Grid background representing the AI network */}
            <div className="absolute inset-0 border border-brand-border/30 rounded-2xl bg-brand-surface/20 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#1E293B" strokeWidth="0.5" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#1E293B" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Stylized cybernetic India Map SVG */}
            <svg 
              className="w-64 h-80 text-brand-accent/20 drop-shadow-[0_0_15px_rgba(59,130,246,0.1)] relative z-10" 
              viewBox="0 0 200 240" 
              fill="none" 
              stroke="#3B82F6" 
              strokeWidth="1.5"
            >
              {/* Outer boundary representation */}
              <path d="M100,20 L110,25 L120,20 L125,35 L140,40 L135,55 L145,65 L135,70 L145,85 L140,105 L150,115 L145,120 L155,130 L150,140 L160,150 L145,155 L135,145 L125,150 L115,140 L110,155 L105,175 L100,195 L95,215 L100,225 L95,230 L90,215 L85,195 L75,175 L80,155 L75,145 L65,150 L55,145 L50,135 L40,130 L35,115 L45,105 L35,95 L40,80 L35,70 L45,65 L40,50 L55,45 L50,35 L65,30 L70,20 L85,25 Z" strokeDasharray="3,3" />
              
              {/* Risk Node points pulsing (Green, Yellow, Red) */}
              <circle cx="100" cy="50" r="4" fill="#EF4444" className="animate-ping" />
              <circle cx="100" cy="50" r="3" fill="#EF4444" />
              
              <circle cx="120" cy="90" r="4" fill="#F59E0B" className="animate-ping" style={{ animationDelay: '0.5s' }} />
              <circle cx="120" cy="90" r="3" fill="#F59E0B" />

              <circle cx="90" cy="130" r="4" fill="#22C55E" className="animate-ping" style={{ animationDelay: '1s' }} />
              <circle cx="90" cy="130" r="3" fill="#22C55E" />

              <circle cx="95" cy="180" r="4" fill="#EF4444" className="animate-ping" style={{ animationDelay: '1.5s' }} />
              <circle cx="95" cy="180" r="3" fill="#EF4444" />

              <circle cx="110" cy="120" r="4" fill="#22C55E" className="animate-ping" style={{ animationDelay: '0.2s' }} />
              <circle cx="110" cy="120" r="3" fill="#22C55E" />
            </svg>
          </div>

          {/* Water quality visualization waves */}
          <div className="mt-8 flex items-center space-x-6 bg-brand-surface/40 p-4 border border-brand-border/60 rounded-xl relative overflow-hidden w-full max-w-sm">
            <div className="w-10 h-10 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
              <Droplet className="w-5 h-5 text-brand-accent animate-bounce" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider">Sanitary Telemetry Waveform</span>
              <div className="h-6 flex items-end space-x-1">
                {[4, 8, 12, 6, 14, 18, 10, 16, 8, 12, 6, 8].map((h, i) => (
                  <motion.div 
                    key={i} 
                    className="w-1.5 bg-brand-accent rounded-t"
                    initial={{ height: 2 }}
                    animate={{ height: h }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.6, delay: i * 0.05 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active AI Telemetry Logger */}
        <div className="relative z-10">
          <div className="p-4 bg-brand-surface/60 border border-brand-border/60 rounded-xl font-mono text-[10px] space-y-1.5 w-full text-brand-secondaryText">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center">
                <span className="text-brand-accent mr-2">&gt;&gt;</span>
                <span className={i === logs.length - 1 ? 'text-white' : ''}>{log}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Glassmorphic Login Form Card */}
      <div className="col-span-1 lg:col-span-5 flex flex-col justify-center p-8 sm:p-12 md:p-16 bg-brand-background relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-md w-full mx-auto space-y-8 glass-panel p-10 border border-brand-border shadow-luxury"
        >
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Secure Command</h2>
            <p className="mt-2 text-xs text-brand-secondaryText uppercase tracking-widest font-bold">
              Access credentials required
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 bg-brand-danger/10 text-brand-danger border border-brand-danger/25 rounded-xl text-xs font-semibold text-center leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Government ID / Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@aquashield.gov"
                  className="luxury-input text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Access Passphrase</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="luxury-input pr-12 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-secondaryText hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 bg-brand-background border-brand-border rounded text-brand-accent focus:ring-brand-accent" 
                />
                <label htmlFor="remember-me" className="ml-2 block text-brand-secondaryText font-medium">
                  Remember terminal session
                </label>
              </div>
              <a href="#" className="font-semibold text-brand-accent hover:text-blue-400 transition-colors">
                Passphrase Reset
              </a>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full luxury-button flex justify-center items-center py-3.5 disabled:opacity-50 text-xs font-black uppercase tracking-widest shadow-glow"
            >
              {loading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {loading ? 'Decrypting Access...' : 'Authenticate'}
            </button>
          </form>

          <div className="text-center text-xs text-brand-secondaryText border-t border-brand-border/50 pt-6 mt-6">
            Require credentials clearance? <Link to="/register" className="font-bold text-brand-accent hover:text-blue-400 transition-colors">Request Terminal Access</Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

// Simple loader helper inside component
const Loader = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default Login;
