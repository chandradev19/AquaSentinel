import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle, Edit3, Save, X, Activity } from 'lucide-react';

const WORKFLOW_STEPS = [
  'Submitted', 'Assigned', 'Under Verification', 'Sample Collected', 'Verified', 'AI Analysis Running', 'Closed'
];

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingReport, setEditingReport] = useState(null);

  const fetchReports = async () => {
    try {
      const response = await api.get('/citizen/reports');
      if (response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusIndex = (status) => {
    const idx = WORKFLOW_STEPS.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified': case 'Closed': return <CheckCircle className="w-5 h-5 text-brand-success" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-brand-danger" />;
      case 'AI Analysis Running': return <Activity className="w-5 h-5 text-brand-accent animate-pulse" />;
      default: return <Clock className="w-5 h-5 text-brand-warning" />;
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/citizen/symptoms/${editingReport.id}`, editingReport);
      setEditingReport(null);
      fetchReports();
    } catch (err) {
      alert('Failed to update report.');
    }
  };

  const filteredReports = reports.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const filterOptions = ['ALL', 'Submitted', 'Assigned', 'Under Verification', 'Verified', 'Closed'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-accent/20 rounded-xl">
            <MapPin className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Report Status Tracker</h1>
            <p className="text-brand-secondaryText mt-1">Track your symptom and water quality reports live.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filterOptions.map(opt => (
          <button
            key={opt}
            onClick={() => setStatusFilter(opt)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              statusFilter === opt 
                ? 'bg-brand-accent border-brand-accent text-white shadow-glow' 
                : 'bg-brand-surface border-brand-border text-brand-secondaryText hover:text-white hover:border-brand-border/80'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="glass-panel p-12 text-center text-brand-secondaryText">
            No reports found matching {statusFilter}.
          </div>
        ) : (
          filteredReports.map((report) => {
            const currentIndex = getStatusIndex(report.status);
            
            return (
              <div key={report.id} className="glass-panel overflow-hidden border border-brand-border hover:border-brand-accent/30 transition-all p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl font-bold text-white">{report.reportId || 'RPT-LEGACY'}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                        report.status === 'Closed' ? 'bg-brand-success/20 text-brand-success border-brand-success/50' :
                        report.status === 'REJECTED' ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/50' :
                        'bg-brand-warning/20 text-brand-warning border-brand-warning/50'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-brand-secondaryText mb-1">
                      Submitted: {new Date(report.reportDate).toLocaleString()}
                    </p>
                    <p className="text-white font-medium max-w-2xl">{report.symptoms}</p>
                    {report.waterQualityComplaint && <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] uppercase font-bold mr-2">Water Quality Issue</span>}
                    {report.deadAnimalReport && <span className="inline-block mt-2 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] uppercase font-bold mr-2">Dead Animal Sighted</span>}
                  </div>
                  
                  {/* Edit button allowed only if Submitted or Assigned */}
                  {(report.status === 'Submitted' || report.status === 'Assigned') && (
                    <button 
                      onClick={() => setEditingReport({...report})}
                      className="px-4 py-2 border border-brand-border bg-brand-surface hover:bg-brand-border rounded-lg text-xs font-bold text-white uppercase tracking-wider flex items-center transition-all"
                    >
                      <Edit3 className="w-4 h-4 mr-2 text-brand-accent" /> Edit Details
                    </button>
                  )}
                </div>

                {/* Courier Style Progress Tracker */}
                <div className="relative pt-8 pb-4">
                  <div className="absolute top-10 left-0 w-full h-1 bg-brand-border rounded-full -z-10 hidden sm:block"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 relative">
                    {WORKFLOW_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentIndex;
                      const isCurrent = idx === currentIndex;
                      return (
                        <div key={step} className="flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-2 w-full sm:w-auto relative">
                          {/* Desktop connector line for active */}
                          {idx > 0 && isCompleted && (
                            <div className="hidden sm:block absolute top-2 right-[50%] w-[100%] h-1 bg-brand-accent -z-10" style={{ transform: 'translateX(-50%)' }}></div>
                          )}
                          
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                            isCurrent ? 'bg-brand-background border-brand-accent shadow-[0_0_15px_rgba(33,150,243,0.5)]' :
                            isCompleted ? 'bg-brand-accent border-brand-accent' : 
                            'bg-brand-surface border-brand-border'
                          }`}>
                            {isCompleted && !isCurrent && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                            {isCurrent && <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />}
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center ${
                            isCurrent ? 'text-brand-accent' :
                            isCompleted ? 'text-white' : 
                            'text-brand-secondaryText'
                          }`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-brand-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Edit Report: {editingReport.reportId}</h2>
                <button onClick={() => setEditingReport(null)} className="text-brand-secondaryText hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Symptoms</label>
                  <input 
                    type="text" className="luxury-input text-sm" required
                    value={editingReport.symptoms || ''}
                    onChange={(e) => setEditingReport({...editingReport, symptoms: e.target.value})}
                  />
                  <p className="text-[10px] text-brand-secondaryText mt-1">Comma separated list (e.g., Fever, Cough)</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Severity</label>
                    <select 
                      className="luxury-input text-sm bg-brand-background"
                      value={editingReport.severity || 'MEDIUM'}
                      onChange={(e) => setEditingReport({...editingReport, severity: e.target.value})}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Affected Family Members</label>
                    <input 
                      type="number" className="luxury-input text-sm" min="0"
                      value={editingReport.affectedFamilyMembers || 0}
                      onChange={(e) => setEditingReport({...editingReport, affectedFamilyMembers: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 text-sm text-white">
                    <input 
                      type="checkbox" 
                      checked={editingReport.waterQualityComplaint || false}
                      onChange={(e) => setEditingReport({...editingReport, waterQualityComplaint: e.target.checked})}
                      className="rounded border-brand-border text-brand-accent bg-brand-background"
                    />
                    <span>Water Quality Complaint</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-white">
                    <input 
                      type="checkbox" 
                      checked={editingReport.deadAnimalReport || false}
                      onChange={(e) => setEditingReport({...editingReport, deadAnimalReport: e.target.checked})}
                      className="rounded border-brand-border text-brand-accent bg-brand-background"
                    />
                    <span>Dead Animal Sighted</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Additional Remarks</label>
                  <textarea 
                    className="luxury-input text-sm" rows={3}
                    value={editingReport.remarks || ''}
                    onChange={(e) => setEditingReport({...editingReport, remarks: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-brand-border/50">
                  <button type="button" onClick={() => setEditingReport(null)} className="px-4 py-2 border border-brand-border rounded-lg text-xs font-bold text-brand-secondaryText uppercase">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-brand-accent text-white rounded-lg text-xs font-black uppercase flex items-center shadow-glow">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyReports;
