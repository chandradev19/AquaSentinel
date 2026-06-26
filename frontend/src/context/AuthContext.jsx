import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  // Track whether login() was just called to prevent useEffect from overwriting the user
  const justLoggedIn = useRef(false);

  useEffect(() => {
    const fetchUser = async () => {
      // If login() just set user and token, skip the /me fetch — data is already fresh
      if (justLoggedIn.current) {
        justLoggedIn.current = false;
        setLoading(false);
        return;
      }

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('http://localhost:8080/api/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error("Failed to fetch user", error);
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          localStorage.removeItem('token');
          setToken(null);
        }
      } else {
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = (data) => {
    console.log('[Auth] Login called with:', { id: data.id, role: data.role, email: data.email });
    justLoggedIn.current = true;
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser({ id: data.id, name: data.name, email: data.email, role: data.role, villageId: data.villageId });
    console.log('[Auth] User state set, token stored');
  };

  const logout = () => {
    console.log('[Auth] Logout called');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
