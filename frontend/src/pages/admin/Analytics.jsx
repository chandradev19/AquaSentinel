import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { BarChart3, FileDown, RefreshCw, Loader, ChartPie, TrendingUp, HelpCircle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

import { generateHealthAssessment } from '../../utils/ReportGenerator';

const Analytics = () => {
  const [villages, setVillages] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resVillages = await api.get('/admin/villages');
      setVillages(resVillages.data || []);
      const resReports = await api.get('/admin/reports');
      setReports(resReports.data || []);
      // Fetch detailed analytics from backend (real DB data)
      try {
        const resAnalytics = await api.get('/admin/analytics/detailed');
        setAnalytics(resAnalytics.data);
      } catch (e) {
        console.warn('Detailed analytics unavailable, using computed data', e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
    alert('Analytics engine matrices synchronized.');
  };

  const handleExportExcel = () => {
    const headers = 'Village Name,District,State,Risk Score,Water Quality,Population,Active Cases\n';
    const rows = villages.map(v => 
      `"${v.name}","${v.district}","${v.state}",${v.riskScore || 0},"${v.waterQualityStatus || 'UNKNOWN'}",${v.population || 0},${v.activeCases || 0}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'aquashield_surveillance_data.csv';
    link.click();
  };

  const handleExportPdf = () => {
    if (analytics) {
      generateHealthAssessment(analytics);
    } else {
      alert('Analytics data is still loading.');
    }
  };

  // Use real disease trends from backend, fallback to empty
  const diseaseTrendsData = analytics?.diseaseTrends || [];

  // 2. Risk Distribution Data
  const riskLow = villages.filter(v => (v.riskScore || 0) <= 30).length;
  const riskMed = villages.filter(v => (v.riskScore || 0) > 30 && (v.riskScore || 0) <= 60).length;
  const riskHigh = villages.filter(v => (v.riskScore || 0) > 60).length;
  
  const riskDistData = [
    { name: 'Low Risk', value: riskLow || 1, color: '#22C55E' },
    { name: 'Medium Risk', value: riskMed || 1, color: '#F59E0B' },
    { name: 'High Risk', value: riskHigh || 1, color: '#EF4444' }
  ];

  // 3. Water Quality Analysis per district from real village data
  const districts = [...new Set(villages.map(v => v.district || 'Other'))];
  const waterQualityData = districts.map(d => {
    const dv = villages.filter(v => (v.district || 'Other') === d);
    const avgRisk = dv.reduce((acc, v) => acc + (v.riskScore || 0), 0) / dv.length;
    const pop = dv.reduce((acc, v) => acc + (v.population || 0), 0);
    return {
      district: d,
      "Average Risk": Math.round(avgRisk),
      "Surveillance Nodes": dv.length,
      "Population (k)": Math.round(pop / 1000)
    };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-accent/20 rounded-xl">
            <BarChart3 className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">System Analytics Dashboard</h1>
            <p className="text-brand-secondaryText mt-1">Surveillance charts, forecasts, and comparative district data.</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2.5 bg-brand-surface border border-brand-border hover:bg-brand-border text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          <button 
            onClick={handleExportPdf}
            className="px-4 py-2.5 bg-brand-surface border border-brand-border hover:bg-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center"
          >
            Export PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center shadow-glow"
          >
            <FileDown className="w-4 h-4 mr-2" /> Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader className="w-8 h-8 text-brand-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Disease Trends */}
          <div className="glass-panel p-6 border border-brand-border h-[400px] flex flex-col">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-brand-accent" /> Disease Incidence Forecast
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diseaseTrendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="Cholera" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="Typhoid" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="Diarrhea" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="glass-panel p-6 border border-brand-border h-[400px] flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
              <ChartPie className="w-4 h-4 mr-2 text-brand-warning" /> Regional Risk Distribution
            </h3>
            <div className="h-60 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={riskDistData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={4} 
                    dataKey="value"
                  >
                    {riskDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[9px] text-brand-secondaryText uppercase tracking-widest font-semibold block">Total Monitored</span>
                <strong className="text-2xl font-black text-white">{villages.length} Nodes</strong>
              </div>
            </div>
            <div className="flex justify-around text-xs font-bold text-brand-secondaryText pt-4 border-t border-brand-border">
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-brand-success mr-2" /> Low</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-brand-warning mr-2" /> Medium</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-brand-danger mr-2" /> High</span>
            </div>
          </div>

          {/* Water Quality & Contamination Analysis */}
          <div className="glass-panel p-6 border border-brand-border h-[400px] flex flex-col lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">District Risk Comparison</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterQualityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="district" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Average Risk" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Surveillance Nodes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Population (k)" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
};

export default Analytics;
