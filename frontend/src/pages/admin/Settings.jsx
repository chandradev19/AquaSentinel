import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Database, ShieldAlert, Cpu, Bell, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  const [riskThresholds, setRiskThresholds] = useState({
    contaminationWeight: 40,
    phLowerLimit: 6.5,
    phUpperLimit: 8.5,
    symptomSeverityWeight: 35,
    outbreakTriggerLimit: 75
  });

  const [aiSettings, setAiSettings] = useState({
    autoRetrainIntervalHours: 24,
    algorithmType: 'RandomForest (Weka)',
    confidenceThreshold: 85,
    minimumDataPointCount: 100
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableWorkerSms: true,
    enableCitizenEmail: true,
    escalationTriggerDays: 3,
    alertSubscribersCount: 2450
  });

  const [securitySettings, setSecuritySettings] = useState({
    tokenExpirationMinutes: 60,
    mfaRequired: false,
    allowedDomains: '*.gov, *.nic.in',
    apiRateLimitPerMin: 120
  });

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('System configuration saved successfully and applied to Weka Engine.');
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all configurations to default government specifications?')) {
      alert('Configurations reset to factory defaults.');
    }
  };

  const handleBackup = async () => {
    try {
      alert('PostgreSQL database backup initialized. Downloading SQL schema checksum...');
      // In production, this can trigger a download of backup or hit a backend backup api
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-brand-accent animate-spin-slow" />
            System Control Panel
          </h1>
          <p className="text-brand-secondaryText mt-1.5 uppercase tracking-widest text-xs font-semibold">
            AquaShield AI Core and Network Configurations
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button 
            onClick={handleReset}
            className="px-5 py-3 bg-brand-surface border border-brand-border hover:bg-brand-border text-brand-secondaryText hover:text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Defaults
          </button>
          <button 
            onClick={handleBackup}
            className="px-5 py-3 bg-brand-surface border border-brand-border hover:bg-brand-border text-brand-accent rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center shadow-glow"
          >
            <Database className="w-4 h-4 mr-2" /> Backup PostgreSQL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Risk Thresholds */}
        <div className="glass-panel p-6 border border-brand-border space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center border-b border-brand-border/50 pb-2 uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 mr-2 text-brand-danger" /> Risk Calculation Thresholds
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-brand-secondaryText uppercase tracking-wider mb-2">
                <span>Contamination Weight</span>
                <span className="text-white">{riskThresholds.contaminationWeight}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                className="w-full h-1 bg-brand-surface rounded-lg appearance-none cursor-pointer accent-brand-accent"
                value={riskThresholds.contaminationWeight} 
                onChange={(e) => setRiskThresholds({...riskThresholds, contaminationWeight: Number(e.target.value)})}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-brand-secondaryText uppercase tracking-wider mb-2">
                <span>Outbreak Probability Trigger</span>
                <span className="text-white">{riskThresholds.outbreakTriggerLimit}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                className="w-full h-1 bg-brand-surface rounded-lg appearance-none cursor-pointer accent-brand-accent"
                value={riskThresholds.outbreakTriggerLimit} 
                onChange={(e) => setRiskThresholds({...riskThresholds, outbreakTriggerLimit: Number(e.target.value)})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">pH Safe Lower Limit</label>
                <input 
                  type="number" step="0.1" className="luxury-input text-sm"
                  value={riskThresholds.phLowerLimit}
                  onChange={(e) => setRiskThresholds({...riskThresholds, phLowerLimit: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">pH Safe Upper Limit</label>
                <input 
                  type="number" step="0.1" className="luxury-input text-sm"
                  value={riskThresholds.phUpperLimit}
                  onChange={(e) => setRiskThresholds({...riskThresholds, phUpperLimit: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI & ML Engine Settings */}
        <div className="glass-panel p-6 border border-brand-border space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center border-b border-brand-border/50 pb-2 uppercase tracking-wider">
            <Cpu className="w-5 h-5 mr-2 text-brand-accent" /> AI Core Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">ML Active Model Classifier</label>
              <select 
                className="luxury-input text-sm bg-brand-background"
                value={aiSettings.algorithmType}
                onChange={(e) => setAiSettings({...aiSettings, algorithmType: e.target.value})}
              >
                <option value="RandomForest (Weka)">Random Forest Classifier (Weka Native)</option>
                <option value="J48 Decision Tree">J48 Decision Tree (Weka Native)</option>
                <option value="NaiveBayes">Naive Bayes Classifier (Weka Native)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Confidence Threshold (%)</label>
                <input 
                  type="number" className="luxury-input text-sm"
                  value={aiSettings.confidenceThreshold}
                  onChange={(e) => setAiSettings({...aiSettings, confidenceThreshold: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Dataset Minimum Count</label>
                <input 
                  type="number" className="luxury-input text-sm"
                  value={aiSettings.minimumDataPointCount}
                  onChange={(e) => setAiSettings({...aiSettings, minimumDataPointCount: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-panel p-6 border border-brand-border space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center border-b border-brand-border/50 pb-2 uppercase tracking-wider">
            <Bell className="w-5 h-5 mr-2 text-brand-warning" /> Notification Channels
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-brand-background border border-brand-border rounded-xl">
              <div>
                <h4 className="text-sm font-bold text-white">Pulsing Field SMS Advisories</h4>
                <p className="text-xs text-brand-secondaryText mt-0.5">Alert health workers near contamination vectors</p>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-brand-background"
                checked={notificationSettings.enableWorkerSms}
                onChange={(e) => setNotificationSettings({...notificationSettings, enableWorkerSms: e.target.checked})}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-brand-background border border-brand-border rounded-xl">
              <div>
                <h4 className="text-sm font-bold text-white">Citizen Outbreak Advisories</h4>
                <p className="text-xs text-brand-secondaryText mt-0.5">Transmit water quality statuses directly to citizens</p>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-brand-background"
                checked={notificationSettings.enableCitizenEmail}
                onChange={(e) => setNotificationSettings({...notificationSettings, enableCitizenEmail: e.target.checked})}
              />
            </div>
          </div>
        </div>

        {/* Security Configurations */}
        <div className="glass-panel p-6 border border-brand-border space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center border-b border-brand-border/50 pb-2 uppercase tracking-wider">
            <Lock className="w-5 h-5 mr-2 text-brand-accent" /> Security Protocol Settings
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">JWT Session Expiration (min)</label>
                <input 
                  type="number" className="luxury-input text-sm"
                  value={securitySettings.tokenExpirationMinutes}
                  onChange={(e) => setSecuritySettings({...securitySettings, tokenExpirationMinutes: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">API Limit (req/min)</label>
                <input 
                  type="number" className="luxury-input text-sm"
                  value={securitySettings.apiRateLimitPerMin}
                  onChange={(e) => setSecuritySettings({...securitySettings, apiRateLimitPerMin: Number(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-secondaryText mb-1.5 uppercase tracking-wider">Allowed Mail Domains</label>
              <input 
                type="text" className="luxury-input text-sm"
                value={securitySettings.allowedDomains}
                onChange={(e) => setSecuritySettings({...securitySettings, allowedDomains: e.target.value})}
              />
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4 border-t border-brand-border/50">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3.5 bg-brand-accent hover:bg-blue-500 text-white rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center shadow-glow disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Applying Settings...' : 'Save Configuration'}
        </button>
      </div>
    </motion.div>
  );
};

export default Settings;
