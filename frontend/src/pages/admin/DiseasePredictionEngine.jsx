import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { ShieldAlert, Activity, MapPin, Users, Droplet, ArrowRight, Shield, RefreshCw } from 'lucide-react';

const DiseasePredictionEngine = () => {
  const { data: predictions = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['diseasePredictions'],
    queryFn: async () => {
      const res = await api.get('/admin/predictions');
      return res.data;
    }
  });

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'border-brand-danger bg-brand-danger/10 text-brand-danger shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'HIGH': return 'border-brand-warning bg-brand-warning/10 text-brand-warning shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      case 'MODERATE': return 'border-brand-accent bg-brand-accent/10 text-brand-accent shadow-[0_0_15px_rgba(59,130,246,0.2)]';
      default: return 'border-brand-success bg-brand-success/10 text-brand-success';
    }
  };

  const getCardStyle = (prob) => {
    if (prob > 75) return 'from-brand-danger/20 to-transparent border-brand-danger/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]';
    if (prob > 50) return 'from-brand-warning/20 to-transparent border-brand-warning/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]';
    if (prob > 25) return 'from-brand-accent/20 to-transparent border-brand-accent/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]';
    return 'from-brand-success/10 to-transparent border-brand-success/30';
  };

  const handleRetrain = async () => {
    try {
      await api.post('/admin/ai/retrain');
      alert('ML Models retrained successfully with latest dataset.');
      refetch();
    } catch (e) {
      alert('Failed to retrain models.');
    }
  };

  const handleRunPrediction = async () => {
    try {
      await api.post('/admin/ai/run-prediction');
      alert('Prediction Cycle executed successfully across all nodes.');
      refetch();
    } catch (e) {
      alert('Failed to execute predictions.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-brand-border/40 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-8 h-8 text-brand-accent animate-pulse" />
            AI Disease Prediction Engine
          </h2>
          <p className="text-brand-secondaryText mt-1 uppercase tracking-widest text-xs font-semibold">
            Machine Learning Epidemic Forecasting
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRetrain}
            className="px-5 py-2.5 bg-brand-surface border border-brand-border hover:border-brand-accent text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Train Model
          </button>
          <button 
            onClick={handleRunPrediction}
            className="px-5 py-2.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all shadow-glow flex items-center"
          >
            <ShieldAlert className="w-4 h-4 mr-2" /> Run Projections
          </button>
        </div>
      </div>

      {isLoading || isRefetching ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {predictions.map(pred => {
            const prob = pred.outbreakProbability || 0;
            const disease = pred.predictedDisease || 'Unknown';
            // Skip "None" if we only want active threats, but we can show all. Let's show all that have a disease.
            if (disease === 'None' || disease === 'Unknown') return null;

            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={pred.id} 
                className={`luxury-card relative overflow-hidden border bg-gradient-to-br bg-brand-background ${getCardStyle(prob)}`}
              >
                <div className="p-6 relative z-10 flex flex-col h-full">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getRiskColor(pred.riskLevel)}`}>
                        {pred.riskLevel || 'UNKNOWN RISK'}
                      </span>
                      <h3 className="text-2xl font-black text-white tracking-tight mt-2 uppercase">{disease}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-brand-secondaryText tracking-wider block">Prediction %</span>
                      <span className={`text-2xl font-black ${prob > 75 ? 'text-brand-danger' : prob > 50 ? 'text-brand-warning' : 'text-brand-accent'}`}>
                        {prob.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Village Context */}
                  <div className="flex items-center space-x-2 text-brand-secondaryText mb-6 pb-4 border-b border-brand-border/40">
                    <MapPin className="w-4 h-4 text-brand-accent flex-shrink-0" />
                    <span className="text-sm font-bold text-white truncate">{pred.village?.name}</span>
                    <span className="text-xs uppercase tracking-wider">({pred.village?.district})</span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-brand-secondaryText tracking-wider flex items-center mb-1">
                        <Activity className="w-3 h-3 mr-1" /> Confidence
                      </span>
                      <div className="w-full bg-brand-surface rounded-full h-1.5 mb-1 overflow-hidden">
                        <div className="bg-brand-accent h-1.5 rounded-full" style={{ width: `${pred.confidence || 0}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-white">{(pred.confidence || 0).toFixed(1)}% ML Confidence</span>
                    </div>
                    
                    <div>
                      <span className="text-[9px] uppercase font-bold text-brand-secondaryText tracking-wider flex items-center mb-1">
                        <Droplet className="w-3 h-3 mr-1" /> Spread Radius
                      </span>
                      <span className="text-lg font-black text-white block">{(pred.expectedSpreadRadius || 0).toFixed(1)} <span className="text-xs text-brand-secondaryText">km</span></span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-brand-secondaryText tracking-wider flex items-center mb-1">
                        <Users className="w-3 h-3 mr-1" /> Exp. Cases (3d)
                      </span>
                      <span className="text-lg font-black text-white">{pred.expectedCases3Days || 0}</span>
                    </div>
                    
                    <div>
                      <span className="text-[9px] uppercase font-bold text-brand-secondaryText tracking-wider flex items-center mb-1">
                        <Users className="w-3 h-3 mr-1" /> Exp. Cases (7d)
                      </span>
                      <span className="text-lg font-black text-white">{pred.expectedCases7Days || 0}</span>
                    </div>
                  </div>

                  {/* Recommendation Action - Pushed to bottom */}
                  <div className="mt-auto pt-4 border-t border-brand-border/40">
                    <span className="text-[9px] uppercase font-black text-brand-secondaryText tracking-widest block mb-2 flex items-center">
                      <Shield className="w-3 h-3 mr-1" /> Recommended Action
                    </span>
                    <p className="text-xs font-semibold text-brand-secondaryText leading-relaxed">
                      {pred.recommendedAction || 'Await further AI analysis cycles before mobilizing field units.'}
                    </p>
                  </div>

                </div>
              </motion.div>
            );
          })}
          
          {predictions.filter(p => p.predictedDisease && p.predictedDisease !== 'None' && p.predictedDisease !== 'Unknown').length === 0 && (
             <div className="col-span-full py-20 text-center border border-dashed border-brand-border rounded-2xl">
               <ShieldAlert className="w-12 h-12 text-brand-secondaryText mx-auto mb-4 opacity-50" />
               <h3 className="text-lg font-bold text-white uppercase tracking-widest">No Outbreak Threats Detected</h3>
               <p className="text-brand-secondaryText text-sm mt-2">All regions are currently operating under baseline health parameters.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiseasePredictionEngine;
