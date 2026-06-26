import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Droplets, Send } from 'lucide-react';

const WaterQualityTesting = () => {
  const [villages, setVillages] = useState([]);
  const [villageId, setVillageId] = useState('');
  const [phLevel, setPhLevel] = useState('');
  const [turbidity, setTurbidity] = useState('');
  const [contaminationLevel, setContaminationLevel] = useState('');
  const [safeToDrink, setSafeToDrink] = useState(false);
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
        phLevel: parseFloat(phLevel),
        turbidity: parseFloat(turbidity),
        contaminationLevel: parseFloat(contaminationLevel),
        safeToDrink
      };
      const response = await api.post('/worker/water-quality', payload);
      if (response.data?.success) {
        setMessage('Water quality test submitted successfully!');
        setPhLevel('');
        setTurbidity('');
        setContaminationLevel('');
      } else {
        setMessage('Failed to submit test.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error submitting test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-accent/20 rounded-xl">
          <Droplets className="w-8 h-8 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Water Quality Testing</h1>
          <p className="text-brand-secondaryText mt-1">Submit field test results for assigned water sources.</p>
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
              <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">pH Level (0-14)</label>
              <input
                type="number"
                step="0.1"
                required
                className="luxury-input w-full"
                value={phLevel}
                onChange={(e) => setPhLevel(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Turbidity (NTU)</label>
              <input
                type="number"
                step="0.1"
                required
                className="luxury-input w-full"
                value={turbidity}
                onChange={(e) => setTurbidity(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Contamination Level (CFU/100ml)</label>
              <input
                type="number"
                step="1"
                required
                className="luxury-input w-full"
                value={contaminationLevel}
                onChange={(e) => setContaminationLevel(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-brand-surface/50 rounded-xl border border-brand-border/50">
            <input
              type="checkbox"
              id="safeToDrink"
              className="w-5 h-5 rounded border-brand-border bg-transparent text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-background"
              checked={safeToDrink}
              onChange={(e) => setSafeToDrink(e.target.checked)}
            />
            <label htmlFor="safeToDrink" className="text-white font-medium cursor-pointer">
              Mark water source as SAFE for drinking
            </label>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-brand-success/20 text-brand-success border border-brand-success/30' : 'bg-brand-danger/20 text-brand-danger border border-brand-danger/30'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !villageId}
            className="luxury-button w-full flex items-center justify-center py-4 text-lg font-bold"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                SUBMIT TEST RESULTS
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default WaterQualityTesting;
