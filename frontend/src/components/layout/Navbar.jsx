import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Search, Bell, Activity, Server, 
  Menu, X, Command, Cpu, ShieldCheck, Trash2, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    updateStatus, 
    markAllRead, 
    deleteNotification 
  } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);



  return (
    <nav className="h-20 bg-brand-surface/80 backdrop-blur-lg border-b border-brand-border flex items-center justify-between px-6 sticky top-0 z-10 transition-all duration-300">
      
      {/* Left side: Hamburger (mobile) and Global Search */}
      <div className="flex items-center flex-1">
        <button 
          onClick={toggleSidebar}
          className="mr-4 p-2 text-brand-secondaryText hover:text-white rounded-lg hover:bg-brand-card transition-colors md:hidden"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <div className="hidden md:flex relative group w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-brand-secondaryText group-focus-within:text-brand-accent transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search intelligence, villages, reports..." 
            className="w-full bg-brand-card border border-brand-border/50 text-brand-primaryText text-sm rounded-xl focus:ring-1 focus:ring-brand-accent focus:border-brand-accent block pl-10 p-2.5 transition-all shadow-inner placeholder-brand-secondaryText focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] outline-none"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="flex items-center text-[10px] text-brand-secondaryText font-medium bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded">
              <Command className="w-3 h-3 mr-1" /> K
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Intelligence Indicators and Actions */}
      <div className="flex items-center space-x-6">
        
        {/* System Health Status */}
        <div className="hidden lg:flex items-center space-x-4 pr-6 border-r border-brand-border/50">
          <div className="flex flex-col items-end">
            <div className="flex items-center text-xs text-brand-secondaryText font-medium">
              <Server className="w-3.5 h-3.5 mr-1.5" />
              SYSTEM HEALTH
            </div>
            <div className="flex items-center mt-0.5">
              <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse mr-2 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="text-sm font-semibold text-white">99.9% Optimal</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center text-xs text-brand-secondaryText font-medium">
              <Cpu className="w-3.5 h-3.5 mr-1.5" />
              AI STATUS
            </div>
            <div className="flex items-center mt-0.5">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
              <span className="text-sm font-semibold text-white">Active (v4.2)</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center text-xs text-brand-secondaryText font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              THREAT LEVEL
            </div>
            <div className="flex items-center mt-0.5">
              <span className="text-sm font-semibold text-brand-success">Low</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-brand-secondaryText hover:text-white rounded-xl hover:bg-brand-card transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-brand-danger text-white text-[8px] font-black rounded-full flex items-center justify-center border border-brand-surface shadow-glow">
                {unreadCount}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-brand-surface border border-brand-border rounded-2xl shadow-luxury overflow-hidden z-50"
              >
                <div className="p-4 border-b border-brand-border/50 flex justify-between items-center bg-brand-card/50">
                  <h3 className="text-sm font-semibold text-white">Alerts & Warnings</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] text-brand-accent hover:underline font-bold uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-brand-border/30">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-brand-secondaryText">
                      No recent notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.isRead && markAsRead(n.id)}
                        className={`p-4 hover:bg-brand-card/30 cursor-pointer transition-colors relative group ${!n.isRead ? 'bg-brand-accent/5' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start flex-1">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? (n.riskLevel === 'CRITICAL' ? 'bg-brand-danger' : 'bg-brand-accent animate-pulse') : 'bg-transparent'}`} />
                            <div className="ml-2.5 w-full">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                                  n.riskLevel === 'CRITICAL' ? 'bg-brand-danger/20 text-brand-danger border border-brand-danger/30' :
                                  n.riskLevel === 'HIGH' ? 'bg-brand-warning/20 text-brand-warning border border-brand-warning/30' :
                                  'bg-white/10 text-brand-secondaryText'
                                }`}>
                                  {n.notificationType || 'SYSTEM'}
                                </span>
                                <span className="text-[9px] text-brand-secondaryText font-mono">
                                  {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <p className={`text-xs ${!n.isRead ? 'text-white font-bold' : 'text-brand-secondaryText'}`}>
                                {n.message}
                              </p>
                              
                              {/* Status Badges and Actions */}
                              {n.riskLevel && user?.role !== 'CITIZEN' && (
                                <div className="mt-2 flex items-center justify-between">
                                  <span className={`text-[9px] uppercase font-bold tracking-widest ${n.status === 'NEW' ? 'text-brand-accent' : 'text-brand-success'}`}>
                                    Status: {n.status}
                                  </span>
                                  {n.status === 'NEW' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateStatus(n.id, 'ACKNOWLEDGED'); }}
                                      className="text-[9px] flex items-center text-brand-accent hover:text-white transition-colors uppercase font-bold tracking-wider"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" /> Acknowledge
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="text-brand-secondaryText hover:text-brand-danger opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
