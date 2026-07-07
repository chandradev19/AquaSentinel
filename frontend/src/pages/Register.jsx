import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CITIZEN',
    phone: '',
    villageId: ''
  });

  const [villages, setVillages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/villages`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setVillages(Array.isArray(data) ? data : []))
      .catch(() => setVillages([]));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || null,
        villageId: formData.villageId
          ? Number(formData.villageId)
          : null,
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Unable to connect to AquaSentinel server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">

      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-success/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 glass-panel p-5 sm:p-8 md:p-10 relative z-10"
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-16 bg-brand-surface rounded-2xl flex items-center justify-center shadow-glow mb-6 border border-brand-border"
          >
            <Shield className="w-8 h-8 text-brand-accent" />
          </motion.div>

          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Request Access
          </h2>

          <p className="mt-2 text-center text-sm text-brand-secondaryText uppercase tracking-widest font-medium">
            AquaShield Intelligence Network
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-3 bg-brand-danger/10 text-brand-danger border border-brand-danger/20 rounded-lg text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
          <div>
            <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">
              Full Name
            </label>

            <input
              type="text"
              required
              className="luxury-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">
              Email Address
            </label>

            <input
              type="email"
              required
              className="luxury-input"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>

            <input
              type="tel"
              className="luxury-input"
              placeholder="+91-XXXXXXXXXX (optional)"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">
              Password
            </label>

            <input
              type="password"
              required
              className="luxury-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">
              Requested Clearance Level
            </label>

            <select
              className="luxury-input appearance-none bg-brand-background"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="CITIZEN">Citizen (Public Access)</option>
              <option value="HEALTH_WORKER">
                Health Worker (Field Operations)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">
              Village / Zone Assignment
            </label>

            <select
              className="luxury-input appearance-none bg-brand-background"
              value={formData.villageId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  villageId: e.target.value,
                })
              }
            >
              <option value="">-- Select your village --</option>

              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.district}, {v.state}
                </option>
              ))}
            </select>

            {villages.length === 0 && (
              <p className="text-xs text-brand-secondaryText/60 mt-1">
                Unable to load villages from server.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full luxury-button mt-4 disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        <div className="text-center text-sm text-brand-secondaryText border-t border-brand-border/50 pt-6 mt-6">
          Already have clearance?{" "}
          <Link
            to="/login"
            className="font-medium text-brand-accent hover:text-blue-400 transition-colors"
          >
            Authenticate
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;