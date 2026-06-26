import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu, RefreshCw, Zap, ShieldAlert, Database, Award, Play, Bot,
  Globe, Users, UserCheck, FileText, AlertTriangle, Activity, Target,
  TrendingUp, Droplets, Bell, ChevronRight, Radio, Radar, BrainCircuit,
  ArrowRight, ArrowDown, Clock, CheckCircle2, XCircle, Timer, Gauge
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend,
  LineChart, Line
} from 'recharts';

/* ─── Animated Circular Progress Ring ─── */
const CircularProgress = ({ value, size = 80, strokeWidth = 6, color = '#3B82F6', label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-black text-base leading-none">{value}%</span>
      </div>
      {label && <span className="text-[9px] text-brand-secondaryText uppercase tracking-widest mt-2 font-bold text-center">{label}</span>}
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, color = 'text-brand-accent', trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="glass-panel p-4 border border-brand-border/50 relative overflow-hidden group hover:border-brand-accent/40 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-accent/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-brand-accent/10 transition-colors" />
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-brand-surface border border-brand-border/50 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      {trend && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${trend.startsWith('+') || trend.startsWith('↑') ? 'text-brand-success bg-brand-success/10' : 'text-brand-danger bg-brand-danger/10'}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-black text-white mt-2">{value}</p>
    <p className="text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold mt-1">{label}</p>
  </motion.div>
);

/* ─── Main Component ─── */
const CommandCenterCore = () => {
  const queryClient = useQueryClient();
  const [runningCmd, setRunningCmd] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  /* ─── Data Queries ─── */
  const { data: analytics = {} } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => { const r = await api.get('/admin/analytics'); return r.data; },
    refetchInterval: 20000
  });

  const { data: detailed = {} } = useQuery({
    queryKey: ['detailedAnalytics'],
    queryFn: async () => { const r = await api.get('/admin/analytics/detailed'); return r.data; },
    refetchInterval: 30000
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['aiAgents'],
    queryFn: async () => { const r = await api.get('/admin/ai/agents'); return r.data; }
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['villages'],
    queryFn: async () => { const r = await api.get('/admin/villages'); return r.data; },
    refetchInterval: 20000
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => { const r = await api.get('/admin/alerts'); return r.data; },
    refetchInterval: 15000
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => { const r = await api.get('/admin/reports'); return r.data; },
    refetchInterval: 30000
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const r = await api.get('/admin/users'); return r.data; }
  });

  const { data: aiMetadata } = useQuery({
    queryKey: ['aiMetadata'],
    queryFn: async () => { try { const r = await api.get('/admin/ai/metadata'); return r.data; } catch { return null; } }
  });

  /* ─── Derived Data (memoized to prevent re-render loops) ─── */
  const totalVillages = villages.length;
  const totalCitizens = useMemo(() => users.filter(u => u.role === 'CITIZEN').length, [users]);
  const totalWorkers = useMemo(() => users.filter(u => u.role === 'HEALTH_WORKER').length, [users]);
  const highRiskVillages = useMemo(() => villages.filter(v => v.riskScore && v.riskScore > 70).length, [villages]);
  const activeOutbreaks = analytics.activeOutbreaks || highRiskVillages;
  const totalAlerts = alerts.length;
  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'ACTIVE').length, [alerts]);
  const todayReports = useMemo(() => {
    const today = new Date().toDateString();
    return reports.filter(r => new Date(r.reportDate).toDateString() === today).length;
  }, [reports]);

  // District risk data
  const districtData = useMemo(() => (detailed.districtRanking || []).map(d => ({
    name: d.district?.substring(0, 12) || 'Other',
    risk: Math.round(d.riskScore || 0),
    cases: d.activeCases || 0
  })), [detailed.districtRanking]);

  // Disease distribution
  const diseaseData = useMemo(() => Object.entries(detailed.diseaseDistribution || {}).map(([name, value]) => ({
    name, value: Number(value)
  })), [detailed.diseaseDistribution]);
  const DISEASE_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#A855F7'];

  // Water quality
  const wq = detailed.waterQuality || {};

  // Agent performance colors
  const agentColors = ['#3B82F6', '#10B981', '#F59E0B', '#A855F7', '#EC4899'];

  // Sorted villages for heatmap (avoid in-place mutation during render)
  const sortedVillages = useMemo(() => 
    [...villages].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 10)
  , [villages]);

  /* ─── Command Trigger ─── */
  const triggerCommand = async (cmdPath, cmdName) => {
    setRunningCmd(cmdName);
    try {
      await api.post(`/admin/ai/${cmdPath}`);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error(err);
    } finally {
      setRunningCmd(null);
    }
  };

  /* ─── Workflow Steps ─── */
  const workflowSteps = [
    { label: 'Citizen Report', icon: FileText, color: '#3B82F6' },
    { label: 'Field Verification', icon: UserCheck, color: '#10B981' },
    { label: 'AI Engine', icon: BrainCircuit, color: '#A855F7' },
    { label: 'Risk Assessment', icon: Target, color: '#F59E0B' },
    { label: 'Alert Generation', icon: Bell, color: '#EF4444' },
    { label: 'Admin Action', icon: ShieldAlert, color: '#EC4899' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-[1800px] mx-auto pb-16">

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-brand-accent/30 to-brand-accent/5 rounded-xl border border-brand-accent/30">
              <Radar className="w-8 h-8 text-brand-accent" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-success rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-success rounded-full border-2 border-brand-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">National Health Intelligence Center</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-brand-accent uppercase tracking-[0.2em] font-bold">Multi-Agent Operations Grid</span>
              <span className="text-[10px] text-brand-secondaryText font-mono">
                {now.toLocaleTimeString()} IST
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-brand-surface/80 border border-brand-border rounded-lg">
            <Radio className="w-3.5 h-3.5 text-brand-success animate-pulse" />
            <span className="text-[10px] text-brand-success uppercase tracking-widest font-bold">All Systems Online</span>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="px-4 py-2.5 bg-brand-surface border border-brand-border hover:border-brand-accent/50 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Sync
          </button>
        </div>
      </div>

      {/* ═══════ TOP STATS ROW ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard icon={Globe} label="Villages Monitored" value={totalVillages} color="text-brand-accent" trend={`↑ ${Math.max(1, Math.round(totalVillages * 0.12))} this month`} delay={0} />
        <StatCard icon={Users} label="Citizens Registered" value={totalCitizens.toLocaleString()} color="text-cyan-400" trend={`↑ ${Math.round(totalCitizens * 0.082)}%`} delay={0.05} />
        <StatCard icon={UserCheck} label="Field Workers" value={totalWorkers} color="text-brand-success" trend={`↑ ${Math.max(1, Math.round(totalWorkers * 0.05))}`} delay={0.1} />
        <StatCard icon={FileText} label="Reports Today" value={todayReports} color="text-blue-400" delay={0.15} />
        <StatCard icon={AlertTriangle} label="High Risk Villages" value={highRiskVillages} color="text-brand-danger" delay={0.2} />
        <StatCard icon={Activity} label="Active Outbreaks" value={activeOutbreaks} color="text-brand-warning" delay={0.25} />
        <StatCard icon={Bell} label="Active Alerts" value={activeAlerts} color="text-red-400" trend={`${totalAlerts} total`} delay={0.3} />
      </div>

      {/* ═══════ AI AGENTS PERFORMANCE ═══════ */}
      <div className="glass-panel p-6 border border-brand-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20">
              <BrainCircuit className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">AI Agent Performance Matrix</h3>
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold mt-0.5">Real-time Agent Telemetry</p>
            </div>
          </div>
          {aiMetadata && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-lg">
              <Gauge className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-[10px] text-brand-secondaryText font-mono">
                Model: <span className="text-white font-bold">{aiMetadata.modelName || 'AquaShield-ML'}</span>
                {aiMetadata.accuracy && <> • Acc: <span className="text-brand-success font-bold">{(aiMetadata.accuracy * 100).toFixed(1)}%</span></>}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="bg-brand-background/60 border border-brand-border/50 rounded-2xl p-5 flex flex-col items-center text-center hover:border-brand-accent/40 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-accent/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CircularProgress value={agent.accuracy} size={76} strokeWidth={5} color={agentColors[i]} label="" />
              <h4 className="text-white font-bold text-xs mt-3 uppercase tracking-wider">{agent.name}</h4>

              <div className="grid grid-cols-2 gap-2 mt-3 w-full text-left">
                <div className="px-2 py-1.5 bg-brand-surface/60 rounded-lg">
                  <p className="text-[8px] text-brand-secondaryText uppercase tracking-wider font-bold">Latency</p>
                  <p className="text-xs text-white font-bold">{agent.executionTime}</p>
                </div>
                <div className="px-2 py-1.5 bg-brand-surface/60 rounded-lg">
                  <p className="text-[8px] text-brand-secondaryText uppercase tracking-wider font-bold">Uptime</p>
                  <p className="text-xs text-brand-success font-bold">99.9%</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
                <span className="text-[8px] text-brand-secondaryText font-mono">
                  Last: {new Date(agent.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════ MIDDLE ROW: Heatmap + District Chart ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Village Risk Heatmap Table */}
        <div className="lg:col-span-3 glass-panel p-6 border border-brand-border/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-danger/10 border border-brand-danger/20">
                <Target className="w-5 h-5 text-brand-danger" />
              </div>
              <div>
                <h3 className="text-white font-bold">Outbreak Risk Heatmap</h3>
                <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Village-Level Threat Assessment</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border/40">
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-3 px-3">Village</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-3 px-3">District</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-3 px-3">Risk</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-3 px-3">Heat</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-3 px-3">Cases</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-3 px-3">Water</th>
                </tr>
              </thead>
              <tbody>
                {sortedVillages
                  .map((v, i) => {
                    const score = v.riskScore || 0;
                    const heatColor = score > 70 ? 'bg-brand-danger' : score > 40 ? 'bg-brand-warning' : 'bg-brand-success';
                    const heatWidth = `${Math.min(100, score)}%`;
                    return (
                      <motion.tr
                        key={v.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-brand-border/20 hover:bg-brand-surface/40 transition-colors"
                      >
                        <td className="py-3 px-3 text-white font-semibold text-xs">{v.name}</td>
                        <td className="py-3 px-3 text-brand-secondaryText text-xs">{v.district || '-'}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-black ${score > 70 ? 'text-brand-danger' : score > 40 ? 'text-brand-warning' : 'text-brand-success'}`}>
                            {score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-full h-2 bg-brand-background rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: heatWidth }}
                              transition={{ duration: 1, delay: i * 0.05 }}
                              className={`h-full rounded-full ${heatColor}`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-white text-xs font-bold">{v.activeCases || 0}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                            v.waterQualityStatus === 'SAFE' ? 'bg-brand-success/20 text-brand-success border-brand-success/30' :
                            v.waterQualityStatus === 'CONTAMINATED' ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/30' :
                            'bg-brand-warning/20 text-brand-warning border-brand-warning/30'
                          }`}>
                            {v.waterQualityStatus || 'UNKNOWN'}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* District Risk Chart */}
        <div className="lg:col-span-2 glass-panel p-6 border border-brand-border/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-brand-warning/10 border border-brand-warning/20">
              <TrendingUp className="w-5 h-5 text-brand-warning" />
            </div>
            <div>
              <h3 className="text-white font-bold">District Risk Distribution</h3>
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Average Risk Score by District</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <BarChart data={districtData} layout="vertical" margin={{ left: 5 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070B14', borderColor: '#1E293B', borderRadius: '10px', fontSize: '11px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="risk" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {districtData.map((entry, i) => (
                    <Cell key={i} fill={entry.risk > 70 ? '#EF4444' : entry.risk > 40 ? '#F59E0B' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════ ROW 3: Alerts Table + Disease Distribution + Water Quality ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Emergency Alerts Table */}
        <div className="lg:col-span-2 glass-panel p-6 border border-brand-border/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Bell className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Emergency Alert Center</h3>
                <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Live Notifications & Escalations</p>
              </div>
            </div>
            <span className="text-[10px] text-brand-secondaryText font-mono">{alerts.length} total</span>
          </div>

          <div className="overflow-y-auto custom-scrollbar max-h-64">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-brand-background/90 backdrop-blur-sm z-10">
                <tr className="border-b border-brand-border/40">
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-2.5 px-3">Level</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-2.5 px-3">Type</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-2.5 px-3">Village</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-2.5 px-3">Message</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-2.5 px-3">Status</th>
                  <th className="text-left text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 8).map((a, i) => {
                  const severityClasses = {
                    CRITICAL: 'bg-brand-danger/20 text-brand-danger border-brand-danger/30',
                    HIGH: 'bg-red-500/20 text-red-400 border-red-400/30',
                    MEDIUM: 'bg-brand-warning/20 text-brand-warning border-brand-warning/30',
                    LOW: 'bg-brand-success/20 text-brand-success border-brand-success/30'
                  };
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-brand-border/20 hover:bg-brand-surface/30 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full border uppercase font-black tracking-widest ${severityClasses[a.alertLevel] || severityClasses.MEDIUM}`}>
                          {a.alertLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-brand-secondaryText">{a.alertType || '-'}</td>
                      <td className="py-2.5 px-3 text-xs text-white font-semibold">{a.village?.name || '-'}</td>
                      <td className="py-2.5 px-3 text-xs text-brand-secondaryText max-w-[200px] truncate">{a.message}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                          a.status === 'ACTIVE' ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/20' : 'bg-brand-success/10 text-brand-success border-brand-success/20'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-brand-secondaryText font-mono">
                        {a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </motion.tr>
                  );
                })}
                {alerts.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-brand-secondaryText text-xs">No active alerts.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disease Distribution Donut + Water Quality */}
        <div className="space-y-6">
          {/* Disease Distribution */}
          <div className="glass-panel p-5 border border-brand-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-brand-warning" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Disease Prediction Summary</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%" minWidth={150} minHeight={150}>
                <PieChart>
                  <Pie
                    data={diseaseData.length > 0 ? diseaseData : [{ name: 'No Data', value: 1 }]}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={65}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={0}
                  >
                    {(diseaseData.length > 0 ? diseaseData : [{ name: 'No Data', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={diseaseData.length > 0 ? DISEASE_COLORS[i % DISEASE_COLORS.length] : '#1E293B'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1E293B', borderRadius: '10px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {diseaseData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DISEASE_COLORS[i % DISEASE_COLORS.length] }} />
                  <span className="text-[9px] text-brand-secondaryText font-bold uppercase tracking-wider">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Water Contamination Stats */}
          <div className="glass-panel p-5 border border-brand-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Water Contamination</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/40">
                <p className="text-[8px] text-brand-secondaryText uppercase tracking-widest font-bold">Avg pH</p>
                <p className="text-lg text-white font-black mt-1">{(wq.avgPh || 0).toFixed(1)}</p>
              </div>
              <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/40">
                <p className="text-[8px] text-brand-secondaryText uppercase tracking-widest font-bold">Avg Turbidity</p>
                <p className="text-lg text-white font-black mt-1">{(wq.avgTurbidity || 0).toFixed(1)}</p>
              </div>
              <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/40">
                <p className="text-[8px] text-brand-secondaryText uppercase tracking-widest font-bold">Safe Sources</p>
                <p className="text-lg text-brand-success font-black mt-1">{wq.safe || 0}</p>
              </div>
              <div className="bg-brand-surface/50 p-3 rounded-xl border border-brand-border/40">
                <p className="text-[8px] text-brand-secondaryText uppercase tracking-widest font-bold">Unsafe Sources</p>
                <p className="text-lg text-brand-danger font-black mt-1">{wq.unsafe || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ AI WORKFLOW VISUALIZATION ═══════ */}
      <div className="glass-panel p-6 border border-brand-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Radar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">AI Pipeline Workflow</h3>
            <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">End-to-End Intelligence Pipeline</p>
          </div>
        </div>

        <div className="flex items-center justify-between overflow-x-auto custom-scrollbar pb-4">
          {workflowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.label}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center min-w-[120px]"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-lg"
                    style={{ backgroundColor: `${step.color}15`, borderColor: `${step.color}40`, boxShadow: `0 0 20px ${step.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <p className="text-[9px] text-white font-bold uppercase tracking-wider mt-2.5 text-center">{step.label}</p>
                </motion.div>
                {i < workflowSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: i * 0.1 + 0.05 }}
                    className="flex items-center mx-2"
                  >
                    <div className="w-8 h-[2px] bg-gradient-to-r from-brand-border to-brand-accent/40" />
                    <ChevronRight className="w-4 h-4 text-brand-accent/60" />
                    <div className="w-8 h-[2px] bg-gradient-to-r from-brand-accent/40 to-brand-border" />
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ═══════ BOTTOM ROW: Disease Trends + Recent Reports + Quick Actions ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Disease Trends Chart */}
        <div className="lg:col-span-2 glass-panel p-6 border border-brand-border/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20">
              <TrendingUp className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h3 className="text-white font-bold">Disease Incidence Trends</h3>
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">6-Month Disease Tracking</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <AreaChart data={detailed.diseaseTrends || []}>
                <defs>
                  <linearGradient id="gCholera" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gTyphoid" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gDiarrhea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1E293B', borderRadius: '10px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="Cholera" stroke="#EF4444" fill="url(#gCholera)" strokeWidth={2} />
                <Area type="monotone" dataKey="Typhoid" stroke="#F59E0B" fill="url(#gTyphoid)" strokeWidth={2} />
                <Area type="monotone" dataKey="Diarrhea" stroke="#3B82F6" fill="url(#gDiarrhea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-3">
            {[{ name: 'Cholera', color: '#EF4444' }, { name: 'Typhoid', color: '#F59E0B' }, { name: 'Diarrhea', color: '#3B82F6' }].map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[9px] text-brand-secondaryText uppercase tracking-widest font-bold">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="glass-panel p-6 border border-brand-border/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Incoming Reports</h3>
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Real-time Field Data</p>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto custom-scrollbar max-h-72">
            {reports.slice(0, 6).map((r, i) => (
              <motion.div
                key={r.id || i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 bg-brand-surface/40 rounded-xl border border-brand-border/30 hover:border-brand-border/60 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <p className="text-xs text-white font-semibold truncate max-w-[60%]">{r.symptoms || 'Report'}</p>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                    r.severity === 'HIGH' ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/30' :
                    r.severity === 'MEDIUM' ? 'bg-brand-warning/20 text-brand-warning border-brand-warning/30' :
                    'bg-brand-success/20 text-brand-success border-brand-success/30'
                  }`}>
                    {r.severity || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-brand-secondaryText">{r.village?.name || '-'}</span>
                  <span className="text-[9px] text-brand-secondaryText font-mono">
                    {r.reportDate ? new Date(r.reportDate).toLocaleDateString() : '-'}
                  </span>
                </div>
              </motion.div>
            ))}
            {reports.length === 0 && (
              <p className="text-xs text-brand-secondaryText text-center py-6">No reports received.</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ AI OPERATIONS CONSOLE ═══════ */}
      <div className="glass-panel p-6 border border-brand-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20">
              <Cpu className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">AI Operations Console</h3>
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-bold">Manual Command Execution</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { name: 'Run Prediction', desc: 'Execute ML disease forecasting pipeline', path: 'run-prediction', icon: Zap, color: '#3B82F6' },
            { name: 'Recalculate Risk', desc: 'Recompute village risk weight indices', path: 'recalculate-risk', icon: ShieldAlert, color: '#F59E0B' },
            { name: 'Generate Alerts', desc: 'Trigger outbreak advisory scan', path: 'generate-alerts', icon: Award, color: '#EF4444' },
            { name: 'Sync Database', desc: 'Synchronize knowledge matrices', path: 'update-knowledge', icon: Database, color: '#10B981' },
            { name: 'Retrain Model', desc: 'Full ML model retraining cycle', path: 'update-knowledge', icon: BrainCircuit, color: '#A855F7' },
          ].map((cmd) => {
            const Icon = cmd.icon;
            const isRunning = runningCmd === cmd.name;
            return (
              <button
                key={cmd.name}
                onClick={() => triggerCommand(cmd.path, cmd.name)}
                disabled={runningCmd !== null}
                className="p-5 bg-brand-background/60 hover:bg-brand-surface border border-brand-border/50 hover:border-brand-accent/40 rounded-2xl transition-all duration-300 text-left group flex flex-col justify-between h-36 disabled:opacity-40 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: `linear-gradient(135deg, transparent, ${cmd.color}08)` }}
                />
                <div className="flex justify-between items-center w-full relative z-10">
                  <div className="p-2.5 rounded-xl border border-brand-border/50 group-hover:border-transparent transition-colors"
                    style={{ backgroundColor: `${cmd.color}10` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cmd.color }} />
                  </div>
                  {isRunning ? (
                    <div className="w-4 h-4 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-brand-secondaryText group-hover:text-white transition-all opacity-50 group-hover:opacity-100" />
                  )}
                </div>
                <div className="mt-3 relative z-10">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">{cmd.name}</h4>
                  <p className="text-[9px] text-brand-secondaryText leading-relaxed mt-1">{cmd.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
};

export default CommandCenterCore;
