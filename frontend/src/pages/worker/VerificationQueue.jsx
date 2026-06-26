import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { ShieldAlert, Check, X, MapPin } from 'lucide-react';

const VerificationQueue = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPending = async () => {
    try {
      const response = await api.get('/worker/reports/pending');
      if (response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/worker/reports/${id}/verify`);
      fetchPending();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/worker/reports/${id}/reject`);
      fetchPending();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-warning/20 rounded-xl">
          <ShieldAlert className="w-8 h-8 text-brand-warning" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Verification Queue</h1>
          <p className="text-brand-secondaryText mt-1">Review and verify citizen symptom reports from your assigned villages.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-brand-secondaryText">
            No pending reports require verification at this time.
          </div>
        ) : (
          <div className="divide-y divide-brand-border/50">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-brand-surface/50 transition-colors flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-brand-accent" />
                    <span className="text-sm font-medium text-brand-secondaryText uppercase tracking-wider">
                      {report.village?.name || `Village #${report.village?.id}`} — Severity: <span className={`font-bold ${report.severity === 'HIGH' ? 'text-brand-danger' : report.severity === 'MEDIUM' ? 'text-brand-warning' : 'text-brand-success'}`}>{report.severity || 'N/A'}</span>
                    </span>
                  </div>
                  <p className="text-white font-medium text-lg">"{report.symptoms}"</p>
                  <p className="text-sm text-brand-secondaryText">
                    Submitted: {new Date(report.reportDate).toLocaleDateString()} at {new Date(report.reportDate).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => handleReject(report.id)}
                    disabled={actionLoading === report.id}
                    className="flex items-center px-4 py-2 bg-brand-danger/10 text-brand-danger rounded-xl font-bold tracking-wider hover:bg-brand-danger/20 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    REJECT
                  </button>
                  <button
                    onClick={() => handleVerify(report.id)}
                    disabled={actionLoading === report.id}
                    className="flex items-center px-4 py-2 bg-brand-success/10 text-brand-success rounded-xl font-bold tracking-wider hover:bg-brand-success/20 transition-colors"
                  >
                    {actionLoading === report.id ? (
                      <div className="w-4 h-4 mr-2 border-2 border-brand-success/30 border-t-brand-success rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    VERIFY
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VerificationQueue;
