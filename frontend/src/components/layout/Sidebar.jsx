import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { usePresentation } from '../../context/PresentationContext';
import { 
  LayoutDashboard, Map, Activity, Shield, Users, Stethoscope, 
  Bell, BarChart3, Cpu, Settings, FileClock, ChevronRight, LogOut, Globe, Clipboard, Droplet,
  Clock, MapPin, FileText, PlayCircle, Zap, X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { startDemo, isDemoActive, stopDemo } = usePresentation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const isActive = (path) => location.pathname === path;

  // Close drawer on nav click (mobile)
  const handleNavClick = () => {
    if (onClose) onClose();
  };

  // Role-filtered menu configuration
  const menuSections = [
    {
      title: "MAIN MODULES",
      items: [
        // Admin-only modules
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
        { name: 'Health War Room', path: '/admin/war-room', icon: Shield, roles: ['ADMIN', 'HEALTH_WORKER'] },
        { name: 'Villages', path: '/admin/villages', icon: Map, roles: ['ADMIN'] },
        { name: 'Reports', path: '/admin/reports', icon: Clipboard, roles: ['ADMIN'] },
        
        // Health Worker-only modules
        { name: 'Dashboard', path: '/worker/dashboard', icon: LayoutDashboard, roles: ['HEALTH_WORKER'] },
        { name: 'Verification Queue', path: '/worker/queue', icon: Clock, roles: ['HEALTH_WORKER'] },
        { name: 'My Villages', path: '/worker/villages', icon: MapPin, roles: ['HEALTH_WORKER'] },
        
        // Shared Worker/Admin modules
        { name: 'Water Quality', path: '/worker/water-testing', icon: Droplet, roles: ['HEALTH_WORKER', 'ADMIN'] },
        { name: 'Surveys', path: '/worker/surveys', icon: Clipboard, roles: ['HEALTH_WORKER', 'ADMIN'] },

        // Citizen-only modules
        { name: 'Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard, roles: ['CITIZEN'] },
        { name: 'Submit Report', path: '/citizen/report', icon: Clipboard, roles: ['CITIZEN'] },
        { name: 'My Reports', path: '/citizen/my-reports', icon: FileText, roles: ['CITIZEN'] },
        { name: 'Village Health', path: '/citizen/village-health', icon: Activity, roles: ['CITIZEN'] },
        
        // Shared Citizen/Worker modules
        { name: 'Alerts & Notifications', path: '/citizen/alerts', icon: Bell, roles: ['CITIZEN', 'HEALTH_WORKER'] },
        { name: 'My Profile', path: '/citizen/profile', icon: Settings, roles: ['CITIZEN', 'HEALTH_WORKER'] },

        // Admin-only metrics/monitoring/advanced panels
        { name: 'Alerts & Notifications', path: '/admin/alerts', icon: Bell, roles: ['ADMIN'] },
        { name: 'Health Workers', path: '/admin/workers', icon: Stethoscope, roles: ['ADMIN'] },
        { name: 'Citizens', path: '/admin/users', icon: Users, roles: ['ADMIN'] },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, roles: ['ADMIN'] },
        { name: 'SIH Grand Finale', path: '/admin/sih-demo', icon: Zap, roles: ['ADMIN'] },
        { name: 'AI Command Center', path: '/admin/ai-core', icon: Cpu, roles: ['ADMIN'] },
        { name: 'Disease Predictions', path: '/admin/disease-predictions', icon: Activity, roles: ['ADMIN'] },
        { name: 'Outbreak Simulator', path: '/admin/outbreak-simulator', icon: Activity, roles: ['ADMIN'] },
        { name: 'Maps', path: '/admin/maps', icon: Globe, roles: ['ADMIN'] },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: 'User Management', path: '/admin/users', icon: Users, roles: ['ADMIN'] },
        { name: 'Roles & Permissions', path: '/admin/users', icon: Shield, roles: ['ADMIN'] },
        { name: 'Audit Logs', path: '/admin/audit', icon: FileClock, roles: ['ADMIN'] },
        { name: 'Settings', path: '/admin/settings', icon: Settings, roles: ['ADMIN'] },
      ]
    }
  ];

  const getTopLevelConfig = () => {
    if (!user) return { path: '/login', label: 'Authenticate', icon: Shield };
    switch (user.role) {
      case 'ADMIN':
        return { path: '/admin/dashboard', label: 'National Overview', icon: Globe };
      case 'HEALTH_WORKER':
        return { path: '/worker/dashboard', label: 'Field Overview', icon: Globe };
      case 'CITIZEN':
      default:
        return { path: '/citizen/dashboard', label: 'Citizen Portal', icon: Globe };
    }
  };

  const topLevel = getTopLevelConfig();
  const TopIcon = topLevel.icon;

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || (user && item.roles.includes(user.role)))
  })).filter(section => section.items.length > 0);

  const getRoleLabel = () => {
    if (!user) return 'Visitor';
    switch (user.role) {
      case 'ADMIN': return 'Super Admin';
      case 'HEALTH_WORKER': return 'Field Officer';
      case 'CITIZEN': return 'Citizen Resident';
      default: return 'User';
    }
  };

  return (
    <aside className="w-64 bg-brand-background border-r border-brand-border h-screen flex flex-col flex-shrink-0 relative overflow-hidden z-20 font-sans">
      {/* Brand logo + mobile close button */}
      <div className="h-16 sm:h-24 flex items-center px-4 sm:px-6 border-b border-brand-border/50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent pointer-events-none" />
        <Shield className="w-7 h-7 sm:w-9 sm:h-9 text-brand-accent mr-3 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)] shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center">
            AquaShield AI
          </h1>
          <p className="text-[8px] sm:text-[9px] text-brand-secondaryText uppercase tracking-widest font-semibold mt-0.5 leading-tight">
            Health Intelligence & Early Warning
          </p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 p-1.5 rounded-lg text-brand-secondaryText hover:text-white hover:bg-brand-surface transition-colors md:hidden shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main navigation links */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6 custom-scrollbar">
        {/* Prominent National Overview/Dashboard top-level button */}
        <div className="mb-2 sm:mb-4">
          <NavLink
            to={topLevel.path}
            onClick={handleNavClick}
            className={({ isActive }) => `
              relative group flex items-center px-4 py-3 rounded-xl transition-all duration-300
              ${isActive ? 'text-white bg-brand-accent shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-brand-accent/50' : 'text-brand-secondaryText hover:text-white hover:bg-brand-surface/50'}
            `}
          >
            <div className="relative flex items-center w-full z-10">
              <TopIcon className="w-5 h-5 mr-3 shrink-0" />
              <span className="font-bold text-sm tracking-wide">{topLevel.label}</span>
            </div>
          </NavLink>
        </div>

        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1 sm:space-y-2">
            <h3 className="text-[10px] font-black text-brand-secondaryText tracking-widest pl-3 uppercase">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) => `
                      relative group flex items-center px-3.5 py-2.5 rounded-xl transition-all duration-300
                      ${isActive ? 'text-white bg-brand-surface border border-brand-border' : 'text-brand-secondaryText hover:text-white hover:bg-brand-surface/50'}
                    `}
                  >
                    {active && (
                      <motion.div 
                         layoutId="activeTabOutline" 
                        className="absolute inset-0 bg-brand-surface rounded-xl border border-brand-border shadow-[inset_3px_0_0_0_#3B82F6]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className="relative flex items-center w-full z-10">
                      <Icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${active ? 'text-brand-accent' : 'group-hover:text-brand-accent'}`} />
                      <span className="font-semibold text-xs tracking-wide">{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* AI System Status widget */}
        <div className="pt-4 border-t border-brand-border/50 space-y-3">
          <h3 className="text-[10px] font-black text-brand-secondaryText tracking-widest pl-3 uppercase">
            AI System Status
          </h3>
          <div className="space-y-2 pl-3">
            {[
              { name: 'Prediction Agent', status: 'Active' },
              { name: 'Risk Assessment', status: 'Active' },
              { name: 'Alert Generation', status: 'Active' },
              { name: 'Knowledge Agent', status: 'Active' },
              { name: 'Recommendation', status: 'Active' }
            ].map((agent) => (
              <div key={agent.name} className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-brand-secondaryText">{agent.name}</span>
                <span className="flex items-center text-brand-success uppercase tracking-widest text-[9px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-success mr-1.5 shadow-[0_0_6px_#22C55E] animate-pulse" />
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Account Management */}
      <div className="p-3 sm:p-4 border-t border-brand-border/50 bg-gradient-to-t from-brand-surface/50 to-transparent">
        {user?.role === 'ADMIN' && (
          <button
            onClick={isDemoActive ? stopDemo : startDemo}
            className={`flex items-center justify-center w-full px-4 py-2.5 sm:py-3 mb-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-glow border ${isDemoActive ? 'bg-brand-danger text-white border-brand-danger/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-brand-accent text-white border-brand-accent/50 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:bg-blue-600'}`}
          >
            <PlayCircle className={`w-4 h-4 mr-2 ${isDemoActive ? 'animate-pulse' : ''}`} />
            {isDemoActive ? 'STOP DEMO' : 'START SIH DEMO'}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2.5 mb-3 text-xs font-bold uppercase tracking-widest text-brand-secondaryText rounded-xl hover:bg-brand-surface hover:text-brand-danger transition-colors border border-transparent hover:border-brand-border/30"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Secure Logout
        </button>
        <div className="flex items-center p-2.5 rounded-xl bg-brand-surface/40 border border-brand-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-accent to-blue-800 flex items-center justify-center text-white text-xs font-black shadow-glow shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="ml-2.5 overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[9px] text-brand-secondaryText truncate uppercase tracking-widest font-semibold">{getRoleLabel()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
