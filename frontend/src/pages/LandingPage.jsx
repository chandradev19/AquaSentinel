import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Activity, Droplet, Map, ChevronRight, BarChart3, Network } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-brand-background text-brand-primaryText overflow-hidden font-sans">
      
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-brand-accent" />
          <span className="text-xl font-bold tracking-tight text-white">AquaShield AI</span>
        </div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-sm text-brand-secondaryText hover:text-white transition-colors">Intelligence</a>
          <a href="#analytics" className="text-sm text-brand-secondaryText hover:text-white transition-colors">Platform</a>
          <a href="#network" className="text-sm text-brand-secondaryText hover:text-white transition-colors">Network</a>
        </div>
        <div className="flex space-x-4">
          <Link to="/login" className="text-sm font-medium text-brand-secondaryText hover:text-white transition-colors flex items-center">
            Sign In
          </Link>
          <Link to="/register" className="text-sm font-medium bg-white text-brand-background px-5 py-2 rounded-full hover:bg-gray-200 transition-colors">
            Request Access
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-5xl overflow-hidden -z-10 pointer-events-none opacity-20">
          <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-brand-accent rounded-full mix-blend-screen filter blur-[128px] opacity-30"></div>
          <div className="absolute top-[40%] right-[20%] w-[500px] h-[500px] bg-brand-success rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 bg-brand-surface border border-brand-border rounded-full px-4 py-1.5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
          <span className="text-xs font-medium text-brand-secondaryText uppercase tracking-wider">System Status: Active Monitoring</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white max-w-5xl leading-tight mb-8"
        >
          Predicting Outbreaks <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Before They Spread</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-brand-secondaryText max-w-2xl mb-12 leading-relaxed"
        >
          AI-powered disease intelligence platform helping governments protect communities from water-borne diseases with real-time risk assessment.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <Link to="/login" className="inline-flex justify-center items-center px-8 py-4 text-sm font-medium bg-white text-brand-background rounded-full hover:bg-gray-200 transition-colors">
            Enter Command Center
            <ChevronRight className="ml-2 w-4 h-4" />
          </Link>
        </motion.div>

      </div>

      {/* Floating Statistics Section */}
      <div className="relative max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="luxury-card p-8"
          >
            <Activity className="w-8 h-8 text-brand-accent mb-6" />
            <div className="text-4xl font-bold text-white mb-2">94.2%</div>
            <div className="text-sm font-medium text-brand-secondaryText uppercase tracking-wider">Prediction Accuracy</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="luxury-card p-8"
          >
            <Network className="w-8 h-8 text-brand-accent mb-6" />
            <div className="text-4xl font-bold text-white mb-2">1,248</div>
            <div className="text-sm font-medium text-brand-secondaryText uppercase tracking-wider">Active Sensor Nodes</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="luxury-card p-8"
          >
            <Droplet className="w-8 h-8 text-brand-accent mb-6" />
            <div className="text-4xl font-bold text-white mb-2">24/7</div>
            <div className="text-sm font-medium text-brand-secondaryText uppercase tracking-wider">Water Quality Monitoring</div>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default LandingPage;
