import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { generateVillageReport } from '../../utils/ReportGenerator';
import { 
  Map, Users, Droplets, Activity, ShieldAlert, Clock, ArrowLeft, 
  RotateCw, UserCheck, AlertTriangle, Eye, Loader, CheckCircle, List, Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VillageDigitalTwin = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [village, setVillage] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [workers, setWorkers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const resVillage = await api.get(`/villages/${id}`);
      setVillage(resVillage.data);

      const resHistory = await api.get(`/admin/villages/${id}/history`);
      setHistory(resHistory.data || []);

      const resStats = await api.get(`/admin/villages/${id}/statistics`);
      setStats(resStats.data);

      // Fetch all reports and alerts and filter by village
      const resReports = await api.get('/admin/reports');
      const villageReports = (resReports.data || []).filter(r => r.village?.id === Number(id));
      setReports(villageReports);

      const resAlerts = await api.get('/admin/alerts');
      const villageAlerts = (resAlerts.data || []).filter(a => a.village?.id === Number(id));
      setAlerts(villageAlerts);

      const resUsers = await api.get('/admin/users');
      const healthWorkers = (resUsers.data || []).filter(u => u.role === 'HEALTH_WORKER');
      setWorkers(healthWorkers);
    } catch (err) {
      console.error('Failed to load Digital Twin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRecalculateRisk = async () => {
    setRecalculating(true);
    try {
      const res = await api.post(`/admin/villages/${id}/recalculate-risk`);
      setVillage(res.data);
      alert('AI Risk Score updated and logged to history timeline.');
      fetchData(); // refresh history
    } catch (err) {
      console.error(err);
      alert('Failed to recalculate risk.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleAssignWorker = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId) return;
    try {
      await api.post(`/admin/villages/${id}/assign-worker`, {
        workerId: Number(selectedWorkerId)
      });
      alert('Field officer coverage successfully assigned.');
      setAssignOpen(false);
      setSelectedWorkerId('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign officer.');
    }
  };

  const getWorkerName = () => {
    const assigned = workers.find(w => w.village && w.village.id === Number(id));
    return assigned ? assigned.name : 'Unassigned';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!village) {
    return (
      <div className="text-center p-12 text-white">
        <h3 className="text-xl font-bold">Node Not Found</h3>
        <button onClick={() => navigate('/admin/villages')} className="mt-4 px-4 py-2 bg-brand-surface border border-brand-border rounded text-xs uppercase font-bold">
          Back to list
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => navigate('/admin/villages')} className="p-3 bg-brand-surface border border-brand-border rounded-xl text-brand-secondaryText hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            Digital Twin: {village.name}
          </h1>
          <p className="text-brand-secondaryText uppercase tracking-widest text-xs font-semibold">
            Real-time cybernetic node replication & simulation
          </p>
        </div>
        <div className="ml-auto">
          <button 
            onClick={() => generateVillageReport(village, reports, alerts)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-brand-accent hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-glow"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Digital Twin Telemetry Info */}
        <div className="space-y-6">
          <div className="glass-panel p-6 border border-brand-border space-y-6">
            <h3 className="text-base font-black text-white uppercase tracking-widest border-b border-brand-border/50 pb-2 flex items-center">
              <Map className="w-5 h-5 mr-2 text-brand-accent" /> Live Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Population</span>
                <strong className="text-xl text-white font-mono mt-1 block">{village.population?.toLocaleString() || 'N/A'}</strong>
              </div>
              <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Disease Cases</span>
                <strong className="text-xl text-white font-mono mt-1 block">{reports.length} Cases</strong>
              </div>
              <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">AI Risk Index</span>
                <strong className={`text-xl font-mono mt-1 block ${village.riskScore > 75 ? 'text-brand-danger' : village.riskScore > 35 ? 'text-brand-warning' : 'text-brand-success'}`}>
                  {village.riskScore?.toFixed(1) || 0}%
                </strong>
              </div>
              <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Water Quality</span>
                <strong className={`text-xl mt-1 block uppercase ${village.waterQualityStatus === 'SAFE' ? 'text-brand-success' : 'text-brand-danger'}`}>
                  {village.waterQualityStatus || 'UNKNOWN'}
                </strong>
              </div>
            </div>

            <div className="p-4 bg-brand-background border border-brand-border rounded-xl space-y-2">
              <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Assigned Officer</span>
              <p className="text-sm font-bold text-white">{getWorkerName()}</p>
              <span className="text-[10px] text-brand-secondaryText font-mono block">Geoposition: {village.latitude?.toFixed(4)}, {village.longitude?.toFixed(4)}</span>
            </div>

            <div className="pt-4 border-t border-brand-border/50 space-y-3">
              <button 
                onClick={handleRecalculateRisk}
                disabled={recalculating}
                className="w-full py-3.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex justify-center items-center shadow-glow disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Calculating AI Matrices...' : 'Generate Risk Score'}
              </button>
              <button 
                onClick={() => setAssignOpen(true)}
                className="w-full py-3.5 bg-brand-surface border border-brand-border text-white hover:bg-brand-border rounded-xl text-xs uppercase tracking-widest font-black transition-all flex justify-center items-center"
              >
                <UserCheck className="w-4 h-4 mr-2" /> Assign Officer
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Charts, Timeline, Reports and Alerts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Risk Score Trend Timeline Chart */}
          <div className="glass-panel p-6 border border-brand-border flex flex-col h-[350px]">
            <h3 className="text-base font-black text-white uppercase tracking-widest mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand-warning animate-pulse" /> Risk Trend Timeline (Digital Twin History)
            </h3>
            <div className="flex-1 w-full min-h-0">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis 
                      dataKey="recordedAt" 
                      stroke="#64748B" 
                      fontSize={9} 
                      tickLine={false} 
                      tickFormatter={(tick) => new Date(tick).toLocaleDateString([], {month:'short', day:'numeric'})}
                    />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', color: '#fff' }} 
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 3 }} />
                    <Line type="monotone" dataKey="activeCases" name="Active Cases" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-brand-secondaryText">
                  <CheckCircle className="w-10 h-10 mb-2 text-brand-success" />
                  <p className="text-xs uppercase tracking-widest font-black">Timeline nominal. Running calculations will populate data.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alerts Log widget */}
            <div className="glass-panel p-5 border border-brand-border flex flex-col h-[280px]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-brand-danger" /> Active Node Alerts
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {alerts.map((a, i) => (
                  <div key={a.id || i} className="p-2.5 bg-brand-background border border-brand-border rounded-lg text-xs leading-relaxed">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-brand-danger">{a.alertLevel}</span>
                      <span className="text-[10px] text-brand-secondaryText">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-brand-secondaryText">{a.message}</p>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="h-full flex items-center justify-center text-brand-secondaryText text-xs uppercase tracking-widest font-black">
                    No active node warnings.
                  </div>
                )}
              </div>
            </div>

            {/* Inbound Reports List */}
            <div className="glass-panel p-5 border border-brand-border flex flex-col h-[280px]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center">
                <List className="w-4 h-4 mr-1.5 text-brand-accent" /> Inbound Health Reports
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {reports.map((r, i) => (
                  <div key={r.id || i} className="p-2.5 bg-brand-background border border-brand-border rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{r.user?.name || 'Citizen'}</p>
                      <p className="text-[10px] text-brand-secondaryText mt-0.5">{r.symptoms}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black border uppercase ${r.status === 'VERIFIED' ? 'text-brand-success border-brand-success/20 bg-brand-success/5' : 'text-brand-warning border-brand-warning/20'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="h-full flex items-center justify-center text-brand-secondaryText text-xs uppercase tracking-widest font-black">
                    No reports logged.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ASSIGN OFFICER MODAL */}
      {assignOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
              <UserCheck className="w-6 h-6 mr-2 text-brand-accent" /> Assign Coverage Officer
            </h3>
            <form onSubmit={handleAssignWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Select Health worker</label>
                <select 
                  required
                  className="luxury-input bg-brand-background text-sm"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                >
                  <option value="">-- Choose Officer --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setAssignOpen(false)}
                  className="flex-1 py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!selectedWorkerId}
                  className="flex-1 py-3 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow disabled:opacity-50"
                >
                  Assign Coverage
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default VillageDigitalTwin;
