import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Map, Droplets, Activity, Users } from 'lucide-react';

const VillageHealth = () => {
  const [village, setVillage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVillage = async () => {
      try {
        const response = await api.get('/citizen/village');
        if (response.data) {
          setVillage(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch village data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVillage();
  }, []);

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" /></div>;
  }

  if (!village) {
    return <div className="p-12 text-center text-white">No village data available.</div>;
  }

  const riskScore = village.riskScore || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-accent/20 rounded-xl">
          <Map className="w-8 h-8 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{village.name} Health Status</h1>
          <p className="text-brand-secondaryText mt-1">Real-time health and environmental metrics for your area.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className={`p-4 rounded-full ${riskScore > 70 ? 'bg-brand-danger/20 text-brand-danger' : riskScore > 40 ? 'bg-brand-warning/20 text-brand-warning' : 'bg-brand-success/20 text-brand-success'}`}>
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-secondaryText uppercase tracking-wider">Overall Risk Score</p>
            <p className="text-4xl font-bold text-white">{riskScore.toFixed(1)}<span className="text-xl text-brand-secondaryText">/100</span></p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-blue-500/20 text-blue-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-secondaryText uppercase tracking-wider">Active Cases</p>
            <p className="text-4xl font-bold text-white">{village.activeCases || 0}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-cyan-500/20 text-cyan-400">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-secondaryText uppercase tracking-wider">Water Quality Status</p>
            <p className="text-2xl font-bold text-white mt-1">{village.waterQualityStatus || 'UNKNOWN'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VillageHealth;
