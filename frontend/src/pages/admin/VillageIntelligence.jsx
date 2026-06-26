import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Shield, MapPin, Users, Activity, FileText, Stethoscope, Droplet, Clock, ChevronLeft, Map as MapIcon, Phone, UserCheck, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const VillageIntelligence = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/villages/${id}/intelligence`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || !data.village) {
    return <div className="text-center text-white mt-20">Village Intelligence Data Not Found.</div>;
  }

  const { village, totalReports, emergencyStatus, assignedWorkers, nearbyHospitals, aiPrediction, riskTimeline } = data;

  // Format chart data
  const chartData = (riskTimeline || []).map(entry => ({
    time: new Date(entry.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    riskScore: entry.riskScore,
    cases: entry.activeCases
  }));

  // Fallback map center if no village coords
  const mapCenter = [village.latitude || 20.5937, village.longitude || 78.9629];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-border text-brand-secondaryText hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{village.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                emergencyStatus === 'CRITICAL' ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/50' :
                emergencyStatus === 'ELEVATED' ? 'bg-brand-warning/20 text-brand-warning border-brand-warning/50' :
                'bg-brand-success/20 text-brand-success border-brand-success/50'
              }`}>
                {emergencyStatus} STATUS
              </span>
            </div>
            <p className="text-brand-secondaryText text-sm mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1" /> {village.district}, {village.state}
            </p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all shadow-glow flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" /> Declare Emergency
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center space-x-2 text-brand-secondaryText mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Population</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{village.population || 'Unknown'}</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-brand-warning">
          <div className="flex items-center space-x-2 text-brand-secondaryText mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Active Cases</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{village.activeCases || 0}</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-brand-accent">
          <div className="flex items-center space-x-2 text-brand-secondaryText mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{totalReports}</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-l-brand-danger">
          <div className="flex items-center space-x-2 text-brand-secondaryText mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Risk Score</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{village.riskScore ? village.riskScore.toFixed(1) : 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Prediction Card */}
          <div className="glass-panel border border-brand-border overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-brand-accent/20 rounded-xl">
                  <Activity className="w-6 h-6 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">AI Disease Prediction Engine</h3>
              </div>
              
              {aiPrediction ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-bold text-brand-secondaryText uppercase tracking-wider mb-2">Predicted Pathogen</h4>
                    <p className="text-4xl font-black text-brand-danger mb-4 tracking-tight">{aiPrediction.predictedDisease}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold uppercase mb-1">
                          <span className="text-brand-secondaryText">Prediction Confidence</span>
                          <span className="text-brand-accent">{aiPrediction.outbreakProbability?.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-brand-background rounded-full overflow-hidden">
                          <div className="h-full bg-brand-accent rounded-full" style={{ width: `${aiPrediction.outbreakProbability}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 bg-brand-background p-4 rounded-xl border border-brand-border">
                    <div className="flex justify-between items-center pb-3 border-b border-brand-border/50">
                      <span className="text-xs text-brand-secondaryText font-bold uppercase">Expected Cases (3 Days)</span>
                      <span className="text-lg font-bold text-white">{aiPrediction.expectedCases3Days}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-brand-border/50">
                      <span className="text-xs text-brand-secondaryText font-bold uppercase">Expected Cases (7 Days)</span>
                      <span className="text-lg font-bold text-white">{aiPrediction.expectedCases7Days}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-brand-border/50">
                      <span className="text-xs text-brand-secondaryText font-bold uppercase">Expected Spread Radius</span>
                      <span className="text-lg font-bold text-white">4.2 km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-brand-secondaryText font-bold uppercase">Recommended Action</span>
                      <span className="text-xs font-bold text-brand-warning uppercase bg-brand-warning/20 px-2 py-1 rounded">Mobilize Units</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-brand-secondaryText">
                  No active outbreak predictions for this village.
                </div>
              )}
            </div>
          </div>

          {/* Risk Timeline Chart */}
          <div className="glass-panel p-6 border border-brand-border">
            <h3 className="text-sm font-bold text-brand-secondaryText uppercase tracking-wider mb-6">Risk Assessment Timeline</h3>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} />
                    <YAxis stroke="#ffffff50" fontSize={12} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', color: '#fff' }}
                      itemStyle={{ color: '#ef4444' }}
                    />
                    <Area type="monotone" dataKey="riskScore" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" name="Risk Score" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-brand-secondaryText text-sm">
                  Insufficient historical data to plot timeline.
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Geospatial Map */}
          <div className="glass-panel border border-brand-border overflow-hidden flex flex-col h-[350px]">
            <div className="p-4 border-b border-brand-border bg-brand-surface flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                <MapIcon className="w-4 h-4 mr-2 text-brand-accent" /> Sector Map
              </h3>
            </div>
            <div className="flex-1 w-full bg-brand-background relative z-0">
              <MapContainer center={mapCenter} zoom={13} className="w-full h-full" zoomControl={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {village.latitude && village.longitude && (
                  <>
                    <Marker position={[village.latitude, village.longitude]}>
                      <Popup className="bg-brand-surface text-white">
                        <strong className="text-brand-accent">{village.name}</strong><br/>
                        Risk: {village.riskScore?.toFixed(1)}
                      </Popup>
                    </Marker>
                    <Circle 
                      center={[village.latitude, village.longitude]} 
                      radius={1500} 
                      pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 }}
                    />
                  </>
                )}
                {/* Render nearby hospitals */}
                {nearbyHospitals?.map((hosp, i) => {
                  // Mock offset coordinates for hospitals
                  const hLat = mapCenter[0] + (i === 0 ? 0.015 : -0.02);
                  const hLng = mapCenter[1] + (i === 0 ? -0.01 : 0.015);
                  return (
                    <Marker key={i} position={[hLat, hLng]} icon={hospitalIcon}>
                      <Popup>
                        <strong>{hosp.name}</strong><br/>
                        {hosp.distance}
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 border border-brand-border">
              <span className="text-[10px] uppercase font-bold text-brand-secondaryText block mb-1">Water Quality</span>
              <div className="flex items-center text-white">
                <Droplet className={`w-4 h-4 mr-2 ${village.waterQualityStatus === 'SAFE' ? 'text-brand-success' : 'text-brand-danger'}`} />
                <span className="text-sm font-bold">{village.waterQualityStatus || 'UNKNOWN'}</span>
              </div>
            </div>
            <div className="glass-panel p-4 border border-brand-border">
              <span className="text-[10px] uppercase font-bold text-brand-secondaryText block mb-1">Last Inspection</span>
              <div className="flex items-center text-white">
                <Clock className="w-4 h-4 mr-2 text-brand-accent" />
                <span className="text-sm font-bold">
                  {village.lastSurveyDate ? new Date(village.lastSurveyDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Personnel */}
          <div className="glass-panel p-6 border border-brand-border">
            <h3 className="text-xs font-bold text-brand-secondaryText uppercase tracking-wider mb-4 flex items-center">
              <Stethoscope className="w-4 h-4 mr-2" /> Assigned Field Workers
            </h3>
            {assignedWorkers && assignedWorkers.length > 0 ? (
              <div className="space-y-4">
                {assignedWorkers.map((worker) => (
                  <div key={worker.id} className="flex items-center justify-between p-3 bg-brand-background rounded-lg border border-brand-border/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold">
                        {worker.email.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{worker.email}</p>
                        <p className="text-[10px] text-brand-secondaryText">{worker.phone}</p>
                      </div>
                    </div>
                    <button className="text-brand-accent hover:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-secondaryText italic">No active personnel assigned.</p>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default VillageIntelligence;
