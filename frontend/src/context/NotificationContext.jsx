import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  const [readIds, setReadIds] = useState(() => {
    try {
      if (!user) return [];
      const stored = localStorage.getItem(`read_notifications_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(`read_notifications_${user.id}`, JSON.stringify(readIds));
    }
  }, [readIds, user]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const res = await api.get('/auth/notifications');
      const fetched = res.data || [];

      const mapped = fetched.map((n) => ({
        ...n,
        isRead: readIds.includes(n.id),
      }));

      setNotifications(mapped);

      const critical = mapped.find(
        (n) =>
          n.riskLevel === 'CRITICAL' &&
          n.status === 'NEW' &&
          !n.isRead
      );

      if (critical && !emergencyAlert) {
        setEmergencyAlert(critical);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [token, emergencyAlert, readIds]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setEmergencyAlert(null);
      return;
    }

    let eventSource;

    try {
      const sseUrl = `https://aquasentinel-backend-v2.onrender.com/api/stream/notifications?token=${token}`;
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('INIT', (e) => {
        console.log('[SSE] Connected:', e.data);
      });

      eventSource.addEventListener('NOTIFICATION', (e) => {
        try {
          const payload = JSON.parse(e.data);

          console.log('[SSE] Received notification:', payload);

          payload.isRead = readIds.includes(payload.id);

          setNotifications((prev) => {
            const exists = prev.findIndex((n) => n.id === payload.id);

            if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = payload;
              return updated;
            }

            return [payload, ...prev];
          });

          if (
            payload.riskLevel === 'CRITICAL' &&
            payload.status === 'NEW' &&
            !payload.isRead
          ) {
            setEmergencyAlert(payload);
          } else if (
            payload.riskLevel === 'CRITICAL' &&
            payload.status !== 'NEW'
          ) {
            setEmergencyAlert((current) =>
              current?.id === payload.id ? null : current
            );
          }
        } catch (err) {
          console.error('[SSE] Parse error:', err);
        }
      });

      eventSource.onerror = (e) => {
        console.error('[SSE] Error:', e);
      };
    } catch (err) {
      console.error('[SSE] Setup error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, readIds]);

  const markAsRead = async (id) => {
    setReadIds((prev) => [...new Set([...prev, id])]);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );

    if (emergencyAlert?.id === id) {
      setEmergencyAlert(null);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/auth/notifications/${id}/status`, { status });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status, isRead: true } : n
        )
      );

      setReadIds((prev) => [...new Set([...prev, id])]);

      if (emergencyAlert?.id === id) {
        setEmergencyAlert(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const allIds = notifications.map((n) => n.id);

    setReadIds((prev) => [...new Set([...prev, ...allIds])]);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );

    setEmergencyAlert(null);
  };

  const deleteNotification = async (id) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== id)
    );

    if (emergencyAlert?.id === id) {
      setEmergencyAlert(null);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        emergencyAlert,
        dismissEmergencyAlert: () => setEmergencyAlert(null),
        markAsRead,
        updateStatus,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};