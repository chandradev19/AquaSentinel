import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { 
  Activity, Settings, ShieldAlert, 
  Droplet, CloudRain, Users, Calendar, MapPin, 
  Play, RefreshCw, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';

const OutbreakSimulator = () => {
  const navigate = useNavigate();
  const [disease, setDisease] = useState('Cholera');
  const [villageId, setVillageId] = useState('');
  const [cases, setCases] = useState(50);
  const [rainfall, setRainfall] = useState(120);
  const [waterQuality, setWaterQuality] = useState(85); // Contamination %
  const [population, setPopulation] = useState(2500);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [simulationStatus, setSimulationStatus] = useState('IDLE'); // IDLE, RUNNING, SUCCESS
  const [simStep, setSimStep] = useState(0);

  const { data: villages = [], isLoading: isVillagesLoading } = useQuery({
    queryKey: ['villagesList'],
    queryFn: async () => {
      const res = await api.get('/admin/villages');
      return res.data;
    }
  });

  useEffect(() => {
    if (villages.length > 0 && !villageId) {
      setVillageId(villages[0].id.toString());
      if (villages[0].population) setPopulation(villages[0].population);
    }
  }, [villages]);

  const simulateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/admin/ai/simulate-smart', payload);
      return res.data;
    }
  });

  const launchSimulation = async () => {
    setSimulationStatus('RUNNING');
    setSimStep(0);
    
    // Fake the UI steps for dramatic effect before actually hitting API
    const steps = [
      "Injecting Synthetic Outbreak Data...",
      "Calibrating Water Contamination & Weather Variables...",
      "Triggering AI Agent Coordinator...",
      "Calculating Epidemiological Spread Radius...",
      "Broadcasting Emergency Alerts to Workers & Citizens..."
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setSimStep(i);
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      await simulateMutation.mutateAsync({
        villageId,
        disease,
        cases,
        rainfall,
        waterQuality,
        population,
        date
      });
      setSimStep(steps.length);
      setSimulationStatus('SUCCESS');
    } catch (e) {
      alert("Simulation Failed: " + (e.response?.data?.message || e.message));
      setSimulationStatus('IDLE');
    }
  };

  const stepsList = [
    "Injecting Synthetic Outbreak Data",
    "Calibrating Water Contamination & Weather Variables",
    "Triggering AI Agent Coordinator",
    "Calculating Epidemiological Spread Radius",
    "Broadcasting Emergency Alerts to Workers & Citizens",
    "Simulation Complete"
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-brand-border/40 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-8 h-8 text-brand-accent animate-pulse" />
            Smart Outbreak Simulator
          </h2>
          <p className="text-brand-secondaryText mt-1 uppercase tracking-widest text-xs font-semibold">
            Live Database Injection & AI Response Testing
          </p>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border/40 p-4 rounded-xl mb-6">
        <p className="text-xs text-brand-secondaryText uppercase tracking-widest font-bold flex items-center">
          <ShieldAlert className="w-4 h-4 text-brand-warning mr-2" />
          Warning: This simulator injects live data records into the database to test the real AI response pipeline.
        </p>
      </div>

      {simulationStatus === 'IDLE' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="luxury-card border border-brand-border/50 p-6 md:p-8 space-y-8">
          
          <div className="flex items-center space-x-2 pb-4 border-b border-brand-border/40">
            <Settings className="w-5 h-5 text-brand-accent" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Configure Simulation Vector</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-brand-secondaryText mb-2 uppercase tracking-wider">
                  Target Pathogen
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Cholera', 'Typhoid', 'Diarrhea', 'Hepatitis A'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDisease(d)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
                        disease === d 
                          ? 'bg-brand-accent text-white border-brand-accent shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                          : 'bg-brand-background text-brand-secondaryText border-brand-border hover:border-brand-accent/50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-secondaryText mb-2 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3 h-3 mr-1" /> Ground Zero (Village)
                </label>
                <select
                  className="luxury-input appearance-none bg-brand-background"
                  value={villageId}
                  onChange={e => {
                    setVillageId(e.target.value);
                    const v = villages.find(x => x.id.toString() === e.target.value);
                    if (v && v.population) setPopulation(v.population);
                  }}
                >
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.district})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-secondaryText mb-2 uppercase tracking-wider flex items-center">
                  <Calendar className="w-3 h-3 mr-1" /> Incident Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="luxury-input appearance-none bg-brand-background"
                />
              </div>
            </div>

            <div className="space-y-6">
              
              <div>
                <div className="flex justify-between text-[10px] font-black text-brand-secondaryText mb-2 uppercase tracking-wider">
                  <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> Initial Cases ({cases})</span>
                </div>
                <input
                  type="range"
                  min="1" max="200" step="1"
                  value={cases}
                  onChange={e => setCases(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-brand-background rounded-lg appearance-none cursor-pointer accent-brand-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black text-brand-secondaryText mb-2 uppercase tracking-wider">
                  <span className="flex items-center"><Droplet className="w-3 h-3 mr-1" /> Contamination Level ({waterQuality}%)</span>
                </div>
                <input
                  type="range"
                  min="0" max="100" step="1"
                  value={waterQuality}
                  onChange={e => setWaterQuality(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-brand-background rounded-lg appearance-none cursor-pointer accent-brand-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black text-brand-secondaryText mb-2 uppercase tracking-wider">
                  <span className="flex items-center"><CloudRain className="w-3 h-3 mr-1" /> Rainfall ({rainfall} mm)</span>
                </div>
                <input
                  type="range"
                  min="0" max="400" step="1"
                  value={rainfall}
                  onChange={e => setRainfall(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-brand-background rounded-lg appearance-none cursor-pointer accent-brand-accent"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-[10px] font-black text-brand-secondaryText mb-2 uppercase tracking-wider">
                  <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> Target Population ({population})</span>
                </div>
                <input
                  type="range"
                  min="500" max="20000" step="100"
                  value={population}
                  onChange={e => setPopulation(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-brand-background rounded-lg appearance-none cursor-pointer accent-brand-accent"
                />
              </div>

            </div>

          </div>

          <div className="pt-6 border-t border-brand-border/40">
            <button
              onClick={launchSimulation}
              disabled={isVillagesLoading || !villageId}
              className="w-full py-4 bg-brand-danger hover:bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
            >
              <Play className="w-5 h-5 mr-3" /> Execute Live Scenario
            </button>
          </div>

        </motion.div>
      )}

      {simulationStatus === 'RUNNING' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="luxury-card p-10 flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="w-16 h-16 text-brand-accent animate-spin mb-8" />
          <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 text-center">Processing AI Multi-Agent Pipeline</h3>
          
          <div className="w-full max-w-md space-y-4">
            {stepsList.map((step, idx) => {
              const isActive = simStep === idx;
              const isPast = simStep > idx;
              return (
                <div key={idx} className={`flex items-center p-3 rounded-lg border transition-all ${isActive ? 'bg-brand-accent/10 border-brand-accent text-white' : isPast ? 'bg-brand-success/10 border-brand-success text-brand-success' : 'border-brand-border/30 text-brand-secondaryText opacity-50'}`}>
                  {isPast ? <CheckCircle2 className="w-5 h-5 mr-3" /> : isActive ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <div className="w-5 h-5 mr-3 border-2 border-brand-secondaryText/50 rounded-full" />}
                  <span className="text-xs font-bold uppercase tracking-wider">{step}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {simulationStatus === 'SUCCESS' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card p-10 text-center border-brand-success shadow-[0_0_30px_rgba(34,197,94,0.15)]">
          <div className="w-24 h-24 bg-brand-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-brand-success" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Scenario Deployed Successfully</h3>
          <p className="text-brand-secondaryText font-semibold text-sm max-w-md mx-auto mb-8">
            The {disease} outbreak data was injected. The AI Agents have calculated risk, predicted spread, and broadcasted alerts to Field Workers and Citizens.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => navigate(`/admin/village-intelligence/${villageId}`)}
              className="px-6 py-3 bg-brand-accent text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center hover:bg-blue-600 transition-all"
            >
              View Village Intelligence <ChevronRight className="w-4 h-4 ml-2" />
            </button>
            <button 
              onClick={() => setSimulationStatus('IDLE')}
              className="px-6 py-3 bg-brand-surface text-brand-secondaryText border border-brand-border font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center hover:text-white transition-all"
            >
              Reset Simulator
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OutbreakSimulator;
