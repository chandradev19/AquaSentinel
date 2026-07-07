import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, AlertTriangle, Clock, MapPin, Search, Droplet, Activity, 
  Users, CheckSquare, Plus, RefreshCw, XCircle, Send, FileText, Calendar 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

const HealthWorkerDashboard = () => {
  const [activeTab, setActiveTab] = useState('validation'); // 'validation', 'water', 'survey', 'conditions'
  const [selectedVillageId, setSelectedVillageId] = useState('');
  
  // Custom checklist state stored in local storage
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('worker_tasks');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, text: 'Perform daily pH & turbidity water tests', completed: false },
      { id: 2, text: 'Validate citizen reports in validation queue', completed: false },
      { id: 3, text: 'Submit weekly health survey for assigned village', completed: false },
      { id: 4, text: 'Update sanitization and population conditions', completed: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('worker_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Queries
  const { data: allVillages = [] } = useQuery({
    queryKey: ['allVillages'],
    queryFn: async () => {
      const res = await api.get('/villages');
      return res.data;
    }
  });

  const { data: assignedVillages = [], isLoading: isAssignedLoading, refetch: refetchAssigned } = useQuery({
    queryKey: ['assignedVillages'],
    queryFn: async () => {
      try {
        const res = await api.get('/worker/villages/assigned');
        return res.data;
      } catch (err) {
        return [];
      }
    }
  });

  const activeVillages = assignedVillages.length > 0 ? assignedVillages : allVillages;

  useEffect(() => {
    if (activeVillages.length > 0 && !selectedVillageId) {
      setSelectedVillageId(activeVillages[0].id.toString());
    }
  }, [activeVillages, selectedVillageId]);

  const { data: pendingReports = [], refetch: refetchPending } = useQuery({
    queryKey: ['pendingReports'],
    queryFn: async () => {
      try {
        const res = await api.get('/worker/reports/pending');
        return res.data;
      } catch (err) {
        return [];
      }
    }
  });

  const { data: verifiedReports = [], refetch: refetchVerified } = useQuery({
    queryKey: ['verifiedReports'],
    queryFn: async () => {
      try {
        const res = await api.get('/worker/reports/verified');
        return res.data;
      } catch (err) {
        return [];
      }
    }
  });

  const { data: activityLogs = [], refetch: refetchActivity } = useQuery({
    queryKey: ['workerActivity'],
    queryFn: async () => {
      try {
        const res = await api.get('/worker/activity');
        return res.data;
      } catch (err) {
        return [];
      }
    }
  });

  // Forms states
  const [waterForm, setWaterForm] = useState({ phLevel: 7.2, turbidity: 1.5, contaminationLevel: 10.0, safeToDrink: true });
  const [surveyForm, setSurveyForm] = useState({ householdsSurveyed: 25, illnessCount: 0, primaryConcerns: '', notes: '' });
  const [conditionsForm, setConditionsForm] = useState({ waterSources: '', population: '' });

  useEffect(() => {
    if (selectedVillageId) {
      const v = activeVillages.find(v => v.id.toString() === selectedVillageId);
      if (v) {
        setConditionsForm({
          waterSources: v.waterSources || '',
          population: v.population || ''
        });
      }
    }
  }, [selectedVillageId, assignedVillages, allVillages]);

  // Mutations
  const waterMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/worker/water-quality', data);
      return res.data;
    },
    onSuccess: () => {
      alert("Water Quality Report uploaded and submitted to AI Engine.");
      setWaterForm({ phLevel: 7.2, turbidity: 1.5, contaminationLevel: 10.0, safeToDrink: true });
      refetchAssigned();
      refetchActivity();
    }
  });

  const surveyMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/worker/surveys', data);
      return res.data;
    },
    onSuccess: () => {
      alert("Health Survey submitted. AI Outbreak Prediction Matrix updated.");
      setSurveyForm({ householdsSurveyed: 25, illnessCount: 0, primaryConcerns: '', notes: '' });
      refetchAssigned();
      refetchActivity();
    }
  });

  const conditionsMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/worker/villages/${id}/conditions`, data);
      return res.data;
    },
    onSuccess: () => {
      alert("Village conditions updated. Dynamic risk indices recalculated.");
      refetchAssigned();
      refetchActivity();
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/worker/reports/${id}/verify`);
      return res.data;
    },
    onSuccess: () => {
      alert("Citizen report verified. Outbreak indicators modified.");
      refetchPending();
      refetchVerified();
      refetchActivity();
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/worker/reports/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      alert("Citizen report rejected/flagged as false alarm.");
      refetchPending();
      refetchActivity();
    }
  });

  const handleWaterSubmit = (e) => {
    e.preventDefault();
    if (!selectedVillageId) return alert("Please select a target village.");
    waterMutation.mutate({
      villageId: parseInt(selectedVillageId),
      ...waterForm
    });
  };

  const handleSurveySubmit = (e) => {
    e.preventDefault();
    if (!selectedVillageId) return alert("Please select a target village.");
    surveyMutation.mutate({
      villageId: parseInt(selectedVillageId),
      ...surveyForm
    });
  };

  const handleConditionsSubmit = (e) => {
    e.preventDefault();
    if (!selectedVillageId) return alert("Please select a target village.");
    conditionsMutation.mutate({
      id: parseInt(selectedVillageId),
      data: conditionsForm
    });
  };

  // Compute Water Tests Pending count (villages with lastSurveyDate null or older than 7 days)
  const computePendingWaterTests = () => {
    let count = 0;
    activeVillages.forEach(v => {
      if (!v.lastSurveyDate) {
        count++;
      } else {
        const lastDate = new Date(v.lastSurveyDate);
        const diffTime = Math.abs(new Date() - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) count++;
      }
    });
    return count;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-brand-border/40 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-brand-accent animate-pulse" />
            Field Operations Terminal
          </h2>
          <p className="text-brand-secondaryText mt-1 uppercase tracking-widest text-xs font-semibold">
            Health Worker Surveillance & Validation Center
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-brand-surface/60 border border-brand-border px-4 py-2.5 rounded-xl">
          <Calendar className="w-4 h-4 text-brand-accent" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Surveillance Mode: Active
          </span>
        </div>
      </div>

      {/* 5 KPI Widgets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Widget 1: Assigned Villages */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="luxury-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand-secondaryText text-[10px] font-black uppercase tracking-wider">Assigned Villages</span>
              <MapPin className="w-4 h-4 text-brand-accent" />
            </div>
            <p className="text-2xl font-black text-white">{assignedVillages.length}</p>
          </div>
          <div className="text-[10px] text-brand-secondaryText mt-3 font-semibold truncate">
            {assignedVillages.length > 0 ? assignedVillages.map(v => v.name).join(', ') : 'No village assigned (showing fallback)'}
          </div>
        </motion.div>

        {/* Widget 2: Pending Reports */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="luxury-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand-secondaryText text-[10px] font-black uppercase tracking-wider">Pending Reports</span>
              <AlertTriangle className="w-4 h-4 text-brand-warning animate-pulse" />
            </div>
            <p className="text-2xl font-black text-white">{pendingReports.length}</p>
          </div>
          <div className="text-[10px] text-brand-warning mt-3 font-black uppercase tracking-widest">
            Awaiting Verification
          </div>
        </motion.div>

        {/* Widget 3: Verified Reports */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="luxury-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand-secondaryText text-[10px] font-black uppercase tracking-wider">Verified Reports</span>
              <CheckCircle className="w-4 h-4 text-brand-success" />
            </div>
            <p className="text-2xl font-black text-white">{verifiedReports.length}</p>
          </div>
          <div className="text-[10px] text-brand-success mt-3 font-black uppercase tracking-widest">
            Logged in Database
          </div>
        </motion.div>

        {/* Widget 4: Water Tests Pending */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="luxury-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand-secondaryText text-[10px] font-black uppercase tracking-wider">Water Tests Due</span>
              <Droplet className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{computePendingWaterTests()}</p>
          </div>
          <div className="text-[10px] text-brand-secondaryText mt-3 font-semibold">
            Required every 7 days
          </div>
        </motion.div>

        {/* Widget 5: Today's Tasks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="luxury-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand-secondaryText text-[10px] font-black uppercase tracking-wider">Today's Tasks</span>
              <CheckSquare className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {tasks.filter(t => !t.completed).length} / {tasks.length}
            </p>
          </div>
          <div className="text-[10px] text-brand-secondaryText mt-3 font-semibold">
            Task checklist status
          </div>
        </motion.div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Side: Work Queues, Actions & Forms */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="glass-panel overflow-hidden border border-brand-border">
            {/* Tabs Selector */}
            <div className="border-b border-brand-border bg-brand-surface/70 p-3 sm:p-4 sm:px-6 flex flex-col gap-3">
              <div className="flex space-x-1 bg-brand-background p-1.5 rounded-xl border border-brand-border overflow-x-auto w-full sm:w-auto">
                <button 
                  onClick={() => setActiveTab('validation')}
                  className={`px-4 py-2 flex items-center space-x-2 text-[11px] font-black rounded-lg whitespace-nowrap transition-all uppercase tracking-wider ${activeTab === 'validation' ? 'bg-brand-surface text-white shadow-sm border border-brand-border/50' : 'text-brand-secondaryText hover:text-white'}`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Validation Queue ({pendingReports.length})</span>
                </button>
                <button 
                  onClick={() => setActiveTab('water')}
                  className={`px-4 py-2 flex items-center space-x-2 text-[11px] font-black rounded-lg whitespace-nowrap transition-all uppercase tracking-wider ${activeTab === 'water' ? 'bg-brand-surface text-white shadow-sm border border-brand-border/50' : 'text-brand-secondaryText hover:text-white'}`}
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Upload Water Test</span>
                </button>
                <button 
                  onClick={() => setActiveTab('survey')}
                  className={`px-4 py-2 flex items-center space-x-2 text-[11px] font-black rounded-lg whitespace-nowrap transition-all uppercase tracking-wider ${activeTab === 'survey' ? 'bg-brand-surface text-white shadow-sm border border-brand-border/50' : 'text-brand-secondaryText hover:text-white'}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Survey Village</span>
                </button>
                <button 
                  onClick={() => setActiveTab('conditions')}
                  className={`px-4 py-2 flex items-center space-x-2 text-[11px] font-black rounded-lg whitespace-nowrap transition-all uppercase tracking-wider ${activeTab === 'conditions' ? 'bg-brand-surface text-white shadow-sm border border-brand-border/50' : 'text-brand-secondaryText hover:text-white'}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Update Conditions</span>
                </button>
              </div>

              {/* Village selector context dropdown */}
              <div className="w-full sm:w-48">
                <select 
                  className="luxury-input !py-2 !px-3 text-xs bg-brand-background"
                  value={selectedVillageId}
                  onChange={e => setSelectedVillageId(e.target.value)}
                >
                  {activeVillages.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.district})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Tab Panel */}
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                
                {/* 1. Validation Queue */}
                {activeTab === 'validation' && (
                  <motion.div 
                    key="validation"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white">Pending Citizen Reports</h3>
                      <p className="text-xs text-brand-secondaryText">Verify or reject health symptom reports logged by community residents.</p>
                    </div>

                    {pendingReports.length === 0 ? (
                      <div className="p-12 text-center text-brand-secondaryText border border-brand-border rounded-xl border-dashed bg-brand-background/20">
                        <CheckCircle className="w-8 h-8 mx-auto mb-3 opacity-40 text-brand-success" />
                        <p className="text-xs font-bold text-white">Validation Queue Empty</p>
                        <p className="text-[11px] text-brand-secondaryText mt-1">All citizen reports in this village have been processed.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingReports.map(report => (
                          <div key={report.id} className="p-5 border border-brand-border bg-brand-background rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-brand-accent/50 transition-all">
                            <div className="flex items-start space-x-3.5">
                              <div className="w-10 h-10 rounded-lg bg-brand-warning/10 text-brand-warning flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-warning/20">
                                <AlertTriangle className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-extrabold text-white text-sm">{report.symptoms}</span>
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-danger/25 text-brand-danger border border-brand-danger/40">
                                    Severity: {report.severity || 'UNKNOWN'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-brand-secondaryText flex flex-wrap gap-x-4 gap-y-1 font-medium">
                                  <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" /> {report.name} ({report.gender}, Age {report.age})</span>
                                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {new Date(report.reportDate).toLocaleDateString()}</span>
                                  {report.remarks && <span className="italic block text-[10px] text-brand-secondaryText mt-0.5">"{report.remarks}"</span>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 md:self-center self-end">
                              <button 
                                onClick={() => rejectMutation.mutate(report.id)}
                                disabled={rejectMutation.isPending || verifyMutation.isPending}
                                className="px-3.5 py-2 text-xs font-bold text-brand-danger border border-brand-danger/30 rounded-xl hover:bg-brand-danger/10 hover:border-brand-danger transition-colors flex items-center space-x-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                              <button 
                                onClick={() => verifyMutation.mutate(report.id)}
                                disabled={verifyMutation.isPending || rejectMutation.isPending}
                                className="px-4 py-2 text-xs font-bold text-white bg-brand-success hover:bg-brand-success/90 rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Verify Report</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. Upload Water Quality Test */}
                {activeTab === 'water' && (
                  <motion.form 
                    key="water"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleWaterSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white">Water Quality Submission Matrix</h3>
                      <p className="text-xs text-brand-secondaryText">Submit recent physical & chemical analysis parameters for evaluation by the risk models.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">pH Level (Acceptable: 6.5 - 8.5)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={waterForm.phLevel} 
                          onChange={e => setWaterForm({...waterForm, phLevel: parseFloat(e.target.value)})} 
                          className="luxury-input text-sm bg-brand-background"
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Turbidity (Acceptable: 0.0 - 5.0 NTU)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={waterForm.turbidity} 
                          onChange={e => setWaterForm({...waterForm, turbidity: parseFloat(e.target.value)})} 
                          className="luxury-input text-sm bg-brand-background"
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Chemical Contamination Index (0 - 100)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={waterForm.contaminationLevel} 
                        onChange={e => setWaterForm({...waterForm, contaminationLevel: parseFloat(e.target.value)})} 
                        className="luxury-input text-sm bg-brand-background"
                        required 
                      />
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-brand-border rounded-xl bg-brand-background/40">
                      <input 
                        type="checkbox" 
                        id="safeToDrink" 
                        checked={waterForm.safeToDrink} 
                        onChange={e => setWaterForm({...waterForm, safeToDrink: e.target.checked})} 
                        className="w-5 h-5 rounded border-brand-border bg-brand-surface text-brand-success focus:ring-brand-success" 
                      />
                      <label htmlFor="safeToDrink" className="text-xs font-bold text-white cursor-pointer uppercase tracking-wider">
                        Mark Water Source as Safe to Drink
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={waterMutation.isPending} 
                      className="luxury-button w-full text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{waterMutation.isPending ? 'Transmitting Lab Metrics...' : 'Upload Water Quality Metrics'}</span>
                    </button>
                  </motion.form>
                )}

                {/* 3. Survey Village */}
                {activeTab === 'survey' && (
                  <motion.form 
                    key="survey"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleSurveySubmit}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white">Health Survey Audit Form</h3>
                      <p className="text-xs text-brand-secondaryText">Upload field surveillance outcomes regarding disease prevalence, concerns, and notes.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Households Surveyed</label>
                        <input 
                          type="number" 
                          value={surveyForm.householdsSurveyed} 
                          onChange={e => setSurveyForm({...surveyForm, householdsSurveyed: parseInt(e.target.value)})} 
                          className="luxury-input text-sm bg-brand-background"
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Reported Illness Cases</label>
                        <input 
                          type="number" 
                          value={surveyForm.illnessCount} 
                          onChange={e => setSurveyForm({...surveyForm, illnessCount: parseInt(e.target.value)})} 
                          className="luxury-input text-sm bg-brand-background"
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Primary Symptoms / Health Concerns</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Diarrhea outbreak, abdominal cramps" 
                        value={surveyForm.primaryConcerns} 
                        onChange={e => setSurveyForm({...surveyForm, primaryConcerns: e.target.value})} 
                        className="luxury-input text-sm bg-brand-background" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Additional Surveillance Notes</label>
                      <textarea 
                        rows={3} 
                        placeholder="Detail sanitization failures, drainage issues, etc."
                        value={surveyForm.notes} 
                        onChange={e => setSurveyForm({...surveyForm, notes: e.target.value})} 
                        className="luxury-input text-sm bg-brand-background" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={surveyMutation.isPending} 
                      className="luxury-button w-full text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{surveyMutation.isPending ? 'Transmitting Health Audit...' : 'Submit Health Survey'}</span>
                    </button>
                  </motion.form>
                )}

                {/* 4. Update Conditions */}
                {activeTab === 'conditions' && (
                  <motion.form 
                    key="conditions"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleConditionsSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white">Update Village Conditions</h3>
                      <p className="text-xs text-brand-secondaryText">Update local infrastructure factors such as active water sources and monitored population.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Water Sources (Comma Separated)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Borewell, Local Pond, River Palar"
                        value={conditionsForm.waterSources} 
                        onChange={e => setConditionsForm({...conditionsForm, waterSources: e.target.value})} 
                        className="luxury-input text-sm bg-brand-background"
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-brand-secondaryText mb-1.5 uppercase tracking-wider">Total Village Population</label>
                      <input 
                        type="number" 
                        value={conditionsForm.population} 
                        onChange={e => setConditionsForm({...conditionsForm, population: e.target.value})} 
                        className="luxury-input text-sm bg-brand-background"
                        required 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={conditionsMutation.isPending} 
                      className="luxury-button w-full text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{conditionsMutation.isPending ? 'Syncing Conditions...' : 'Sync Village Conditions'}</span>
                    </button>
                  </motion.form>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Checklist & Activity Timeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Today's Task Checklist */}
          <div className="luxury-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-purple-400" />
                Task Checklist
              </h3>
              <span className="text-[10px] text-brand-secondaryText font-bold">
                {tasks.filter(t => t.completed).length}/{tasks.length} Completed
              </span>
            </div>
            <div className="space-y-3">
              {tasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => toggleTask(t.id)}
                  className={`flex items-start space-x-3 p-3 rounded-xl border border-transparent hover:border-brand-border/40 hover:bg-brand-background/40 cursor-pointer transition-all ${t.completed ? 'opacity-55' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={t.completed} 
                    onChange={() => {}} // handled by div click
                    className="w-4 h-4 mt-0.5 rounded border-brand-border text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-background" 
                  />
                  <span className={`text-xs font-semibold text-white ${t.completed ? 'line-through text-brand-secondaryText' : ''}`}>
                    {t.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Worker Activity Timeline */}
          <div className="luxury-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-accent" />
                Activity Timeline
              </h3>
              <button 
                onClick={() => refetchActivity()} 
                className="text-brand-secondaryText hover:text-white transition-colors"
                title="Refresh Activity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {activityLogs.length === 0 ? (
              <div className="py-8 text-center text-brand-secondaryText text-xs font-semibold">
                No recent actions recorded.
              </div>
            ) : (
              <div className="relative border-l border-brand-border/50 pl-4 ml-2 space-y-5 py-2">
                {activityLogs.slice(0, 5).map((log, index) => (
                  <div key={log.id || index} className="relative">
                    {/* Circle Node */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-accent border border-brand-background shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">
                          {log.action}
                        </span>
                        <span className="text-[9px] text-brand-secondaryText font-medium">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-white font-medium leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default HealthWorkerDashboard;
