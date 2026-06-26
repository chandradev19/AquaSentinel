import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmergencyOverlay = () => {
  const { emergencyAlert, updateStatus } = useNotifications();
  const { user } = useAuth();

  if (!emergencyAlert) return null;

  const handleAcknowledge = () => {
    updateStatus(emergencyAlert.id, 'ACKNOWLEDGED');
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pointer-events-none"
      >
        {/* Flashing Red Background Overlay */}
        <motion.div 
          className="absolute inset-0 bg-brand-danger/10 pointer-events-none"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Alert Banner */}
        <motion.div 
          initial={{ y: -100, scale: 0.9 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: -100, scale: 0.9 }}
          className="mt-8 bg-brand-danger/90 backdrop-blur-xl border-2 border-red-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.5)] w-full max-w-2xl flex flex-col md:flex-row items-center gap-6 pointer-events-auto"
        >
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black uppercase tracking-widest">
                {emergencyAlert.notificationType || 'CRITICAL ALERT'}
              </span>
              <span className="text-xs font-bold text-white/80">
                {emergencyAlert.villageName}
              </span>
            </div>
            <h2 className="text-2xl font-black mb-2 leading-tight">
              {emergencyAlert.title}
            </h2>
            <p className="text-sm text-white/90 font-medium">
              {emergencyAlert.message}
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[140px]">
            {user?.role !== 'CITIZEN' && (
              <button 
                onClick={handleAcknowledge}
                className="w-full bg-white text-brand-danger font-black py-2.5 px-4 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                ACKNOWLEDGE
              </button>
            )}
            <div className="text-center">
              <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
                Generated
              </span>
              <div className="text-xs font-mono font-bold text-white">
                {new Date(emergencyAlert.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmergencyOverlay;
