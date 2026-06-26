import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Map, Users, Droplets, Activity, Plus, Edit2, Trash2, UserCheck, Eye, Loader, Info, Cpu, History, FileText, RotateCw, Brain } from 'lucide-react';

const ManageVillages = () => {
  const navigate = useNavigate();
  const [villages, setVillages] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState(null);
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignVillage, setAssignVillage] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailedVillage, setDetailedVillage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    district: '',
    state: '',
    latitude: 20.5937,
    longitude: 78.9629,
    population: '',
    riskScore: 0,
    activeCases: 0,
    waterQualityStatus: 'UNKNOWN',
    waterSources: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resVillages = await api.get('/admin/villages');
      setVillages(resVillages.data || []);
      
      const resUsers = await api.get('/admin/users');
      // Filter HEALTH_WORKERs
      const healthWorkers = (resUsers.data || []).filter(u => u.role === 'HEALTH_WORKER');
      setWorkers(healthWorkers);
    } catch (error) {
      console.error('Failed to fetch villages data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveVillage = async (e) => {
    e.preventDefault();
    try {
      if (selectedVillage) {
        // Edit village
        await api.put(`/admin/villages/${selectedVillage.id}`, {
          ...form,
          population: form.population ? Number(form.population) : 0,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude)
        });
        alert('Village metrics updated!');
      } else {
        // Create village
        await api.post('/admin/villages', {
          ...form,
          population: form.population ? Number(form.population) : 0,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude)
        });
        alert('New village added to surveillance grid.');
      }
      setModalOpen(false);
      setSelectedVillage(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save village.');
    }
  };

  const handleDeleteVillage = async (id) => {
    if (window.confirm('Delete this village node? All coverage metrics will be removed.')) {
      try {
        await api.delete(`/admin/villages/${id}`);
        alert('Village deleted successfully.');
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to delete village.');
      }
    }
  };

  const handleAssignWorker = async (e) => {
    e.preventDefault();
    if (!assignVillage || !selectedWorkerId) return;
    try {
      await api.post(`/admin/villages/${assignVillage.id}/assign-worker`, {
        workerId: Number(selectedWorkerId)
      });
      alert('Field worker assigned to coverage node successfully!');
      setAssignOpen(false);
      setAssignVillage(null);
      setSelectedWorkerId('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign worker.');
    }
  };

  const openEditModal = (v) => {
    setSelectedVillage(v);
    setForm({
      name: v.name,
      district: v.district || '',
      state: v.state || '',
      latitude: v.latitude || 20.5937,
      longitude: v.longitude || 78.9629,
      population: v.population || '',
      riskScore: v.riskScore || 0,
      activeCases: v.activeCases || 0,
      waterQualityStatus: v.waterQualityStatus || 'UNKNOWN',
      waterSources: v.waterSources || ''
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      district: '',
      state: '',
      latitude: 20.5937,
      longitude: 78.9629,
      population: '',
      riskScore: 0,
      activeCases: 0,
      waterQualityStatus: 'UNKNOWN',
      waterSources: ''
    });
  };

  const getWorkerForVillage = (villageId) => {
    const assignedWorker = workers.find(w => w.village && w.village.id === villageId);
    return assignedWorker ? assignedWorker.name : 'Unassigned';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-accent/20 rounded-xl">
            <Map className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Village Surveillance Management</h1>
            <p className="text-brand-secondaryText mt-1">Manage all geographical monitoring nodes, risk statistics, and assigned personnel.</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setSelectedVillage(null);
            resetForm();
            setModalOpen(true);
          }}
          className="px-6 py-3 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center shadow-glow"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Village
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
                <th scope="col" className="px-6 py-4 tracking-widest">Village Name</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Population</th>
                <th scope="col" className="px-6 py-4 tracking-widest">District</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Water Sources</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Risk Score</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Water Quality</th>
                <th scope="col" className="px-6 py-4 tracking-widest">Assigned Worker</th>
                <th scope="col" className="px-6 py-4 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {villages.map(v => (
                <tr key={v.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{v.name}</td>
                  <td className="px-6 py-4 font-mono">{v.population?.toLocaleString() || 'N/A'}</td>
                  <td className="px-6 py-4">{v.district || 'N/A'}</td>
                  <td className="px-6 py-4 text-xs truncate max-w-[120px]" title={v.waterSources}>{v.waterSources || 'N/A'}</td>
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    <span className={`px-2 py-0.5 rounded-sm text-xs ${v.riskScore > 80 ? 'text-brand-danger bg-brand-danger/10' : v.riskScore > 30 ? 'text-brand-warning bg-brand-warning/10' : 'text-brand-success bg-brand-success/10'}`}>
                      {v.riskScore?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">
                    <span className={v.waterQualityStatus === 'SAFE' ? 'text-brand-success' : v.waterQualityStatus === 'CONTAMINATED' ? 'text-brand-danger animate-pulse' : 'text-brand-secondaryText'}>
                      {v.waterQualityStatus || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {getWorkerForVillage(v.id)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                    <button 
                      onClick={() => navigate(`/admin/villages/${v.id}/digital-twin`)}
                      title="Digital Twin Console"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-accent hover:text-white text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/village-intelligence/${v.id}`)}
                      title="Village Intelligence"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-accent hover:text-white text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <Brain className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/reports?villageId=${v.id}`)}
                      title="View Reports"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-accent hover:text-white text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await api.post(`/admin/villages/${v.id}/recalculate-risk`);
                          alert('Outbreak Risk Score dynamically generated!');
                          fetchData();
                        } catch (err) {
                          console.error(err);
                          alert('Risk calculation failure.');
                        }
                      }}
                      title="Generate Risk Score"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-warning hover:text-white text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setDetailedVillage(v);
                        setDetailsOpen(true);
                      }}
                      title="View Details"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-accent hover:text-white text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setAssignVillage(v);
                        const current = workers.find(w => w.village && w.village.id === v.id);
                        setSelectedWorkerId(current ? current.id : '');
                        setAssignOpen(true);
                      }}
                      title="Assign Officer"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-accent hover:text-white text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => openEditModal(v)}
                      title="Edit Node"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-warning hover:text-brand-warning text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteVillage(v.id)}
                      title="Delete Node"
                      className="p-1.5 bg-brand-surface border border-brand-border hover:border-brand-danger hover:text-brand-danger text-brand-secondaryText rounded-lg transition-all inline-flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT VILLAGE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
              <Map className="w-6 h-6 mr-2 text-brand-accent" /> 
              {selectedVillage ? 'Edit Coverage Node' : 'Register New Coverage Node'}
            </h3>
            <form onSubmit={handleSaveVillage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Village Name</label>
                  <input 
                    type="text" required className="luxury-input text-sm" placeholder="e.g. Kattur"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">District</label>
                  <input 
                    type="text" required className="luxury-input text-sm" placeholder="Coimbatore"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">State</label>
                  <input 
                    type="text" required className="luxury-input text-sm" placeholder="Tamil Nadu"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Latitude</label>
                  <input 
                    type="number" step="0.0001" required className="luxury-input text-sm"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Longitude</label>
                  <input 
                    type="number" step="0.0001" required className="luxury-input text-sm"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Population</label>
                  <input 
                    type="number" required className="luxury-input text-sm" placeholder="3450"
                    value={form.population}
                    onChange={(e) => setForm({ ...form, population: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Water Quality Status</label>
                  <select 
                    className="luxury-input bg-brand-background text-sm"
                    value={form.waterQualityStatus}
                    onChange={(e) => setForm({ ...form, waterQualityStatus: e.target.value })}
                  >
                    <option value="UNKNOWN">UNKNOWN</option>
                    <option value="SAFE">SAFE</option>
                    <option value="CONTAMINATED">CONTAMINATED</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Water Sources (Comma separated)</label>
                  <input 
                    type="text" required className="luxury-input text-sm" placeholder="e.g. Borewell, Local Well, River Palar"
                    value={form.waterSources}
                    onChange={(e) => setForm({ ...form, waterSources: e.target.value })}
                  />
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
                  Save Node
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ASSIGN WORKER MODAL */}
      {assignOpen && assignVillage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
              <UserCheck className="w-6 h-6 mr-2 text-brand-accent" /> Assign Field Health Officer
            </h3>
            <form onSubmit={handleAssignWorker} className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondaryText">Coverage Node</span>
                <p className="text-sm font-bold text-white mt-1">{assignVillage.name} ({assignVillage.district})</p>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Select Health Officer</label>
                <select 
                  required
                  className="luxury-input bg-brand-background text-sm"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                >
                  <option value="">-- Choose Officer --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setAssignOpen(false)}
                  className="flex-1 py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!selectedWorkerId}
                  className="flex-1 py-3 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow disabled:opacity-50"
                >
                  Confirm Officer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {detailsOpen && detailedVillage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-panel max-w-md w-full p-8 border border-brand-border space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-brand-border/50 pb-2 uppercase tracking-wider flex items-center">
              <Info className="w-6 h-6 mr-2 text-brand-accent" /> Node Telemetry Dossier
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-black text-white">{detailedVillage.name}</h4>
                <p className="text-xs text-brand-secondaryText uppercase font-semibold">{detailedVillage.district}, {detailedVillage.state}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                  <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Population</span>
                  <strong className="text-lg text-white font-mono mt-1 block">{detailedVillage.population?.toLocaleString() || 'N/A'}</strong>
                </div>
                <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                  <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Active Cases</span>
                  <strong className="text-lg text-white font-mono mt-1 block">{detailedVillage.activeCases || 0} Cases</strong>
                </div>
                <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                  <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">AI Risk Score</span>
                  <strong className="text-lg text-white font-mono mt-1 block">{detailedVillage.riskScore?.toFixed(1) || 0}%</strong>
                </div>
                <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                  <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Water Status</span>
                  <strong className="text-lg text-white mt-1 block uppercase">{detailedVillage.waterQualityStatus || 'UNKNOWN'}</strong>
                </div>
              </div>

              <div className="p-4 bg-brand-background border border-brand-border rounded-xl">
                <span className="text-[10px] text-brand-secondaryText uppercase font-bold tracking-wider block">Assigned Officer</span>
                <p className="text-sm font-semibold text-white mt-1">{getWorkerForVillage(detailedVillage.id)}</p>
                <p className="text-[10px] text-brand-secondaryText font-mono mt-0.5">Coordinates: Lat {detailedVillage.latitude?.toFixed(4)}, Lng {detailedVillage.longitude?.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex pt-4 border-t border-brand-border/50">
              <button 
                type="button" 
                onClick={() => setDetailsOpen(false)}
                className="w-full py-3 bg-brand-surface border border-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Close Dossier
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageVillages;
