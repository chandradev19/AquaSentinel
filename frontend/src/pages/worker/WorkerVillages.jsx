import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Map, Users, AlertTriangle } from 'lucide-react';

const WorkerVillages = () => {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await api.get('/worker/villages/assigned');
        if (response.data) setVillages(response.data);
      } catch (error) {
        console.error('Failed to fetch assigned villages', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVillages();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-success/20 rounded-xl">
          <Map className="w-8 h-8 text-brand-success" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Assigned Villages</h1>
          <p className="text-brand-secondaryText mt-1">Monitor health status of jurisdictions under your care.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="p-12 flex justify-center col-span-full">
            <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
          </div>
        ) : villages.length === 0 ? (
          <div className="p-12 text-center text-brand-secondaryText col-span-full">
            No villages are currently assigned to you.
          </div>
        ) : (
          villages.map(village => (
            <div key={village.id} className="glass-panel p-6 flex flex-col space-y-4 hover:border-brand-success/30 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wide">{village.name}</h3>
                  <p className="text-sm text-brand-secondaryText">{village.district}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2 text-brand-secondaryText">
                  <Users className="w-4 h-4 text-brand-accent" />
                  <span className="text-sm">Pop: {village.population || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-2 text-brand-secondaryText">
                  <AlertTriangle className="w-4 h-4 text-brand-warning" />
                  <span className="text-sm">Cases: {village.activeCases || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default WorkerVillages;
