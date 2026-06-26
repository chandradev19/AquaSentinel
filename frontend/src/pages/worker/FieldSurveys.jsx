import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Stethoscope, Send } from 'lucide-react';

const FieldSurveys = () => {
  const [villages, setVillages] = useState([]);
  const [villageId, setVillageId] = useState('');
  const [householdsSurveyed, setHouseholdsSurveyed] = useState('');
  const [illnessCount, setIllnessCount] = useState('');
  const [primaryConcerns, setPrimaryConcerns] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await api.get('/worker/villages/assigned');
        if (response.data) {
          setVillages(response.data);
          if (response.data.length > 0) {
            setVillageId(response.data[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch assigned villages', error);
      }
    };
    fetchVillages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        villageId: parseInt(villageId),
        householdsSurveyed: parseInt(householdsSurveyed),
        illnessCount: parseInt(illnessCount),
        primaryConcerns,
        notes
      };
      const response = await api.post('/worker/surveys', payload);
      if (response.data?.success) {
        setMessage('Survey data submitted successfully!');
        setHouseholdsSurveyed('');
        setIllnessCount('');
        setPrimaryConcerns('');
        setNotes('');
      } else {
        setMessage('Failed to submit survey.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error submitting survey.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-success/20 rounded-xl">
          <Stethoscope className="w-8 h-8 text-brand-success" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Field Health Survey</h1>
          <p className="text-brand-secondaryText mt-1">Record community health data gathered during field visits.</p>
        </div>
      </div>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Select Village</label>
            <select
              required
              className="luxury-input w-full"
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
            >
              {villages.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Households Surveyed</label>
              <input
                type="number"
                min="1"
                required
                className="luxury-input w-full"
                value={householdsSurveyed}
                onChange={(e) => setHouseholdsSurveyed(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Total Illness Cases Found</label>
              <input
                type="number"
                min="0"
                required
                className="luxury-input w-full"
                value={illnessCount}
                onChange={(e) => setIllnessCount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Primary Community Concerns</label>
            <textarea
              required
              rows={3}
              className="luxury-input w-full"
              value={primaryConcerns}
              onChange={(e) => setPrimaryConcerns(e.target.value)}
              placeholder="e.g., Stomach pain spreading among children..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Additional Notes</label>
            <textarea
              rows={3}
              className="luxury-input w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations..."
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-brand-success/20 text-brand-success border border-brand-success/30' : 'bg-brand-danger/20 text-brand-danger border border-brand-danger/30'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !villageId}
            className="luxury-button w-full flex items-center justify-center py-4 text-lg font-bold hover:!shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                SUBMIT SURVEY DATA
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default FieldSurveys;
