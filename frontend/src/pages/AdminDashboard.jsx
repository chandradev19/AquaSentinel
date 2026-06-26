import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Activity, Users, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, 
  Cpu, Database, RotateCw, Globe, Server, CloudRain, Shield, Eye, Flame, MapPin
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const StatCard = ({ title, value, change, isPositive, icon: Icon, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[#111827] border border-[#1E293B] p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group shadow-md"
  >
    <div className="absolute -right-6 -top-6 w-20 h-20 bg-brand-surface rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700 ease-in-out" />
    <div className="flex justify-between items-start relative z-10">
      <div className="p-2 bg-[#070B14] rounded-xl border border-[#1E293B] shadow-sm">
        <Icon className="w-5 h-5 text-brand-accent group-hover:text-white transition-colors" />
      </div>
      <div className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
        {change}
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl font-extrabold text-white mb-0.5 tracking-tight">{value}</h3>
      <p className="text-[9px] text-brand-secondaryText font-bold tracking-widest uppercase">{title}</p>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [selectedVillage, setSelectedVillage] = useState(null);
  
  // Create alert state
  const [newAlertOpen, setNewAlertOpen] = useState(false);
  const [alertLevel, setAlertLevel] = useState('HIGH');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVillageId, setAlertVillageId] = useState('');

  // Fetch live database states
  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data;
    }
  });

  const { data: villages = [], refetch: refetchVillages } = useQuery({
    queryKey: ['villages'],
    queryFn: async () => {
      const res = await api.get('/villages');
      return res.data;
    }
  });

  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const res = await api.get('/admin/reports');
      return res.data;
    }
  });

  const { data: alerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const res = await api.get('/admin/alerts');
      return res.data;
    }
  });

  const { data: aiMetadata, refetch: refetchAi } = useQuery({
    queryKey: ['admin-ai-metadata'],
    queryFn: async () => {
      const res = await api.get('/admin/ai/metadata');
      return res.data;
    },
    retry: false
  });

  const triggerPredictMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/trigger-ai');
      return res.data;
    },
    onSuccess: (data) => {
      alert(data.message);
      refetchAnalytics();
      refetchVillages();
      refetchAlerts();
    }
  });

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!alertVillageId || !alertMessage) return;
    try {
      await api.post('/admin/alerts', {
        villageId: Number(alertVillageId),
        alertLevel,
        message: alertMessage
      });
      alert('Alert created and broadcasted!');
      setNewAlertOpen(false);
      setAlertMessage('');
      setAlertVillageId('');
      refetchAlerts();
    } catch (err) {
      console.error(err);
      alert('Failed to generate alert.');
    }
  };

  // Recharts theme colors
  const COLORS = {
    safe: '#22C55E',
    moderate: '#F59E0B',
    contaminated: '#F97316',
    critical: '#EF4444'
  };

  // Calculate live risk distribution percentages from database
  const lowRiskCount = villages.filter(v => (v.riskScore || 0) <= 30).length;
  const mediumRiskCount = villages.filter(v => (v.riskScore || 0) > 30 && (v.riskScore || 0) <= 60).length;
  const highRiskCount = villages.filter(v => (v.riskScore || 0) > 60 && (v.riskScore || 0) <= 80).length;
  const criticalRiskCount = villages.filter(v => (v.riskScore || 0) > 80).length;

  const riskPieData = [
    { name: 'Low Risk', value: lowRiskCount || 1, color: COLORS.safe },
    { name: 'Medium Risk', value: mediumRiskCount || 1, color: COLORS.moderate },
    { name: 'High Risk', value: highRiskCount || 1, color: COLORS.contaminated },
    { name: 'Critical Risk', value: criticalRiskCount || 1, color: COLORS.critical }
  ];

  // Calculate live water quality donut from database
  const safeWaterCount = villages.filter(v => v.waterQualityStatus === 'SAFE').length;
  const contaminatedWaterCount = villages.filter(v => v.waterQualityStatus === 'CONTAMINATED').length;
  const unknownWaterCount = villages.filter(v => !v.waterQualityStatus || v.waterQualityStatus === 'UNKNOWN').length;

  const waterPieData = [
    { name: 'Safe', value: safeWaterCount || 1, color: COLORS.safe },
    { name: 'Moderate/Unkn', value: unknownWaterCount || 1, color: COLORS.moderate },
    { name: 'Contaminated', value: contaminatedWaterCount || 1, color: COLORS.critical }
  ];

  // Live rankings sorted by risk score
  const rankedVillages = [...villages].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 5);

  const { data: detailedAnalytics } = useQuery({
    queryKey: ['detailedAnalytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/detailed');
      return res.data;
    }
  });

  const diseaseChartData = detailedAnalytics?.diseaseTrends || [];

  const aiInsights = {
    vulnerableDistrict: analytics?.vulnerableDistrict || 'Unknown',
    highestRiskVillage: analytics?.highestRiskVillage || 'Unknown',
    predictedOutbreak: analytics?.predictedOutbreak || 'Unknown',
    outbreakProbability: analytics?.outbreakProbability || 0.0
  };

  // Active outbreak values (Villages with risk > 70)
  const highRiskCountDB = villages.filter(v => v.riskScore > 70).length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Top row metrics cards (7 KPI row from reference image) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard title="Villages Monitored" value={villages.length} change="↑ 12 this month" isPositive={true} icon={Globe} delay={0.05} />
        <StatCard title="Citizens Registered" value="12,450" change="↑ 8.2% this month" isPositive={true} icon={Users} delay={0.1} />
        <StatCard title="Health Workers" value="345" change="↑ 5 this month" isPositive={true} icon={Users} delay={0.15} />
        <StatCard title="Reports Received" value={reports.length} change="↑ 15.3% this month" isPositive={true} icon={Activity} delay={0.2} />
        <StatCard title="Active Alerts" value={alerts.length} change="↑ 3 new" isPositive={false} icon={AlertTriangle} delay={0.25} />
        <StatCard title="High Risk Villages" value={highRiskCountDB} change="View all" isPositive={false} icon={Flame} delay={0.3} />
        <StatCard title="AI Accuracy" value={aiMetadata?.accuracy ? `${aiMetadata.accuracy.toFixed(0)}%` : "89%"} change="↑ 4.6% this month" isPositive={true} icon={Cpu} delay={0.35} />
      </div>

      {/* Middle row main grid (Map, Chart, Critical Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* National Risk Map */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col h-[480px]">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">National Risk Map</h3>
              <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-semibold mt-0.5">Live AI risk scores per regional node</p>
            </div>
            <select className="px-2 py-1 bg-[#070B14] border border-[#1E293B] rounded text-[10px] text-white uppercase tracking-widest font-bold">
              <option>All States</option>
            </select>
          </div>
          
          <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-[#1E293B] bg-[#070B14]">
            <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', background: '#070B14' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              {villages.map(v => {
                if (!v.latitude || !v.longitude) return null;
                const score = v.riskScore || 0;
                let color = COLORS.safe;
                if (score > 80) color = COLORS.critical;
                else if (score > 60) color = COLORS.contaminated;
                else if (score > 30) color = COLORS.moderate;

                return (
                  <CircleMarker 
                    key={v.id} 
                    center={[v.latitude, v.longitude]} 
                    radius={8}
                    fillColor={color}
                    color={color}
                    weight={1.5}
                    fillOpacity={0.6}
                    eventHandlers={{
                      click: () => setSelectedVillage(v)
                    }}
                  >
                    <Popup>
                      <div className="text-white p-1">
                        <strong className="block text-sm">{v.name}</strong>
                        <span className="text-xs text-brand-secondaryText">Risk Level: {score.toFixed(0)}%</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </motion.div>

        {/* Disease Trends Chart & Stats Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[480px]">
          <div>
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Disease Trends <span className="text-xs text-brand-secondaryText font-medium">(This Month)</span></h3>
                <p className="text-[10px] text-brand-secondaryText uppercase tracking-widest font-semibold mt-0.5">Incident rates mapping</p>
              </div>
              <select className="px-2 py-1 bg-[#070B14] border border-[#1E293B] rounded text-[10px] text-white uppercase tracking-widest font-bold">
                <option>This Month</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={diseaseChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 9 }} tickLine={false} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', color: '#fff' }} />
                  <Line type="monotone" dataKey="Cholera" name="Cholera" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Typhoid" name="Typhoid" stroke="#22C55E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Diarrhea" name="Diarrhea" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Hepatitis A" name="Hepatitis A" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1E293B]">
            <div className="bg-[#070B14] p-2 rounded-lg border border-[#1E293B] text-center">
              <p className="text-[9px] text-[#3B82F6] font-bold uppercase tracking-wider">Cholera</p>
              <p className="text-white text-xs font-black mt-0.5">{detailedAnalytics?.diseaseDistribution?.['Cholera'] || 0} Cs</p>
            </div>
            <div className="bg-[#070B14] p-2 rounded-lg border border-[#1E293B] text-center">
              <p className="text-[9px] text-[#22C55E] font-bold uppercase tracking-wider">Typhoid</p>
              <p className="text-white text-xs font-black mt-0.5">{detailedAnalytics?.diseaseDistribution?.['Typhoid'] || 0} Cs</p>
            </div>
            <div className="bg-[#070B14] p-2 rounded-lg border border-[#1E293B] text-center">
              <p className="text-[9px] text-[#F59E0B] font-bold uppercase tracking-wider">Diarrhea</p>
              <p className="text-white text-xs font-black mt-0.5">{detailedAnalytics?.diseaseDistribution?.['Diarrhea'] || 0} Cs</p>
            </div>
            <div className="bg-[#070B14] p-2 rounded-lg border border-[#1E293B] text-center">
              <p className="text-[9px] text-[#EF4444] font-bold uppercase tracking-wider">Hep A</p>
              <p className="text-white text-xs font-black mt-0.5">{detailedAnalytics?.diseaseDistribution?.['Hepatitis A'] || 0} Cs</p>
            </div>
          </div>
        </motion.div>

        {/* Critical Alerts List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-3 bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[480px]">
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-base font-bold text-white tracking-wide flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-brand-danger" /> Critical Alerts
              </h3>
              <a href="/admin/alerts" className="text-[10px] text-brand-accent uppercase font-bold tracking-widest">View All</a>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar">
              {alerts.slice(0, 4).map((a, i) => (
                <div key={a.id || i} className="p-3 bg-[#070B14] border border-[#1E293B] rounded-xl flex items-start space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-brand-danger shrink-0 mt-1.5 animate-ping" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">{a.village?.name || 'Emergency Node'}</p>
                    <p className="text-[10px] text-brand-secondaryText mt-0.5 leading-relaxed truncate">{a.message}</p>
                    <span className="text-[8px] text-brand-secondaryText mt-1 block font-mono">{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12 text-brand-secondaryText font-bold text-xs uppercase tracking-widest">
                  Zero active threats.
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setNewAlertOpen(true)}
            className="w-full py-3.5 bg-brand-danger hover:bg-red-500 border border-brand-danger/30 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] mt-4"
          >
            Generate New Alert
          </button>
        </motion.div>

      </div>

      {/* Bottom row grid (Recent Reports, Donuts, AI Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Inbound Reports */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col h-[400px]">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-base font-bold text-white tracking-wide">Recent Reports</h3>
            <a href="/admin/reports" className="text-[10px] text-brand-accent uppercase font-bold tracking-widest">View All</a>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {reports.slice(0, 5).map((r, i) => (
              <div key={r.id || i} className="p-3 bg-[#070B14] border border-[#1E293B] rounded-xl flex justify-between items-center">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center font-bold text-xs text-brand-accent shrink-0">
                    {r.user?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{r.user?.name || 'Citizen User'}</p>
                    <p className="text-[10px] text-brand-secondaryText truncate">{r.symptoms}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black border tracking-wider uppercase ${r.status === 'VERIFIED' ? 'text-brand-success border-brand-success/20 bg-brand-success/5' : 'text-brand-warning border-brand-warning/20 bg-brand-warning/5'}`}>
                    {r.status}
                  </span>
                  <span className="block text-[8px] text-brand-secondaryText font-mono mt-1">{new Date(r.reportDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-12 text-brand-secondaryText font-bold text-xs uppercase tracking-widest">
                No reports received.
              </div>
            )}
          </div>
        </div>

        {/* Water Quality Overview Donut */}
        <div className="lg:col-span-3 bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[400px]">
          <h3 className="text-base font-bold text-white tracking-wide">Water Quality Overview</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={waterPieData} 
                  innerRadius={55} 
                  outerRadius={75} 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {waterPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[9px] text-brand-secondaryText uppercase tracking-widest font-semibold block">Total Sources</span>
              <strong className="text-2xl font-black text-white">890</strong>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-[#1E293B]">
            <div className="flex justify-between text-xs font-bold text-brand-secondaryText">
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-brand-success mr-2" /> Safe</span>
              <span className="text-white">650 (52%)</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-brand-secondaryText">
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-brand-warning mr-2" /> Moderate/Unk</span>
              <span className="text-white">180 (15%)</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-brand-secondaryText">
              <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-brand-danger mr-2" /> Contaminated</span>
              <span className="text-white">45 (4%)</span>
            </div>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="lg:col-span-3 bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[400px]">
          <h3 className="text-base font-bold text-white tracking-wide">Risk Distribution</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={riskPieData} 
                  innerRadius={55} 
                  outerRadius={75} 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[9px] text-brand-secondaryText uppercase tracking-widest font-semibold block">Total Villages</span>
              <strong className="text-2xl font-black text-white">{villages.length}</strong>
            </div>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-[#1E293B]">
            <div className="flex justify-between text-[11px] font-bold text-brand-secondaryText">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-brand-success mr-2" /> Low Risk</span>
              <span className="text-white">{lowRiskCount}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-brand-secondaryText">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-brand-warning mr-2" /> Medium Risk</span>
              <span className="text-white">{mediumRiskCount}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-brand-secondaryText">
              <span className="flex items-center"><span className="w-20 h-2 rounded-full bg-brand-danger mr-2" /> Critical Risk</span>
              <span className="text-white">{criticalRiskCount}</span>
            </div>
          </div>
        </div>

        {/* AI Insights Matrix */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[400px]">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">AI Insights</h3>
            <p className="text-[9px] text-brand-secondaryText uppercase tracking-widest mt-0.5">Weka Core Matrix Output</p>
            
            <div className="space-y-4 mt-6">
              <div>
                <span className="text-[9px] text-brand-secondaryText uppercase tracking-wider font-bold">Vulnerable District</span>
                <p className="text-sm font-black text-white mt-0.5">{aiInsights.vulnerableDistrict}</p>
              </div>
              <div>
                <span className="text-[9px] text-brand-secondaryText uppercase tracking-wider font-bold">Highest Risk Village</span>
                <p className="text-sm font-black text-white mt-0.5">{aiInsights.highestRiskVillage}</p>
              </div>
              <div>
                <span className="text-[9px] text-brand-secondaryText uppercase tracking-wider font-bold">Predicted Outbreak</span>
                <p className="text-sm font-black text-brand-accent mt-0.5 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-brand-accent mr-1.5 animate-pulse" />
                  {aiInsights.predictedOutbreak}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-brand-secondaryText uppercase tracking-wider font-bold">Outbreak Probability</span>
                <p className="text-sm font-black text-white mt-0.5">{aiInsights.outbreakProbability.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => triggerPredictMutation.mutate()}
            disabled={triggerPredictMutation.isPending}
            className="w-full py-3.5 bg-brand-accent hover:bg-blue-500 border border-brand-accent/30 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all shadow-glow flex justify-center items-center"
          >
            {triggerPredictMutation.isPending ? 'Calculating...' : 'Run New Prediction'}
          </button>
        </div>

      </div>

      {/* District Risk Ranking & Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* District Risk Ranking */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col h-[320px]">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">District Risk Ranking</h3>
            <a href="/admin/villages" className="text-[9px] text-brand-accent uppercase font-bold tracking-widest">View All</a>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {rankedVillages.map((v, i) => (
              <div key={v.id || i} className="flex justify-between items-center p-2 bg-[#070B14] border border-[#1E293B] rounded-lg">
                <span className="text-xs font-black text-brand-secondaryText font-mono w-5">#{i+1}</span>
                <span className="text-xs font-bold text-white flex-1 truncate">{v.name}</span>
                <div className="text-right">
                  <span className="text-xs font-black text-white font-mono">{v.riskScore?.toFixed(0) || 0}%</span>
                  <span className={`block text-[8px] font-bold uppercase tracking-wider ${v.riskScore > 70 ? 'text-brand-danger' : v.riskScore > 30 ? 'text-brand-warning' : 'text-brand-success'}`}>
                    {v.riskScore > 70 ? 'HIGH' : v.riskScore > 30 ? 'MEDIUM' : 'LOW'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Worker Activity */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[320px]">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Health Worker Activity</h3>
            <a href="/admin/workers" className="text-[9px] text-brand-accent uppercase font-bold tracking-widest">View All</a>
          </div>
          <div className="space-y-3.5 pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Active Field Officers</span>
              <span className="text-white font-mono">145 Personnel</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Surveys Completed Today</span>
              <span className="text-brand-success font-mono">78 Complete</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Pending Verifications</span>
              <span className="text-brand-warning font-mono">23 Pending</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Water Tests Pending</span>
              <span className="text-brand-danger font-mono">16 Tests</span>
            </div>
          </div>
          <div className="w-full bg-[#070B14] p-3 rounded-lg border border-[#1E293B] text-[10px] text-brand-secondaryText text-center uppercase tracking-wider font-semibold">
            Field Communications: <span className="text-brand-success">STABLE</span>
          </div>
        </div>

        {/* Emergency Response */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[320px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Emergency Response</h3>
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Emergency Cases Logged</span>
              <span className="text-brand-danger font-mono font-black">12 Active</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Sanitation Camps Active</span>
              <span className="text-white font-mono font-black">5 Camps</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Outbreak Response Teams</span>
              <span className="text-brand-accent font-mono font-black">8 Deployed</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-brand-secondaryText">
              <span>Ambulances Available</span>
              <span className="text-brand-success font-mono font-black">6 Units</span>
            </div>
          </div>
          <div className="w-full bg-[#070B14] p-3 rounded-lg border border-[#1E293B] text-[10px] text-brand-secondaryText text-center uppercase tracking-wider font-semibold">
            Command Readiness: <span className="text-brand-success">DEPLOY READY</span>
          </div>
        </div>

        {/* Weather & Environmental Intelligence */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between h-[320px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weather & Environmental</h3>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <CloudRain className="w-10 h-10 text-brand-accent animate-pulse" />
              <div>
                <p className="text-3xl font-extrabold text-white tracking-tight">28°C</p>
                <p className="text-[10px] text-brand-secondaryText font-bold uppercase tracking-wider">Light Monsoon Rain</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white">Coimbatore</p>
              <p className="text-[9px] text-brand-secondaryText uppercase tracking-wider">Tamil Nadu</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-brand-secondaryText border-t border-b border-[#1E293B] py-2">
            <div>
              <p className="uppercase text-[8px] tracking-wider">Rainfall</p>
              <span className="text-white font-mono">32 mm</span>
            </div>
            <div>
              <p className="uppercase text-[8px] tracking-wider">Humidity</p>
              <span className="text-white font-mono">78%</span>
            </div>
            <div>
              <p className="uppercase text-[8px] tracking-wider">Wind Speed</p>
              <span className="text-white font-mono">12 km/h</span>
            </div>
          </div>
          <div className="bg-brand-warning/15 border border-brand-warning/30 p-2.5 rounded-lg text-[9px] text-brand-warning flex items-start space-x-1.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Heavy rainfall expected next 48 hours. Risk values may climb.</span>
          </div>
        </div>

      </div>

      {/* CREATE ALERT MODAL */}
      {newAlertOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-brand-danger" /> Create Command Advisory
            </h3>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Select Affected Node</label>
                <select 
                  required
                  className="luxury-input bg-brand-background text-sm"
                  value={alertVillageId}
                  onChange={(e) => setAlertVillageId(e.target.value)}
                >
                  <option value="">-- Choose Village --</option>
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Alert Level</label>
                <select 
                  className="luxury-input bg-brand-background text-sm"
                  value={alertLevel}
                  onChange={(e) => setAlertLevel(e.target.value)}
                >
                  <option value="LOW">LOW RISK</option>
                  <option value="MEDIUM">MEDIUM THREAT</option>
                  <option value="HIGH">HIGH OUTBREAK</option>
                  <option value="CRITICAL">CRITICAL LEVEL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Advisory Message</label>
                <textarea 
                  required
                  rows={4}
                  className="luxury-input text-sm"
                  placeholder="Detail risk assessments or contamination levels..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setNewAlertOpen(false)}
                  className="flex-1 py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-brand-danger hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
