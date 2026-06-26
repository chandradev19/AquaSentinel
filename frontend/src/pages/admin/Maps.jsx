import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../../services/api';
import { Shield, Search, Filter, Activity, Users, Droplet, UserCheck, Calendar, Bell, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const Maps = () => {
  const [villages, setVillages] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('');
  
  const [selectedVillageData, setSelectedVillageData] = useState(null);
  const [isNodeLoading, setIsNodeLoading] = useState(false);

  const [heatmapMode, setHeatmapMode] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resVillages, resPreds] = await Promise.all([
        api.get('/admin/villages'),
        api.get('/admin/predictions')
      ]);
      setVillages(resVillages.data || []);
      setPredictions(resPreds.data || []);
    } catch (err) {
      console.error('Failed to load map data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNodeClick = async (village) => {
    try {
      setIsNodeLoading(true);
      setSelectedVillageData(null); // clear old data
      const res = await api.get(`/villages/${village.id}/intelligence`);
      setSelectedVillageData(res.data);
    } catch (err) {
      console.error('Failed to load node telemetry', err);
    } finally {
      setIsNodeLoading(false);
    }
  };

  // Color logic
  // 🟢 Low Risk (< 30), 🟡 Medium (30 - 60), 🟠 High (60 - 80), 🔴 Critical (> 80)
  const getRiskColor = (score) => {
    if (!score) return '#22C55E';
    if (score > 80) return '#EF4444'; // Critical
    if (score > 60) return '#F97316'; // High
    if (score >= 30) return '#EAB308'; // Medium
    return '#22C55E'; // Low
  };

  // Filtering
  const filteredVillages = villages.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.district && v.district.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesDisease = true;
    if (diseaseFilter) {
      const predForVillage = predictions.find(p => p.village?.id === v.id);
      if (!predForVillage || predForVillage.predictedDisease !== diseaseFilter) {
        matchesDisease = false;
      }
    }
    
    return matchesSearch && matchesDisease;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col space-y-6 pb-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Shield className="w-8 h-8 mr-3 text-brand-accent" />
            Geospatial Outbreak Intelligence Map
          </h1>
          <p className="text-brand-secondaryText mt-1 uppercase tracking-widest text-xs font-semibold">
            Tamil Nadu Early Warning Visual Database
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-secondaryText" />
            <input 
              type="text" 
              placeholder="Search villages or districts..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-white placeholder-brand-secondaryText focus:border-brand-accent transition-all outline-none"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-secondaryText" />
            <select 
              value={diseaseFilter}
              onChange={e => setDiseaseFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-white focus:border-brand-accent transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">All Pathogens</option>
              <option value="Cholera">Cholera Threat</option>
              <option value="Typhoid">Typhoid Threat</option>
              <option value="Diarrhea">Diarrhea Threat</option>
              <option value="Hepatitis A">Hepatitis A Threat</option>
              <option value="Dysentery">Dysentery Threat</option>
            </select>
          </div>

          <button 
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${heatmapMode ? 'bg-brand-accent text-white border-brand-accent shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-brand-background text-brand-secondaryText border-brand-border hover:border-brand-accent hover:text-white'}`}
          >
            {heatmapMode ? 'Disable Heatmap' : 'Live Heatmap'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[650px]">
        
        {/* Map Area */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-brand-border shadow-luxury">
          {loading ? (
            <div className="absolute inset-0 bg-brand-background/80 flex items-center justify-center z-[1000]">
              <div className="w-12 h-12 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
            </div>
          ) : null}
          
          <MapContainer 
            center={[11.1271, 78.6569]} // Tamil Nadu Center
            zoom={7} 
            style={{ height: '100%', width: '100%', background: '#070B14' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            {filteredVillages.map(v => {
              if (!v.latitude || !v.longitude) return null;
              const isCritical = v.riskScore > 80;
              const color = getRiskColor(v.riskScore);
              
              return (
                <CircleMarker
                  key={v.id}
                  center={[v.latitude, v.longitude]}
                  radius={heatmapMode ? (v.riskScore > 60 ? 35 : 20) : 12}
                  fillColor={color}
                  color={color}
                  weight={heatmapMode ? 0 : (isCritical ? 3 : 1.5)}
                  opacity={heatmapMode ? 0 : 0.8}
                  fillOpacity={heatmapMode ? (v.riskScore > 60 ? 0.3 : 0.1) : 0.6}
                  className={heatmapMode && isCritical ? 'animate-pulse' : ''}
                  eventHandlers={{
                    click: () => handleNodeClick(v)
                  }}
                >
                  {!heatmapMode && (
                    <Popup>
                      <div className="text-brand-background p-1 min-w-[120px]">
                        <strong className="block text-sm font-black mb-1">{v.name}</strong>
                        <div className="flex justify-between text-xs font-semibold border-t pt-1 border-gray-200">
                          <span>Risk:</span>
                          <span style={{color}}>{v.riskScore?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Cases:</span>
                          <span className="text-red-500">{v.activeCases || 0}</span>
                        </div>
                      </div>
                    </Popup>
                  )}
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Selected Node Details (Sidebar) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 border border-brand-border h-full overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-black text-white mb-4 uppercase tracking-widest border-b border-brand-border/50 pb-2">
              Node Telemetry
            </h3>
            
            {isNodeLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin mb-4" />
                <p className="text-xs text-brand-secondaryText uppercase tracking-widest font-bold">Uplinking Data...</p>
              </div>
            ) : selectedVillageData ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Title */}
                <div>
                  <h4 className="text-2xl font-black text-white">{selectedVillageData.village?.name}</h4>
                  <p className="text-xs text-brand-secondaryText uppercase font-bold tracking-widest">{selectedVillageData.village?.district}</p>
                </div>
                
                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                    <div className="flex items-center space-x-1.5 text-brand-accent mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase font-bold tracking-wider">Population</span>
                    </div>
                    <p className="text-base font-black text-white">{selectedVillageData.village?.population?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-brand-background border border-brand-border rounded-xl">
                    <div className="flex items-center space-x-1.5 text-brand-danger mb-1">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase font-bold tracking-wider">Active Cases</span>
                    </div>
                    <p className="text-base font-black text-white">{selectedVillageData.village?.activeCases || 0}</p>
                  </div>
                </div>

                {/* Risk & Quality */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-brand-background border border-brand-border rounded-xl">
                    <span className="text-[10px] text-brand-secondaryText font-bold uppercase tracking-wider">Risk Score</span>
                    <span className={`text-sm font-black px-2 py-0.5 rounded ${
                        selectedVillageData.village?.riskScore > 80 ? 'text-brand-danger bg-brand-danger/10' : 
                        selectedVillageData.village?.riskScore >= 60 ? 'text-orange-500 bg-orange-500/10' : 
                        selectedVillageData.village?.riskScore >= 30 ? 'text-brand-warning bg-brand-warning/10' : 
                        'text-brand-success bg-brand-success/10'
                      }`}>
                      {selectedVillageData.village?.riskScore?.toFixed(1) || 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-brand-background border border-brand-border rounded-xl">
                    <span className="text-[10px] text-brand-secondaryText font-bold uppercase tracking-wider">Water Quality</span>
                    <span className={`text-xs font-black flex items-center ${selectedVillageData.village?.waterQualityStatus === 'SAFE' ? 'text-brand-success' : selectedVillageData.village?.waterQualityStatus === 'CONTAMINATED' ? 'text-brand-danger' : 'text-brand-warning'}`}>
                      <Droplet className="w-3.5 h-3.5 mr-1" />
                      {selectedVillageData.village?.waterQualityStatus || 'UNKNOWN'}
                    </span>
                  </div>
                </div>

                {/* Assigned Worker & Inspection */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-brand-surface border border-brand-border rounded-xl">
                    <UserCheck className="w-4 h-4 text-brand-accent shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-brand-secondaryText uppercase tracking-wider">Assigned Agent</p>
                      <p className="text-xs font-black text-white mt-0.5">{selectedVillageData.assignedWorker?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-brand-surface border border-brand-border rounded-xl">
                    <Calendar className="w-4 h-4 text-brand-accent shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-brand-secondaryText uppercase tracking-wider">Last Inspection</p>
                      <p className="text-xs font-black text-white mt-0.5">
                        {selectedVillageData.village?.lastSurveyDate ? new Date(selectedVillageData.village.lastSurveyDate).toLocaleDateString() : 'No Record'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Disease Trend Summary */}
                {selectedVillageData.prediction && (
                  <div className="p-4 border border-brand-danger/30 bg-brand-danger/5 rounded-xl">
                    <p className="text-[9px] font-bold text-brand-danger uppercase tracking-wider mb-2 flex items-center">
                      <Activity className="w-3 h-3 mr-1" /> Disease Trend Alert
                    </p>
                    <p className="text-sm font-black text-white">
                      {selectedVillageData.prediction.predictedDisease} ({selectedVillageData.prediction.outbreakProbability?.toFixed(1)}% Prob)
                    </p>
                    <p className="text-xs text-brand-secondaryText mt-1">Expected to spread {selectedVillageData.prediction.expectedSpreadRadius?.toFixed(1)}km in 7 days.</p>
                  </div>
                )}

                {/* Active Alerts */}
                {selectedVillageData.alerts && selectedVillageData.alerts.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-brand-secondaryText uppercase tracking-wider mb-2 flex items-center">
                      <Bell className="w-3 h-3 mr-1" /> Active Alerts ({selectedVillageData.alerts.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedVillageData.alerts.map(a => (
                        <div key={a.id} className="p-2.5 rounded-lg border border-brand-warning/30 bg-brand-warning/10 text-brand-warning text-[10px] font-bold">
                          {a.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-16 text-brand-secondaryText flex flex-col items-center border border-dashed border-brand-border rounded-xl">
                <HelpCircle className="w-10 h-10 mb-3 opacity-30 text-brand-accent" />
                <p className="text-xs font-bold uppercase tracking-widest max-w-[180px]">Select a node on the map to inspect live telemetry</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Maps;
