import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const Alerts = () => {
  const { notifications } = useNotifications();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'WARNING': return <ShieldAlert className="w-6 h-6 text-brand-warning" />;
      case 'DANGER': return <ShieldAlert className="w-6 h-6 text-brand-danger" />;
      case 'SUCCESS': return <CheckCircle className="w-6 h-6 text-brand-success" />;
      default: return <Info className="w-6 h-6 text-brand-accent" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-accent/20 rounded-xl">
          <Bell className="w-8 h-8 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Alerts & Notifications</h1>
          <p className="text-brand-secondaryText mt-1">System broadcasts and critical health advisories.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {(!notifications || notifications.length === 0) ? (
          <div className="p-12 text-center text-brand-secondaryText">
            You have no active alerts at this time.
          </div>
        ) : (
          <div className="divide-y divide-brand-border/50">
            {notifications.map((alert, idx) => (
              <div key={idx} className="p-6 hover:bg-brand-surface/50 transition-colors flex gap-4">
                <div className="shrink-0 mt-1">
                  {getAlertIcon(alert.type || 'INFO')}
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium text-lg">{alert.message}</p>
                  <p className="text-sm text-brand-secondaryText">
                    {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Alerts;
