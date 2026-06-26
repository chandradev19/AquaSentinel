import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, ShieldAlert, Plus, Edit2, Trash2, Key, UserCheck, Loader } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [pwOpen, setPwOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CITIZEN',
    villageId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resUsers = await api.get('/admin/users');
      setUsers(resUsers.data || []);
      
      const resVillages = await api.get('/admin/villages');
      setVillages(resVillages.data || []);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Edit existing
        await api.put(`/admin/users/${selectedUser.id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          villageId: form.villageId ? Number(form.villageId) : null
        });
        alert('User details updated successfully.');
      } else {
        // Add new
        await api.post('/admin/users', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password || 'password123',
          role: form.role,
          villageId: form.villageId ? Number(form.villageId) : null
        });
        alert('New user created successfully.');
      }
      setModalOpen(false);
      setSelectedUser(null);
      setForm({ name: '', email: '', phone: '', password: '', role: 'CITIZEN', villageId: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving user.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this user from database registers?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        alert('User profile deleted.');
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to delete user.');
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;
    try {
      await api.put(`/admin/users/${resetUser.id}/reset-password`, {
        password: newPassword
      });
      alert('Credentials reset successfully!');
      setPwOpen(false);
      setNewPassword('');
      setResetUser(null);
    } catch (err) {
      console.error(err);
      alert('Failed to reset credential.');
    }
  };

  const handleAssignRole = async (userId, targetRole) => {
    try {
      await api.put(`/admin/users/${userId}/assign-role`, {
        role: targetRole
      });
      alert('Security role updated!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update role.');
    }
  };

  const handleSuspendUser = async (id) => {
    try {
      await api.put(`/admin/users/${id}/suspend`);
      alert('Clearance status suspended.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to suspend user.');
    }
  };

  const handleActivateUser = async (id) => {
    try {
      await api.put(`/admin/users/${id}/activate`);
      alert('Clearance status activated.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to activate user.');
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      villageId: u.village?.id || ''
    });
    setModalOpen(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-brand-danger/20 text-brand-danger border border-brand-danger/30';
      case 'HEALTH_WORKER': return 'bg-brand-warning/20 text-brand-warning border border-brand-warning/30';
      default: return 'bg-brand-success/20 text-brand-success border border-brand-success/30';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-accent/20 rounded-xl">
            <Users className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Security Clearance & Users</h1>
            <p className="text-brand-secondaryText mt-1">Manage citizens, field health workers, and database administrators.</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setSelectedUser(null);
            setForm({ name: '', email: '', phone: '', password: '', role: 'CITIZEN', villageId: '' });
            setModalOpen(true);
          }}
          className="px-6 py-3 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center shadow-glow"
        >
          <Plus className="w-4 h-4 mr-2" /> Create User
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader className="w-8 h-8 text-brand-accent animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left text-sm text-brand-secondaryText">
            <thead className="text-xs uppercase bg-brand-surface/80 text-white border-b border-brand-border/50">
              <tr>
                <th scope="col" className="px-6 py-4 tracking-widest">Name</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Contact Info</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Clearance Role</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Village coverage</th>
                <th scope="col" className="px-6 py-4 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">
                    <div className="flex items-center space-x-2">
                      <span>{user.name}</span>
                      {user.suspended && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest bg-brand-danger/20 text-brand-danger border border-brand-danger/30 uppercase">Suspended</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 text-brand-accent animate-pulse" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3 h-3 text-brand-secondaryText" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black tracking-wider ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-brand-accent">
                    {user.village ? (
                      <span className="px-2 py-0.5 border border-brand-border bg-brand-background rounded text-xs text-white">
                        {user.village.name}
                      </span>
                    ) : (
                      'GLOBAL'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <select 
                      className="px-2 py-1 bg-brand-surface border border-brand-border rounded text-xs text-white uppercase tracking-wider"
                      value={user.role}
                      onChange={(e) => handleAssignRole(user.id, e.target.value)}
                    >
                      <option value="CITIZEN">CITIZEN</option>
                      <option value="HEALTH_WORKER">FIELD WORKER</option>
                      <option value="ADMIN">ADMINISTRATOR</option>
                    </select>
                    
                    {user.suspended ? (
                      <button 
                        onClick={() => handleActivateUser(user.id)}
                        title="Activate Clearance"
                        className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-success hover:text-brand-success rounded-lg transition-all inline-flex items-center"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSuspendUser(user.id)}
                        title="Suspend Clearance"
                        className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-danger hover:text-brand-danger rounded-lg transition-all inline-flex items-center"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        setResetUser(user);
                        setPwOpen(true);
                      }}
                      title="Reset Password"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-accent hover:text-brand-accent rounded-lg transition-all inline-flex items-center"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openEditModal(user)}
                      title="Edit User"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-warning hover:text-brand-warning rounded-lg transition-all inline-flex items-center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-danger hover:text-brand-danger rounded-lg transition-all inline-flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
              <Users className="w-6 h-6 mr-2 text-brand-accent" /> 
              {selectedUser ? 'Edit User Credentials' : 'Enroll New User Node'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" required className="luxury-input text-sm" placeholder="e.g. Rahul Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" required className="luxury-input text-sm" placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Contact Phone</label>
                <input 
                  type="text" className="luxury-input text-sm" placeholder="+91 XXXX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              {!selectedUser && (
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Session Key (Password)</label>
                  <input 
                    type="password" required className="luxury-input text-sm" placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Clearance Level</label>
                  <select 
                    className="luxury-input bg-brand-background text-sm"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="CITIZEN">CITIZEN</option>
                    <option value="HEALTH_WORKER">FIELD WORKER</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Village coverage</label>
                  <select 
                    className="luxury-input bg-brand-background text-sm"
                    value={form.villageId}
                    onChange={(e) => setForm({ ...form, villageId: e.target.value })}
                  >
                    <option value="">-- Global / None --</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow"
                >
                  Save User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {pwOpen && resetUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
              <Key className="w-6 h-6 mr-2 text-brand-accent animate-pulse" /> Reset User Access Key
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">User Profile</span>
                <p className="text-sm font-bold text-white mt-1">{resetUser.name} ({resetUser.email})</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">New Password</label>
                <input 
                  type="password" required className="luxury-input text-sm" placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setPwOpen(false)}
                  className="flex-1 py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow"
                >
                  Save New Key
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageUsers;
