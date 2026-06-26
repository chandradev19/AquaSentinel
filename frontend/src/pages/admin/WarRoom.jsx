import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import api from '../../services/api';
import { 
  Shield, AlertTriangle, Users, Droplet, Clock, Activity, 
  CloudRain, Globe, Heart, ShieldAlert, Thermometer, Wind, RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { generateRiskAnalysis } from '../../utils/ReportGenerator';

const WarRoom = () => {
  const [loading, setLoading] = useState(false);

  // Fetch National Health Index
  const { data: healthIndex = { score: 84, status: 'Good', wqScore: 80, diseaseScore: 90, workerScore: 82 }, refetch: refetchIndex } = useQuery({
    queryKey: ['healthIndex'],
    queryFn: async () => {
      const res = await api.get('/admin/health-index');
      return res.data;
    }
  });

  // Fetch Detailed Analytics
  const { data: analytics = {}, refetch: refetchAnalytics } = useQuery({
    queryKey: ['detailedAnalytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/detailed');
      return res.data;
    }
  });

  // Fetch Villages for map & ranking
  const { data: villages = [], refetch: refetchVillages } = useQuery({
    queryKey: ['warRoomVillages'],
    queryFn: async () => {
      const res = await api.get('/villages');
      return res.data;
    }
  });

  // Fetch Alerts for panel
  const { data: alerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['warRoomAlerts'],
    queryFn: async () => {
      const res = await api.get('/admin/alerts');
      return res.data;
    }
  });

  // Fetch Audit Logs for worker activity
  const { data: auditLogs = [], refetch: refetchAudit } = useQuery({
    queryKey: ['warRoomAudit'],
    queryFn: async () => {
      const res = await api.get('/admin/audit');
      return res.data;
    }
  });

  const handleRefreshAll = async () => {
    setLoading(true);
    await Promise.all([
      refetchIndex(),
      refetchAnalytics(),
      refetchVillages(),
      refetchAlerts(),
      refetchAudit()
    ]);
    setLoading(false);
  };

  const getRiskColor = (score) => {
    if (!score) return '#22C55E';
    if (score > 70) return '#EF4444'; // Red
    if (score > 40) return '#F59E0B'; // Amber
    return '#22C55E'; // Green
  };

  const getHealthIndexColor = (status) => {
    if (status === 'Critical') return 'text-brand-danger';
    if (status === 'Moderate') return 'text-brand-warning';
    return 'text-brand-success';
  };

  const getHealthIndexBorder = (status) => {
    if (status === 'Critical') return 'border-brand-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    if (status === 'Moderate') return 'border-brand-warning/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    return 'border-brand-success/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
  };

  // Extract necessary details from analytics
  const wqStats = analytics.waterQuality || { avgPh: 7.2, avgTurbidity: 1.5, avgContamination: 12.0, safe: 3, unsafe: 1 };
  const alertStats = analytics.alertStats || { active: 1, resolved: 1, low: 0, medium: 1, high: 1, critical: 0 };
  const diseaseTrends = analytics.diseaseTrends || [
    { month: 'Jan', Cholera: 15, Typhoid: 20, Diarrhea: 40, Dysentery: 10, 'Hepatitis A': 5 },
    { month: 'Feb', Cholera: 10, Typhoid: 25, Diarrhea: 35, Dysentery: 12, 'Hepatitis A': 6 },
    { month: 'Mar', Cholera: 22, Typhoid: 18, Diarrhea: 50, Dysentery: 8, 'Hepatitis A': 4 },
    { month: 'Apr', Cholera: 35, Typhoid: 30, Diarrhea: 65, Dysentery: 18, 'Hepatitis A': 10 },
    { month: 'May', Cholera: 40, Typhoid: 32, Diarrhea: 70, Dysentery: 24, 'Hepatitis A': 15 },
    { month: 'Jun', Cholera: 5, Typhoid: 8, Diarrhea: 12, Dysentery: 3, 'Hepatitis A': 2 }
  ];
  const diseaseDistribution = analytics.diseaseDistribution || {
    "Cholera": 5, "Typhoid": 8, "Diarrhea": 14, "Dysentery": 3, "Hepatitis A": 2
  };
  const distributionData = Object.entries(diseaseDistribution).map(([name, value]) => ({ name, value }));

  const aiInsights = analytics.aiInsights || {
    highestRiskVillage: "Unknown",
    vulnerableDistrict: "Unknown",
    predictedOutbreak: "Unknown",
    outbreakProbability: 0.0
  };

  // Filter high risk villages
  const highRiskVillages = villages.filter(v => v.riskScore > 50.0);
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE' || !a.status);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans text-brand-primaryText">
      {/* Top Banner Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-brand-surface border border-brand-border px-6 py-4 rounded-2xl shadow-luxury">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/35 flex items-center justify-center text-brand-accent shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide uppercase flex items-center gap-2">
              National Health Command War Room
            </h1>
            <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-black">
              Smart India Hackathon Surveillance & Intervention Terminal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 bg-brand-background px-3 py-1.5 rounded-lg border border-brand-border">
            <span className="w-2 h-2 rounded-full bg-brand-success animate-ping" />
            <span className="text-[10px] font-black uppercase text-brand-success tracking-wider">
              Secure Cloud Link
            </span>
          </div>

          <button 
            onClick={() => generateRiskAnalysis(villages)}
            className="px-4 py-2 bg-brand-accent hover:bg-blue-600 border border-brand-accent/50 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-glow flex items-center"
          >
            Export PDF
          </button>
          
          <button 
            onClick={handleRefreshAll}
            disabled={loading}
            className="px-4 py-2 bg-brand-background hover:bg-brand-surface border border-brand-border text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Update Feed</span>
          </button>
        </div>
      </div>

      {/* Top Row: National Health Index & Emergency status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* National Health Index Gauge */}
        <div className={`p-5 rounded-2xl border bg-brand-surface flex items-center justify-between ${getHealthIndexBorder(healthIndex.status)}`}>
          <div className="space-y-1">
            <span className="text-[9px] text-brand-secondaryText font-black uppercase tracking-wider">National Health Index</span>
            <p className="text-3xl font-black text-white">{healthIndex.score} <span className="text-xs text-brand-secondaryText">/ 100</span></p>
            <p className={`text-xs font-extrabold uppercase tracking-widest ${getHealthIndexColor(healthIndex.status)}`}>
              Status: {healthIndex.status}
            </p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="#1E293B" strokeWidth="4" />
              <circle 
                cx="32" 
                cy="32" 
                r="28" 
                fill="transparent" 
                stroke={healthIndex.score > 70 ? '#22C55E' : healthIndex.score > 40 ? '#F59E0B' : '#EF4444'} 
                strokeWidth="4" 
                strokeDasharray={175} 
                strokeDashoffset={175 - (175 * healthIndex.score) / 100} 
              />
            </svg>
            <span className="absolute text-[11px] font-black text-white">{healthIndex.score}%</span>
          </div>
        </div>

        {/* Emergency Status */}
        <div className="p-5 rounded-2xl border border-brand-border bg-brand-surface flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-brand-secondaryText font-black uppercase tracking-wider">Active Outbreaks</span>
            <p className="text-3xl font-black text-white">
              {villages.filter(v => v.riskScore > 70.0).length}
            </p>
            <p className="text-[10px] text-brand-secondaryText font-semibold">
              Villages monitored: {villages.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-danger/10 text-brand-danger flex items-center justify-center border border-brand-danger/25">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Total Active Cases */}
        <div className="p-5 rounded-2xl border border-brand-border bg-brand-surface flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-brand-secondaryText font-black uppercase tracking-wider">Total Active Cases</span>
            <p className="text-3xl font-black text-white">
              {villages.reduce((sum, v) => sum + (v.activeCases || 0), 0)}
            </p>
            <p className="text-[10px] text-brand-success font-black uppercase tracking-wider">
              Verified Symptom Logs
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-success/10 text-brand-success flex items-center justify-center border border-brand-success/25">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Weather Intelligence */}
        <div className="p-5 rounded-2xl border border-brand-border bg-brand-surface flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] text-brand-secondaryText font-black uppercase tracking-wider">Surveillance Weather</span>
            <div className="flex items-center space-x-3 text-xs font-bold text-white">
              <span className="flex items-center"><CloudRain className="w-3.5 h-3.5 text-blue-400 mr-1"/> Monsoon</span>
              <span className="flex items-center"><Thermometer className="w-3.5 h-3.5 text-brand-warning mr-1"/> 28.5°C</span>
            </div>
            <p className="text-[9px] text-brand-secondaryText font-semibold">
              Rainfall Index: Elevated risk factors
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/25">
            <CloudRain className="w-6 h-6 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Main Command Center Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4/12): High Risk Villages & Active Alerts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* High Risk Villages */}
          <div className="luxury-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/40">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-brand-danger animate-pulse" />
                Critical High Risk Villages
              </h3>
              <span className="text-[10px] text-brand-secondaryText font-bold">
                ({highRiskVillages.length} Alerting)
              </span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {highRiskVillages.length === 0 ? (
                <div className="py-6 text-center text-brand-secondaryText text-xs font-semibold">
                  No villages currently exceed high risk index thresholds.
                </div>
              ) : (
                highRiskVillages.map(v => (
                  <div key={v.id} className="p-3 bg-brand-background/60 border border-brand-border rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-white block">{v.name}</span>
                      <span className="text-[9px] text-brand-secondaryText uppercase tracking-wider">{v.district}, {v.state}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-brand-secondaryText font-bold">Cases: {v.activeCases}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black text-brand-danger bg-brand-danger/10 border border-brand-danger/25">
                        {v.riskScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Alerts */}
          <div className="luxury-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/40">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-brand-warning animate-pulse" />
                Active Alerts Feed
              </h3>
              <span className="text-[10px] text-brand-secondaryText font-bold">
                ({activeAlerts.length} Broadcasts)
              </span>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {activeAlerts.length === 0 ? (
                <div className="py-6 text-center text-brand-secondaryText text-xs font-semibold">
                  No active advisory alerts published.
                </div>
              ) : (
                activeAlerts.map(a => (
                  <div key={a.id} className="p-3.5 bg-brand-background/60 border border-brand-border rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white font-extrabold uppercase bg-brand-accent/20 border border-brand-accent/30 px-1.5 py-0.5 rounded">
                        {a.alertType || 'Emergency Alert'}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 rounded uppercase ${a.alertLevel === 'HIGH' || a.alertLevel === 'CRITICAL' ? 'text-brand-danger bg-brand-danger/10' : 'text-brand-warning bg-brand-warning/10'}`}>
                        {a.alertLevel}
                      </span>
                    </div>
                    <p className="text-xs text-brand-secondaryText font-semibold">
                      {a.message}
                    </p>
                    <span className="text-[9px] text-brand-secondaryText/60 block text-right font-medium">
                      Node: {a.village?.name || 'All'} • {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Center Column (4/12): Live India Map */}
        <div className="lg:col-span-4 relative rounded-2xl overflow-hidden border border-brand-border h-[620px] shadow-luxury bg-brand-background flex flex-col justify-between p-5">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border/40 mb-3">
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-brand-accent" />
              Live India Map surveillance
            </span>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-brand-border/50">
            <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={5} 
              zoomControl={false}
              style={{ height: '100%', width: '100%', background: '#070B14' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              {villages.map(v => {
                if (!v.latitude || !v.longitude) return null;
                return (
                  <CircleMarker
                    key={v.id}
                    center={[v.latitude, v.longitude]}
                    radius={12}
                    fillColor={getRiskColor(v.riskScore)}
                    color={getRiskColor(v.riskScore)}
                    weight={2}
                    opacity={0.8}
                    fillOpacity={0.4}
                  >
                    <Popup>
                      <div className="text-white p-1">
                        <strong className="block text-sm">{v.name}</strong>
                        <span className="text-xs text-brand-secondaryText">Risk Index: {v.riskScore?.toFixed(1) || 0}%</span>
                        <span className="block text-xs text-brand-secondaryText">Active Cases: {v.activeCases || 0}</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <div className="flex justify-between items-center text-[10px] font-black uppercase text-brand-secondaryText mt-3 border-t border-brand-border/30 pt-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-success" /> Safe</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-warning" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-danger" /> Critical</span>
          </div>
        </div>

        {/* Right Column (4/12): Disease Trends & Water Quality */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Disease Trends area chart */}
          <div className="luxury-card p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-accent animate-pulse" />
                Active Outbreak disease trends
              </h3>
            </div>

            <div className="h-[210px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diseaseTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCholera" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTyphoid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDiarrhea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B' }} />
                  <Area type="monotone" dataKey="Cholera" stroke="#EF4444" fillOpacity={1} fill="url(#colorCholera)" />
                  <Area type="monotone" dataKey="Typhoid" stroke="#F59E0B" fillOpacity={1} fill="url(#colorTyphoid)" />
                  <Area type="monotone" dataKey="Diarrhea" stroke="#3B82F6" fillOpacity={1} fill="url(#colorDiarrhea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Quality Overview */}
          <div className="luxury-card p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-blue-400" />
                Water quality parameter overview
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-brand-background/60 border border-brand-border rounded-xl text-center">
                <span className="text-[9px] text-brand-secondaryText font-bold uppercase tracking-wider block">Avg pH</span>
                <span className="text-lg font-black text-white mt-1 block">{(wqStats.avgPh || 7.2).toFixed(1)}</span>
              </div>
              <div className="p-3 bg-brand-background/60 border border-brand-border rounded-xl text-center">
                <span className="text-[9px] text-brand-secondaryText font-bold uppercase tracking-wider block">Turbidity</span>
                <span className="text-lg font-black text-white mt-1 block">{(wqStats.avgTurbidity || 1.5).toFixed(1)} NTU</span>
              </div>
              <div className="p-3 bg-brand-background/60 border border-brand-border rounded-xl text-center">
                <span className="text-[9px] text-brand-secondaryText font-bold uppercase tracking-wider block">Chemical</span>
                <span className="text-lg font-black text-white mt-1 block">{(wqStats.avgContamination || 12.0).toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-brand-background border border-brand-border rounded-xl">
              <div className="space-y-0.5">
                <span className="text-[9px] text-brand-secondaryText font-bold uppercase block">Biological Purity Index</span>
                <span className="text-xs font-black text-white">Safe sources vs Contaminated</span>
              </div>
              <span className="text-xs font-black text-brand-success bg-brand-success/10 px-2.5 py-1 border border-brand-success/20 rounded-lg">
                {wqStats.safe} Safe / {wqStats.unsafe} Alerting
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row Grid: AI Outbreak Insights & Worker Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (6/12): AI Outbreak Insights */}
        <div className="lg:col-span-6">
          <div className="luxury-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/40">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-accent animate-pulse" />
                AI Outbreak Insights & Preventative recommendations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-brand-background/50 border border-brand-border rounded-xl space-y-2">
                <span className="text-[9px] text-brand-accent font-black uppercase tracking-wider block">Outbreak Probability Vector</span>
                <p className="text-sm font-black text-white">{aiInsights.highestRiskVillage} showing {aiInsights.outbreakProbability.toFixed(1)}% correlation to {aiInsights.predictedOutbreak} indicators</p>
                <p className="text-xs text-brand-secondaryText font-semibold leading-relaxed">
                  RandomForest classifier mapped pH anomalies and rainfall levels with verified citizen {aiInsights.predictedOutbreak} logs.
                </p>
              </div>

              <div className="p-4 bg-brand-background/50 border border-brand-border rounded-xl space-y-2">
                <span className="text-[9px] text-brand-warning font-black uppercase tracking-wider block">Recommended Protocols</span>
                <p className="text-sm font-black text-white">Deploy field worker dispatch & chlorination</p>
                <p className="text-xs text-brand-secondaryText font-semibold leading-relaxed">
                  Trigger alerts for all villages in {aiInsights.vulnerableDistrict}. Restrict unverified water sources immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (6/12): Worker Activities */}
        <div className="lg:col-span-6">
          <div className="luxury-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/40">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                Real-Time Worker Activity & Surveillance Audits
              </h3>
            </div>

            <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="py-6 text-center text-brand-secondaryText text-xs font-semibold">
                  No active operations logged.
                </div>
              ) : (
                auditLogs.slice(0, 4).map((log, index) => (
                  <div key={log.id || index} className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0 animate-pulse" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-white block">{log.details}</span>
                        <span className="text-[9px] text-brand-secondaryText font-semibold uppercase tracking-wider">{log.actionType}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-brand-secondaryText/80 font-medium whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WarRoom;
