import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User as UserIcon, AlertTriangle, Droplet, Activity, 
  MapPin, PlusCircle, Hospital, FileText, Bell, Thermometer, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Modal states
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    symptoms: '', severity: 'HIGH', duration: '', remarks: ''
  });

  // Queries
  const { data: village } = useQuery({
    queryKey: ['village'],
    queryFn: async () => {
      const res = await api.get('/citizen/village');
      return res.data;
    },
    refetchInterval: 15000 // Poll every 15s for live risk updates
  });

  const { data: waterQuality = [] } = useQuery({
    queryKey: ['waterQuality'],
    queryFn: async () => {
      const res = await api.get('/citizen/water-quality');
      return res.data;
    }
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['myReports'],
    queryFn: async () => {
      const res = await api.get('/citizen/reports');
      return res.data;
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/notifications');
        return res.data || [];
      } catch (e) { return []; }
    }
  });

  // Initial AI greeting
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([
        {
          id: 'init',
          senderType: 'BOT',
          timestamp: new Date(),
          message: `Hello ${user?.name || 'Citizen'}. I am the AquaShield AI Health Advisor. I am currently monitoring the health and water quality of ${village?.name || 'your area'}. How can I assist you today?`
        }
      ]);
    }
  }, [user, village?.name, chatHistory.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const aiChatMutation = useMutation({
    mutationFn: async (message) => {
      const res = await api.post('/citizen/ai-chat', { message });
      return res.data;
    },
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { id: Date.now(), senderType: 'BOT', timestamp: new Date(), message: data.message }]);
      setIsTyping(false);
    },
    onError: () => {
      setChatHistory(prev => [...prev, { id: Date.now(), senderType: 'BOT', timestamp: new Date(), message: 'I am currently unable to reach the knowledge core. Please try again later.' }]);
      setIsTyping(false);
    }
  });

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const message = inputValue.trim();
    setChatHistory(prev => [...prev, { id: Date.now(), senderType: 'USER', timestamp: new Date(), message }]);
    setInputValue('');
    setIsTyping(true);
    aiChatMutation.mutate(message);
  };

  const submitEmergencyMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/citizen/symptoms', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      setShowEmergencyModal(false);
      setEmergencyForm({ symptoms: '', severity: 'HIGH', duration: '', remarks: '' });
      setChatHistory(prev => [...prev, { 
        id: Date.now(), 
        senderType: 'BOT', 
        timestamp: new Date(),
        message: 'Your emergency health report has been submitted successfully to the local Health Worker. Please isolate and drink boiled water. Help is on the way.' 
      }]);
    }
  });

  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Mock trend data for the chart 
  const trendData = [
    { name: 'Mon', risk: Math.max(0, (village?.riskScore || 50) - 10) },
    { name: 'Tue', risk: Math.max(0, (village?.riskScore || 50) - 5) },
    { name: 'Wed', risk: Math.max(0, (village?.riskScore || 50) + 5) },
    { name: 'Thu', risk: village?.riskScore || 50 },
    { name: 'Fri', risk: village?.riskScore || 50 },
  ];

  // Derived Values
  const wq = waterQuality.length > 0 ? waterQuality[waterQuality.length - 1] : {};
  const riskScore = village?.riskScore || 0;
  
  const getRiskColor = (score) => {
    if (score > 70) return 'text-brand-danger';
    if (score > 40) return 'text-brand-warning';
    return 'text-brand-success';
  };
  const getRiskBg = (score) => {
    if (score > 70) return 'bg-brand-danger/20 border-brand-danger/50';
    if (score > 40) return 'bg-brand-warning/20 border-brand-warning/50';
    return 'bg-brand-success/20 border-brand-success/50';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full relative z-10 overflow-hidden pb-6">
      
      {/* LEFT MAIN PANEL - AI Chat Area */}
      <div className="w-full lg:w-3/5 flex flex-col glass-panel overflow-hidden border border-brand-border/60 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Chat Header */}
        <div className="px-6 py-5 border-b border-brand-border/60 bg-brand-surface/80 flex items-center justify-between backdrop-blur-md z-10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent/20 to-transparent border border-brand-accent/30 flex items-center justify-center">
                <Bot className="w-6 h-6 text-brand-accent animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-success border-2 border-brand-background rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-success border-2 border-brand-background rounded-full" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">AquaShield Intelligence</h2>
              <p className="text-[10px] text-brand-accent uppercase tracking-[0.2em] font-bold mt-1">Live Medical & Environmental AI</p>
            </div>
          </div>
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="hidden md:flex items-center px-4 py-2 bg-brand-danger/20 hover:bg-brand-danger/30 text-brand-danger text-xs font-bold uppercase tracking-wider rounded-lg border border-brand-danger/40 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            SOS Report
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10">
          <AnimatePresence>
            {chatHistory.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-end space-x-3 ${msg.senderType === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${msg.senderType === 'BOT' ? 'bg-gradient-to-br from-brand-surface to-brand-background border border-brand-border' : 'bg-brand-accent'}`}>
                  {msg.senderType === 'BOT' ? <Bot className="w-4 h-4 text-brand-accent" /> : <UserIcon className="w-4 h-4 text-white" />}
                </div>
                <div className={`max-w-[75%] flex flex-col ${msg.senderType === 'USER' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3.5 text-sm leading-relaxed shadow-lg ${
                    msg.senderType === 'USER' 
                      ? 'bg-gradient-to-r from-brand-accent to-blue-600 text-white rounded-2xl rounded-br-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)]' 
                      : 'bg-brand-surface/80 border border-brand-border/60 text-brand-secondaryText rounded-2xl rounded-bl-sm backdrop-blur-md'
                  }`}>
                    {msg.message}
                  </div>
                  {msg.timestamp && (
                    <span className="text-[10px] text-brand-secondaryText mt-1.5 px-1 font-medium">{formatTime(msg.timestamp)}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-surface to-brand-background border border-brand-border flex items-center justify-center">
                <Bot className="w-4 h-4 text-brand-accent" />
              </div>
              <div className="flex space-x-1.5 px-5 py-4 bg-brand-surface/80 border border-brand-border/60 rounded-2xl rounded-bl-sm backdrop-blur-md">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-5 bg-brand-background/90 border-t border-brand-border/60 backdrop-blur-xl z-10">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
            {["Is my water safe to drink?", "Why is my village at high risk?", "What should I do if I have diarrhea?", "Show me nearby hospitals"].map((prompt, i) => (
              <button 
                key={i}
                onClick={() => setInputValue(prompt)} 
                className="whitespace-nowrap px-4 py-2 rounded-full border border-brand-border/80 bg-brand-surface/40 text-xs font-medium text-brand-secondaryText hover:text-white hover:border-brand-accent/60 hover:bg-brand-accent/10 transition-all duration-300"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
              placeholder="Ask AquaShield AI about health, water, or risks..."
              className="w-full bg-brand-surface border border-brand-border/80 rounded-xl px-5 py-4 pr-16 text-sm text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 transition-all placeholder-brand-secondaryText shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 aspect-square p-2.5 flex items-center justify-center bg-brand-accent text-white rounded-lg disabled:opacity-50 hover:bg-blue-500 transition-colors shadow-glow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Live Data & Widgets */}
      <div className="w-full lg:w-2/5 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-10">
        
        {/* Risk Gauge & Village Stats */}
        <div className="glass-panel p-5 border border-brand-border/60 relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-1 h-full ${getRiskBg(riskScore).split(' ')[0]}`} />
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-accent" />
                {village?.name || 'Loading Area...'}
              </h3>
              <p className="text-xs text-brand-secondaryText uppercase tracking-wider mt-1">Live Risk Assessment</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(riskScore)} ${getRiskBg(riskScore)}`}>
              {riskScore > 70 ? 'CRITICAL' : riskScore > 40 ? 'ELEVATED' : 'SAFE'}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className={`text-4xl font-black ${getRiskColor(riskScore)}`}>{riskScore.toFixed(0)}</span>
              <span className="text-sm text-brand-secondaryText">/100</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-widest">Active Cases</p>
              <p className="text-xl font-black text-white">{village?.activeCases || 0}</p>
            </div>
          </div>

          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={riskScore > 70 ? '#EF4444' : '#3B82F6'} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={riskScore > 70 ? '#EF4444' : '#3B82F6'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#070B14', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="risk" stroke={riskScore > 70 ? '#EF4444' : '#3B82F6'} fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Advisories */}
        <div className="glass-panel p-5 border border-brand-border/60">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4 uppercase tracking-wider">
            <AlertTriangle className={`w-4 h-4 ${riskScore > 40 ? 'text-brand-warning' : 'text-brand-success'}`} />
            Today's Health Advisory
          </h3>
          <div className={`p-4 rounded-xl border ${riskScore > 70 ? 'bg-brand-danger/10 border-brand-danger/20' : riskScore > 40 ? 'bg-brand-warning/10 border-brand-warning/20' : 'bg-brand-success/10 border-brand-success/20'}`}>
            <p className="text-sm text-white leading-relaxed">
              {riskScore > 70 
                ? "CRITICAL: High risk of waterborne diseases detected in your area. Boil all water for at least 1 minute before consumption. Seek immediate medical attention if you experience severe diarrhea or vomiting."
                : riskScore > 40 
                ? "WARNING: Elevated risk detected. Ensure water is filtered or purified. Practice strict hand hygiene before meals."
                : "SAFE: Village health status is currently normal. Continue standard hygiene practices and stay hydrated."}
            </p>
          </div>
        </div>

        {/* Water Quality Telemetry */}
        <div className="glass-panel p-5 border border-brand-border/60">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Droplet className="w-4 h-4 text-cyan-400" />
            Latest Water Telemetry
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/50">
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">pH Level</p>
              <p className="text-lg font-bold text-white mt-1">{wq.phLevel || '--'}</p>
            </div>
            <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/50">
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Turbidity</p>
              <p className="text-lg font-bold text-white mt-1">{wq.turbidity || '--'} <span className="text-[10px] text-brand-secondaryText">NTU</span></p>
            </div>
            <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/50">
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Chlorine</p>
              <p className="text-lg font-bold text-white mt-1">{wq.chlorineLevel || '--'} <span className="text-[10px] text-brand-secondaryText">mg/L</span></p>
            </div>
            <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/50 flex flex-col justify-center">
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Status</p>
              <p className={`text-sm font-black mt-1 tracking-wide ${wq.isContaminated ? 'text-brand-danger' : 'text-brand-success'}`}>
                {wq.isContaminated ? 'CONTAMINATED' : 'CLEAN'}
              </p>
            </div>
          </div>
        </div>

        {/* Nearby Health Centers */}
        <div className="glass-panel p-5 border border-brand-border/60">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Hospital className="w-4 h-4 text-brand-accent" />
            Nearby Medical Centers
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-brand-surface/50 rounded-xl border border-brand-border/40 flex items-center justify-between hover:bg-brand-surface transition-colors cursor-pointer">
              <div>
                <p className="text-sm font-bold text-white">{village?.name || 'Local'} Primary Health Center</p>
                <p className="text-xs text-brand-secondaryText mt-0.5">0.5 km away • Open 24/7</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="p-3 bg-brand-surface/50 rounded-xl border border-brand-border/40 flex items-center justify-between hover:bg-brand-surface transition-colors cursor-pointer">
              <div>
                <p className="text-sm font-bold text-white">District General Hospital</p>
                <p className="text-xs text-brand-secondaryText mt-0.5">12 km away • Emergency Services</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Reports */}
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-panel p-5 border border-brand-border/60">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4 uppercase tracking-wider">
              <Bell className="w-4 h-4 text-yellow-400" />
              Recent Alerts
            </h3>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 2).map((n, idx) => (
                  <div key={idx} className="p-3 bg-brand-surface/50 rounded-xl border border-brand-border/40">
                    <p className="text-sm font-semibold text-white">{n.message}</p>
                    <p className="text-[10px] text-brand-secondaryText mt-1 uppercase tracking-wider">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-secondaryText">No new notifications.</p>
            )}
          </div>

          <div className="glass-panel p-5 border border-brand-border/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-purple-400" />
                My Submissions
              </h3>
            </div>
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.slice(0, 2).map((r, idx) => (
                  <div key={idx} className="p-3 bg-brand-surface/50 rounded-xl border border-brand-border/40">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-white">{r.symptoms}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                        r.severity === 'HIGH' ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/30' : 
                        r.severity === 'MEDIUM' ? 'bg-brand-warning/20 text-brand-warning border-brand-warning/30' : 
                        'bg-brand-success/20 text-brand-success border-brand-success/30'
                      }`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-xs text-brand-secondaryText">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-secondaryText">No recent reports submitted.</p>
            )}
          </div>
        </div>

      </div>

      {/* Emergency Report Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowEmergencyModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-6 sm:p-8 border border-brand-danger/40 shadow-[0_0_40px_rgba(239,68,68,0.2)] rounded-2xl"
            >
              <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-2">
                <ShieldAlert className="w-8 h-8 text-brand-danger animate-pulse" />
                Emergency SOS
              </h2>
              <p className="text-sm text-brand-secondaryText mb-6">
                Submit critical symptoms immediately. Local health workers and AI command will be notified instantly.
              </p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Primary Symptoms</label>
                  <input 
                    type="text" 
                    value={emergencyForm.symptoms}
                    onChange={e => setEmergencyForm({...emergencyForm, symptoms: e.target.value})}
                    className="w-full bg-brand-surface/80 border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-brand-danger focus:outline-none focus:ring-1 focus:ring-brand-danger/50 transition-all"
                    placeholder="e.g. Severe diarrhea, vomiting, high fever"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Severity</label>
                    <select 
                      value={emergencyForm.severity}
                      onChange={e => setEmergencyForm({...emergencyForm, severity: e.target.value})}
                      className="w-full bg-brand-surface/80 border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-brand-danger focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="HIGH">High (Emergency)</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Duration</label>
                    <input 
                      type="text" 
                      value={emergencyForm.duration}
                      onChange={e => setEmergencyForm({...emergencyForm, duration: e.target.value})}
                      className="w-full bg-brand-surface/80 border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-brand-danger focus:outline-none focus:ring-1 focus:ring-brand-danger/50 transition-all"
                      placeholder="e.g. 2 days"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Additional Remarks</label>
                  <textarea 
                    value={emergencyForm.remarks}
                    onChange={e => setEmergencyForm({...emergencyForm, remarks: e.target.value})}
                    className="w-full bg-brand-surface/80 border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-brand-danger focus:outline-none focus:ring-1 focus:ring-brand-danger/50 h-28 resize-none transition-all custom-scrollbar"
                    placeholder="Provide details about affected family members, water source, or location specifics..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 py-3.5 bg-brand-surface/50 hover:bg-brand-surface border border-brand-border text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => submitEmergencyMutation.mutate(emergencyForm)}
                  disabled={!emergencyForm.symptoms || submitEmergencyMutation.isPending}
                  className="flex-[2] py-3.5 bg-brand-danger hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 transition-all flex justify-center items-center"
                >
                  {submitEmergencyMutation.isPending ? 'Transmitting...' : 'Send SOS Alert'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CitizenDashboard;
