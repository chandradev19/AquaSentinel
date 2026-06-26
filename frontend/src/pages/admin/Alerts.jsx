import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, CheckCircle, Bell, Eye, Loader, Info } from 'lucide-react';

import { generateAlertsReport } from '../../utils/ReportGenerator';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // New Alert fields
  const [newAlert, setNewAlert] = useState({
    villageId: '',
    alertLevel: 'HIGH',
    message: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resAlerts = await api.get('/admin/alerts');
      setAlerts(resAlerts.data || []);
      
      const resVillages = await api.get('/admin/villages');
      setVillages(resVillages.data || []);
    } catch (err) {
      console.error('Failed to load alerts data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!newAlert.villageId || !newAlert.message) {
      alert('Please fill out all alert parameters.');
      return;
    }
    try {
      await api.post('/admin/alerts', {
        villageId: Number(newAlert.villageId),
        alertLevel: newAlert.alertLevel,
        message: newAlert.message
      });
      alert('Emergency Broadcast Transmitted!');
      setModalOpen(false);
      setNewAlert({ villageId: '', alertLevel: 'HIGH', message: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to transmit alert.');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await api.delete(`/admin/alerts/${id}`);
      alert('Alert resolved and archived.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to resolve alert.');
    }
  };

  const handleSendNotification = (alertItem) => {
    alert(`Alert notification broadcasted to all citizens & health workers in ${alertItem.village?.name}!`);
  };

  const getAlertStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger shadow-[inset_4px_0_0_0_#EF4444]';
      case 'HIGH':
        return 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning shadow-[inset_4px_0_0_0_#F59E0B]';
      case 'MEDIUM':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[inset_4px_0_0_0_#3B82F6]';
      default:
        return 'bg-brand-success/10 border-brand-success/30 text-brand-success shadow-[inset_4px_0_0_0_#22C55E]';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-danger/20 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-brand-danger" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Emergency Broadcasts</h1>
            <p className="text-brand-secondaryText mt-1">Transmit and manage real-time contamination and outbreak alerts.</p>
          </div>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={() => generateAlertsReport(alerts)}
            className="px-6 py-3 bg-brand-surface border border-brand-border hover:bg-brand-border text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center"
          >
            Export PDF
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-brand-danger hover:bg-red-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            <Plus className="w-4 h-4 mr-2 animate-pulse" /> Create Emergency Alert
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader className="w-8 h-8 text-brand-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            {alerts.length > 0 ? (
              alerts.map(a => (
                <div key={a.id} className={`p-5 rounded-2xl border backdrop-blur-sm transition-all hover:translate-x-1 ${getAlertStyle(a.alertLevel)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase border border-current px-2 py-0.5 rounded mr-3">
                        {a.alertLevel}
                      </span>
                      <strong className="text-white text-base">{a.village?.name}</strong>
                    </div>
                    <span className="text-xs text-brand-secondaryText font-medium">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-3 text-white/90 leading-relaxed">{a.message}</p>
                  
                  <div className="flex space-x-3 mt-4 pt-4 border-t border-brand-border/30">
                    <button 
                      onClick={() => handleResolveAlert(a.id)}
                      className="px-4 py-2 bg-brand-success/15 hover:bg-brand-success/30 text-brand-success border border-brand-success/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center transition-all"
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Resolve Alert
                    </button>
                    <button 
                      onClick={() => handleSendNotification(a)}
                      className="px-4 py-2 bg-brand-accent/15 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center transition-all"
                    >
                      <Bell className="w-4 h-4 mr-1.5" /> Send Notification
                    </button>
                    <button 
                      onClick={() => setSelectedAlert(a)}
                      className="px-4 py-2 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center transition-all"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel p-12 text-center text-brand-secondaryText flex flex-col items-center">
                <CheckCircle className="w-12 h-12 mb-3 text-brand-success" />
                <p className="text-sm uppercase tracking-widest font-black">All systems nominal. Zero active alerts.</p>
              </div>
            )}
          </div>

          {/* Details Sidebar panel */}
          <div className="space-y-6">
            <div className="glass-panel p-6 border border-brand-border h-full">
              <h3 className="text-lg font-bold text-white border-b border-brand-border/50 pb-2 mb-4 uppercase tracking-widest flex items-center">
                <Info className="w-5 h-5 mr-2 text-brand-accent" /> Alert Dossier
              </h3>
              {selectedAlert ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Village</span>
                    <h4 className="text-xl font-bold text-white">{selectedAlert.village?.name}</h4>
                    <p className="text-xs text-brand-secondaryText font-semibold uppercase">{selectedAlert.village?.district}, {selectedAlert.village?.state}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Classification</span>
                    <p className="text-sm font-bold text-white mt-1">{selectedAlert.alertLevel}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Broadcast Message</span>
                    <p className="text-sm text-brand-secondaryText mt-1.5 leading-relaxed bg-brand-background p-3 rounded-lg border border-brand-border">
                      {selectedAlert.message}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Dispatched On</span>
                    <p className="text-sm text-white mt-1">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-brand-secondaryText flex flex-col items-center">
                  <Info className="w-10 h-10 mb-3 opacity-40 text-brand-accent" />
                  <p className="text-sm uppercase tracking-widest font-bold">Select an alert node to view complete telemetry audit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE ALERT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-brand-danger" /> Create Emergency Broadcast
            </h3>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Select Affected Village</label>
                <select 
                  required
                  className="luxury-input bg-brand-background text-sm"
                  value={newAlert.villageId}
                  onChange={(e) => setNewAlert({ ...newAlert, villageId: e.target.value })}
                >
                  <option value="">-- Choose Village --</option>
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.district})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Alert Classification</label>
                <select 
                  className="luxury-input bg-brand-background text-sm"
                  value={newAlert.alertLevel}
                  onChange={(e) => setNewAlert({ ...newAlert, alertLevel: e.target.value })}
                >
                  <option value="LOW">LOW (Advisory)</option>
                  <option value="MEDIUM">MEDIUM (Caution)</option>
                  <option value="HIGH">HIGH (Outbreak Alert)</option>
                  <option value="CRITICAL">CRITICAL (Emergency)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Advisory / Warning Message</label>
                <textarea 
                  required
                  rows={4}
                  className="luxury-input text-sm"
                  placeholder="Detail water quality status, disease counts, and health instructions..."
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
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
    </motion.div>
  );
};

export default Alerts;
