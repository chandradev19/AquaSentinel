import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Settings, Save } from 'lucide-react';

const Profile = () => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/citizen/profile');
        if (response.data) {
          setName(response.data.name || '');
          setPhone(response.data.phone || '');
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const endpoint = user.role === 'CITIZEN' ? '/citizen/profile' : '/worker/profile'; // Assuming worker has same logic or we ignore role check for now
      // Let's just use citizen profile endpoint for citizen
      if (user.role !== 'CITIZEN') {
         setMessage("Profile update not implemented for this role yet.");
         return;
      }
      
      const response = await api.put(endpoint, { name, phone });
      if (response.data?.success) {
        setMessage('Profile updated successfully!');
        // Refresh user profile data
        const profileRes = await api.get('/citizen/profile');
        if (profileRes.data) {
          setName(profileRes.data.name || '');
          setPhone(profileRes.data.phone || '');
        }
      } else {
        setMessage('Failed to update profile.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-accent/20 rounded-xl">
          <Settings className="w-8 h-8 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-brand-secondaryText mt-1">Manage your account details.</p>
        </div>
      </div>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Email (Read Only)</label>
            <input type="email" disabled value={user?.email || ''} className="luxury-input w-full opacity-50 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Full Name</label>
            <input
              type="text"
              required
              className="luxury-input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium tracking-wide text-brand-secondaryText uppercase mb-2">Phone Number</label>
            <input
              type="tel"
              className="luxury-input w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-brand-success/20 text-brand-success border border-brand-success/30' : 'bg-brand-danger/20 text-brand-danger border border-brand-danger/30'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="luxury-button w-full flex items-center justify-center py-4 text-lg font-bold"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                SAVE CHANGES
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Profile;
