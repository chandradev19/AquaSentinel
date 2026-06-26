import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { MapPin, FileDown, Search, Filter, Check, X, ShieldAlert, Eye, Loader, Clipboard } from 'lucide-react';

const AllReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports');
      if (response.data) setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return 'bg-brand-success/20 text-brand-success border-brand-success/50';
      case 'REJECTED': return 'bg-brand-danger/20 text-brand-danger border-brand-danger/50';
      default: return 'bg-brand-warning/20 text-brand-warning border-brand-warning/50';
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.post(`/worker/reports/${id}/verify`);
      alert('Symptom report verified. Risk matrices recalculated.');
      fetchReports();
      if (selectedReport && selectedReport.id === id) setViewOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to verify report.');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/worker/reports/${id}/reject`);
      alert('Symptom report marked as invalid.');
      fetchReports();
      if (selectedReport && selectedReport.id === id) setViewOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to reject report.');
    }
  };

  const handleEscalate = async (report) => {
    try {
      await api.post('/admin/alerts', {
        villageId: report.village.id,
        alertLevel: 'CRITICAL',
        message: `ESC-BROADCAST: Disease symptom clusters reported in ${report.village.name}. Symptoms: ${report.symptoms}. Immediate sanitation review advised.`
      });
      alert(`Critical Advisory transmitted for ${report.village.name}!`);
      fetchReports();
      if (selectedReport && selectedReport.id === report.id) setViewOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to escalate report.');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'ALL' || report.status === filterStatus;
    const matchesSearch = report.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          report.village.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (report.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ['Report ID,Citizen Name,Village Name,District,Symptoms,Status,Report Date,Verified By'];
    const rows = filteredReports.map(r => 
      `${r.id},"${r.user?.name || 'Citizen'}","${r.village.name}","${r.village.district}","${r.symptoms}",${r.status},${new Date(r.reportDate).toLocaleString()},${r.verifiedBy?.name || 'N/A'}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aquashield_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-accent/20 rounded-xl">
            <Clipboard className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Citizen Reports Management</h1>
            <p className="text-brand-secondaryText mt-1">Review, verify, reject, or escalate outbreak alerts from citizen nodes.</p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="luxury-button flex items-center px-6 py-3 font-bold"
        >
          <FileDown className="w-5 h-5 mr-2" />
          EXPORT CSV
        </button>
      </div>

      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-secondaryText" />
          <input
            type="text"
            placeholder="Search symptoms, citizen name or village..."
            className="luxury-input w-full pl-10 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-secondaryText" />
          <select
            className="luxury-input w-full pl-10 text-sm bg-brand-background"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader className="w-8 h-8 text-brand-accent animate-spin" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-brand-secondaryText">
            No health reports logged.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-brand-secondaryText">
            <thead className="text-xs uppercase bg-brand-surface/80 text-white border-b border-brand-border/50">
              <tr>
                <th scope="col" className="px-6 py-4 tracking-widest">Report ID</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Citizen</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Village</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Symptoms</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Date</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Status</th>
                <th scope="col" className="px-6 py-4 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {filteredReports.map(report => (
                <tr key={report.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-brand-accent">REP-{report.id}</td>
                  <td className="px-6 py-4 font-semibold text-white">{report.user?.name || 'Citizen User'}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{report.village.name}</p>
                    <p className="text-[10px] uppercase text-brand-secondaryText">{report.village.district}</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-white">{report.symptoms}</td>
                  <td className="px-6 py-4 font-mono text-xs">{new Date(report.reportDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black tracking-wider border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedReport(report);
                        setViewOpen(true);
                      }}
                      className="p-2 bg-brand-surface border border-brand-border hover:border-brand-accent hover:text-white text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {report.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleVerify(report.id)}
                          className="p-2 bg-brand-success/10 border border-brand-success/20 hover:bg-brand-success/30 text-brand-success rounded-lg transition-all inline-flex items-center"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleReject(report.id)}
                          className="p-2 bg-brand-danger/10 border border-brand-danger/20 hover:bg-brand-danger/30 text-brand-danger rounded-lg transition-all inline-flex items-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEscalate(report)}
                          className="p-2 bg-brand-warning/10 border border-brand-warning/20 hover:bg-brand-warning/30 text-brand-warning rounded-lg transition-all inline-flex items-center"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* VIEW DETAILS DIALOG MODAL */}
      {viewOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-lg w-full p-8 border border-brand-border space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-brand-border/50 pb-2 uppercase tracking-wider">
              Symptom Report Dossier: REP-{selectedReport.id}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Reporter</span>
                  <p className="text-sm font-bold text-white mt-1">{selectedReport.user?.name || 'Citizen User'}</p>
                  <p className="text-xs text-brand-secondaryText mt-0.5">{selectedReport.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Village</span>
                  <p className="text-sm font-bold text-white mt-1">{selectedReport.village.name}</p>
                  <p className="text-xs text-brand-secondaryText mt-0.5">{selectedReport.village.district}, {selectedReport.village.state}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Logged Symptoms</span>
                <p className="text-sm text-white mt-1.5 leading-relaxed bg-brand-background p-3 rounded-lg border border-brand-border">
                  {selectedReport.symptoms}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Status</span>
                  <p className="mt-1"><span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Reported On</span>
                  <p className="text-sm text-white mt-1 font-mono">{new Date(selectedReport.reportDate).toLocaleString()}</p>
                </div>
              </div>

              {selectedReport.verifiedBy && (
                <div className="p-3 bg-brand-success/5 border border-brand-success/10 rounded-lg">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-success">Verification Audit</span>
                  <p className="text-xs text-white mt-1 font-medium">Verified by: {selectedReport.verifiedBy.name} ({selectedReport.verifiedBy.email})</p>
                  <p className="text-[10px] text-brand-secondaryText mt-0.5 font-mono">Date: {new Date(selectedReport.verifiedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t border-brand-border/50">
              <button 
                type="button" 
                onClick={() => setViewOpen(false)}
                className="flex-1 py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Close
              </button>
              {selectedReport.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => handleReject(selectedReport.id)}
                    className="py-3 px-4 bg-brand-danger/20 hover:bg-brand-danger/40 border border-brand-danger/30 text-brand-danger rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleVerify(selectedReport.id)}
                    className="py-3 px-4 bg-brand-success/20 hover:bg-brand-success/40 border border-brand-success/30 text-brand-success rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Verify
                  </button>
                  <button 
                    onClick={() => handleEscalate(selectedReport)}
                    className="py-3 px-4 bg-brand-warning/20 hover:bg-brand-warning/40 border border-brand-warning/30 text-brand-warning rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Escalate
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AllReports;
