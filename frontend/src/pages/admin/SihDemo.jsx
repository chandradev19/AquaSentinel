import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { Zap, Play, RotateCcw, ShieldAlert, CheckCircle2, RefreshCw, Activity, Users, Droplet, Radio } from 'lucide-react';

const SihDemo = () => {
  const navigate = useNavigate();
  const [demoState, setDemoState] = useState('IDLE'); // IDLE, RUNNING, FINISHED
  const [currentStep, setCurrentStep] = useState(-1);
  const [villageId, setVillageId] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const steps = [
    { icon: <Users className="w-6 h-6" />, title: "Citizen Reporting", desc: "Citizen submits severe Cholera symptoms with photo evidence." },
    { icon: <Droplet className="w-6 h-6" />, title: "Field Worker Verification", desc: "Agent verifies cases and tests water (94.5% Contamination)." },
    { icon: <Activity className="w-6 h-6" />, title: "AI Core Analysis", desc: "Neural networks recalculate risk scores based on vectors." },
    { icon: <ShieldAlert className="w-6 h-6" />, title: "Command Center Alert", desc: "Critical threshold breached. Emergency Action Plan generated." },
    { icon: <Radio className="w-6 h-6" />, title: "System Broadcast", desc: "Real-time notifications sent to DHO, Workers, and Citizens." }
  ];

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/demo/start');
      return res.data;
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/demo/reset');
      return res.data;
    }
  });

  const launchDemo = async () => {
    setDemoState('RUNNING');
    setCurrentStep(0);

    // Call backend API simultaneously while UI animates
    startMutation.mutateAsync().then(data => {
      setVillageId(data.villageId);
    }).catch(err => {
      console.error(err);
      alert("Backend error during demo generation.");
      setDemoState('IDLE');
    });

    // Animate through steps (30 seconds total = 6 seconds per step)
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, 5500));
    }

    setDemoState('FINISHED');
    // Wait 2 seconds then redirect to Dashboard
    await new Promise(r => setTimeout(r, 2000));
    // Check if villageId is set (backend responded in time)
    startMutation.data?.villageId && navigate(`/admin/village-intelligence/${startMutation.data.villageId}`);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetMutation.mutateAsync();
      alert("Demo sandbox purged successfully!");
      setDemoState('IDLE');
      setCurrentStep(-1);
      setVillageId(null);
    } catch (e) {
      alert("Error resetting demo.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      
      {/* Header */}
      <div className="text-center pb-8 border-b border-brand-border/40">
        <div className="inline-flex items-center justify-center p-4 bg-brand-accent/10 rounded-full mb-6 ring-4 ring-brand-accent/20">
          <Zap className="w-12 h-12 text-brand-accent animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-4">
          Smart India Hackathon
          <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Grand Finale Demo</span>
        </h1>
        <p className="text-brand-secondaryText font-semibold max-w-2xl mx-auto uppercase tracking-widest text-xs">
          Automated End-to-End Orchestration of the AquaSentinel Pipeline
        </p>
      </div>

      {demoState === 'IDLE' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8 mt-12">
          <p className="text-brand-secondaryText mb-8 max-w-lg mx-auto">
            Clicking the button below will instantly spin up a secure sandbox village and orchestrate a full-scale Cholera outbreak simulation across all integrated agent subsystems.
          </p>
          <button
            onClick={launchDemo}
            className="group relative inline-flex items-center justify-center px-12 py-6 text-lg font-black uppercase tracking-[0.3em] text-white bg-brand-accent rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Play className="w-8 h-8 mr-4 relative z-10" />
            <span className="relative z-10">Start SIH Demo</span>
          </button>

          <div className="pt-16">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-brand-danger hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {isResetting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Reset System & Purge Demo Data
            </button>
          </div>
        </motion.div>
      )}

      {demoState === 'RUNNING' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="luxury-card p-8 md:p-12 relative overflow-hidden">
          {/* Animated Background Pulse */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-accent/5 rounded-full blur-[100px] animate-pulse" />
          
          <div className="relative z-10 space-y-8">
            <h3 className="text-xl font-black text-center text-white uppercase tracking-widest mb-12">
              Executing Live Outbreak Scenario...
            </h3>

            <div className="space-y-6 max-w-2xl mx-auto">
              {steps.map((step, idx) => {
                const isActive = currentStep === idx;
                const isPast = currentStep > idx;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isActive || isPast ? 1 : 0.3, x: 0 }}
                    className={`flex items-start p-4 rounded-xl border transition-all duration-500 ${
                      isActive 
                        ? 'bg-brand-accent/20 border-brand-accent shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-[1.02]' 
                        : isPast 
                          ? 'bg-brand-success/10 border-brand-success text-brand-success' 
                          : 'border-brand-border/30 text-brand-secondaryText'
                    }`}
                  >
                    <div className="shrink-0 mt-1 mr-4">
                      {isPast ? <CheckCircle2 className="w-6 h-6 text-brand-success" /> : isActive ? <RefreshCw className="w-6 h-6 text-brand-accent animate-spin" /> : step.icon}
                    </div>
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-wider mb-1 ${isActive ? 'text-white' : ''}`}>
                        {step.title}
                      </h4>
                      <p className={`text-xs font-semibold ${isActive ? 'text-brand-accent/80' : 'opacity-70'}`}>
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {demoState === 'FINISHED' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12">
          <div className="w-24 h-24 bg-brand-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-brand-success" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Orchestration Complete</h2>
          <p className="text-brand-secondaryText uppercase font-bold tracking-widest text-xs animate-pulse">
            Redirecting to War Room Dashboard...
          </p>
        </motion.div>
      )}

    </div>
  );
};

export default SihDemo;
