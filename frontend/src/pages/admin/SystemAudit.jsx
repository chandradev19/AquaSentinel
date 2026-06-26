import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { FileClock, Server, Shield } from 'lucide-react';

const SystemAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit');
        if (response.data) setLogs(response.data);
      } catch (error) {
        console.error('Failed to fetch audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user && log.user.email && log.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = actionFilter ? log.action === actionFilter : true;
    return matchesSearch && matchesAction;
  });

  const actions = [...new Set(logs.map(log => log.action).filter(Boolean))];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-danger/20 rounded-xl">
            <FileClock className="w-8 h-8 text-brand-danger" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">System Audit Logs</h1>
            <p className="text-brand-secondaryText mt-1">Immutable record of all critical system events and access changes.</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search email, details..." 
            className="luxury-input text-xs !py-2.5 !px-4 sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="luxury-input text-xs !py-2.5 !px-4 bg-brand-background sm:w-48"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">-- All Actions --</option>
            {actions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left text-sm text-brand-secondaryText font-mono">
            <thead className="text-[10px] uppercase bg-brand-surface/80 text-white border-b border-brand-border/50 tracking-widest">
              <tr>
                <th scope="col" className="px-6 py-4">Timestamp</th>
                <th scope="col" className="px-6 py-4">Action</th>
                <th scope="col" className="px-6 py-4">User Details</th>
                <th scope="col" className="px-6 py-4">IP / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {filteredLogs.length > 0 ? filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-6 py-4 text-white">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-brand-accent">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3 h-3" />
                      <span>{log.user?.email || 'SYSTEM'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px]">{log.details || 'N/A'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-brand-secondaryText font-sans">
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};

export default SystemAudit;
