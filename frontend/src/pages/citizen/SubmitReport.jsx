import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Activity, Send, Compass, Camera, Save, X, Eye, Video, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SYMPTOM_OPTIONS = [
  'Fever', 'Diarrhea', 'Vomiting', 'Stomach Cramps', 
  'Skin Rash', 'Cough', 'Fatigue', 'Headache'
];

const SubmitReport = () => {
  const navigate = useNavigate();

  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [message, setMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    villageId: '',
    symptoms: [],
    severity: 'MEDIUM',
    duration: '',
    remarks: '',
    photoUrl: '',
    videoUrl: '',
    latitude: '',
    longitude: '',
    waterQualityComplaint: false,
    deadAnimalReport: false,
    affectedFamilyMembers: '',
    drinkingWaterSource: 'TAP'
  });

  useEffect(() => {
    // Load draft if it exists
    const draft = localStorage.getItem('symptom_report_draft');
    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch (e) {}
    }

    // Load villages for selection
    const fetchVillages = async () => {
      try {
        const res = await api.get('/villages');
        setVillages(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVillages();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setFetchingGps(false);
      },
      (error) => {
        console.error(error);
        alert('Failed to retrieve GPS location coordinates.');
        setFetchingGps(false);
      }
    );
  };

  const handleSaveDraft = () => {
    localStorage.setItem('symptom_report_draft', JSON.stringify(form));
    alert('Symptom report draft saved to local storage.');
  };

  const handleCancel = () => {
    localStorage.removeItem('symptom_report_draft');
    navigate('/citizen/dashboard');
  };

  const handleSymptomChange = (symptom) => {
    setForm(prev => {
      const current = prev.symptoms || [];
      if (current.includes(symptom)) {
        return { ...prev, symptoms: current.filter(s => s !== symptom) };
      } else {
        return { ...prev, symptoms: [...current, symptom] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.villageId || form.symptoms.length === 0) {
      alert('Please fill out village coverage and select at least one symptom.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        symptoms: form.symptoms.join(', '),
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        severity: form.severity,
        duration: form.duration,
        remarks: form.remarks,
        photoUrl: form.photoUrl,
        videoUrl: form.videoUrl,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        villageId: Number(form.villageId),
        waterQualityComplaint: form.waterQualityComplaint,
        deadAnimalReport: form.deadAnimalReport,
        affectedFamilyMembers: form.affectedFamilyMembers ? Number(form.affectedFamilyMembers) : 0,
        drinkingWaterSource: form.drinkingWaterSource
      };

      const response = await api.post('/citizen/symptoms', payload);
      if (response.data?.success) {
        setSuccessData({
          message: 'Report Submitted Successfully.',
          reportId: response.data.reportId
        });
        localStorage.removeItem('symptom_report_draft');
      } else {
        setMessage('Failed to submit report.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error submitting report.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto mt-20 text-center">
        <div className="glass-panel p-12 border border-brand-border flex flex-col items-center">
          <CheckCircle className="w-20 h-20 text-brand-success mb-6" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">{successData.message}</h2>
          <p className="text-brand-secondaryText mb-6">Your report has been received and Field Workers have been notified immediately.</p>
          
          <div className="bg-brand-surface border border-brand-border px-8 py-4 rounded-xl mb-8">
            <span className="text-xs uppercase tracking-widest text-brand-secondaryText font-bold block mb-1">Assigned Report ID</span>
            <span className="text-2xl font-mono text-brand-accent tracking-wider font-bold">{successData.reportId}</span>
          </div>

          <button 
            onClick={() => navigate('/citizen/my-reports')}
            className="px-8 py-3.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow flex justify-center items-center"
          >
            <Eye className="w-4 h-4 mr-2" /> Track Status
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-accent/20 rounded-xl">
            <Activity className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Citizen Health Logger</h1>
            <p className="text-brand-secondaryText mt-1 uppercase tracking-widest text-[10px] font-bold">
              Secure outbound epidemiological reporting terminal
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/citizen/my-reports')}
          className="px-4 py-2.5 bg-brand-surface border border-brand-border hover:bg-brand-border text-brand-accent rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center shadow-glow"
        >
          <Eye className="w-4 h-4 mr-2" /> Track Status
        </button>
      </div>

      <div className="glass-panel p-8 border border-brand-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Patient Full Name</label>
              <input 
                type="text" required placeholder="John Doe" className="luxury-input text-sm"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Patient Age</label>
              <input 
                type="number" required placeholder="32" className="luxury-input text-sm"
                value={form.age}
                onChange={(e) => setForm({...form, age: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Gender</label>
              <select 
                className="luxury-input text-sm bg-brand-background"
                value={form.gender}
                onChange={(e) => setForm({...form, gender: e.target.value})}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Select Village Node</label>
              <select 
                required
                className="luxury-input text-sm bg-brand-background"
                value={form.villageId}
                onChange={(e) => setForm({...form, villageId: e.target.value})}
              >
                <option value="">-- Choose Village --</option>
                {villages.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.district})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Symptom Severity</label>
              <select 
                className="luxury-input text-sm bg-brand-background"
                value={form.severity}
                onChange={(e) => setForm({...form, severity: e.target.value})}
              >
                <option value="LOW">LOW (Mild Discomfort)</option>
                <option value="MEDIUM">MEDIUM (Symptom Clusters)</option>
                <option value="HIGH">HIGH (Severe / Outbreak Probability)</option>
              </select>
            </div>
          </div>

          {/* New specific fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-surface p-4 rounded-xl border border-brand-border/50">
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Drinking Water Source</label>
              <select 
                className="luxury-input text-sm bg-brand-background"
                value={form.drinkingWaterSource}
                onChange={(e) => setForm({...form, drinkingWaterSource: e.target.value})}
              >
                <option value="TAP">Tap Water</option>
                <option value="WELL">Well / Borehole</option>
                <option value="RIVER">River / Stream</option>
                <option value="BOTTLED">Bottled Water</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Affected Family Members</label>
              <input 
                type="number" min="0" placeholder="0" className="luxury-input text-sm"
                value={form.affectedFamilyMembers}
                onChange={(e) => setForm({...form, affectedFamilyMembers: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 py-2">
            <label className="flex items-center space-x-2 text-sm text-white bg-brand-surface px-4 py-2 rounded-lg border border-brand-border cursor-pointer hover:border-brand-accent transition-colors">
              <input 
                type="checkbox" 
                checked={form.waterQualityComplaint}
                onChange={(e) => setForm({...form, waterQualityComplaint: e.target.checked})}
                className="rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-brand-background"
              />
              <span>Water Quality Complaint (Muddy, Bad Smell)</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-white bg-brand-surface px-4 py-2 rounded-lg border border-brand-border cursor-pointer hover:border-brand-accent transition-colors">
              <input 
                type="checkbox" 
                checked={form.deadAnimalReport}
                onChange={(e) => setForm({...form, deadAnimalReport: e.target.checked})}
                className="rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-brand-background"
              />
              <span>Dead Fish / Animal Found in Water</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-secondaryText mb-3 uppercase tracking-wider">Disease Symptoms</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SYMPTOM_OPTIONS.map(symptom => (
                <label key={symptom} className={`flex items-center justify-center py-2 px-3 rounded-lg border cursor-pointer transition-all ${form.symptoms.includes(symptom) ? 'bg-brand-accent border-brand-accent text-white shadow-glow' : 'bg-brand-background border-brand-border text-brand-secondaryText hover:border-brand-accent/50 hover:text-white'}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.symptoms.includes(symptom)}
                    onChange={() => handleSymptomChange(symptom)}
                  />
                  <span className="text-xs font-bold">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Duration of Illness</label>
              <input 
                type="text" placeholder="e.g. 3 days" className="luxury-input text-sm"
                value={form.duration}
                onChange={(e) => setForm({...form, duration: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Additional Remarks</label>
              <input 
                type="text" placeholder="Additional details..." className="luxury-input text-sm"
                value={form.remarks}
                onChange={(e) => setForm({...form, remarks: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Photo Upload URL</label>
              <div className="relative">
                <input 
                  type="url" placeholder="http://example.com/symptom.jpg" className="luxury-input text-sm pr-12"
                  value={form.photoUrl}
                  onChange={(e) => setForm({...form, photoUrl: e.target.value})}
                />
                <button 
                  type="button" 
                  onClick={() => setForm({...form, photoUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=200'})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondaryText hover:text-white"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Video Upload URL (Optional)</label>
              <div className="relative">
                <input 
                  type="url" placeholder="http://example.com/video.mp4" className="luxury-input text-sm pr-12"
                  value={form.videoUrl}
                  onChange={(e) => setForm({...form, videoUrl: e.target.value})}
                />
                <button 
                  type="button" 
                  onClick={() => setForm({...form, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondaryText hover:text-white"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* GPS Location Telemetry */}
          <div className="p-4 bg-brand-background border border-brand-border rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Surveillance Location Coordinates</span>
                <span className="text-xs text-white">Provide GPS coordinates to map pathogen spreads precisely.</span>
              </div>
              <button 
                type="button"
                onClick={handleGetLocation}
                disabled={fetchingGps}
                className="px-4 py-2 bg-brand-surface border border-brand-border text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center transition-all disabled:opacity-50"
              >
                <Compass className={`w-4 h-4 mr-1.5 ${fetchingGps ? 'animate-spin' : ''}`} />
                {fetchingGps ? 'Querying GPS...' : 'Fetch Coordinates'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input 
                  type="text" placeholder="Latitude" className="luxury-input text-xs font-mono" readOnly
                  value={form.latitude}
                />
              </div>
              <div>
                <input 
                  type="text" placeholder="Longitude" className="luxury-input text-xs font-mono" readOnly
                  value={form.longitude}
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold text-center border ${message.includes('successfully') || message.includes('Worker') ? 'bg-brand-success/15 text-brand-success border-brand-success/20' : 'bg-brand-danger/15 text-brand-danger border-brand-danger/20'}`}>
              {message}
            </div>
          )}

          {/* Buttons container */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-brand-border/50">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-3 bg-brand-surface border border-brand-border text-white hover:bg-brand-border rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <Save className="w-4 h-4 inline mr-1.5" /> Save Draft
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <X className="w-4 h-4 inline mr-1.5" /> Cancel
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow flex justify-center items-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Transmitting...' : 'Submit Report'}
            </button>
          </div>

        </form>
      </div>
    </motion.div>
  );
};

export default SubmitReport;
