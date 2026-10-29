import React, { createContext, useContext, useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  subscribeToAuthState,
  loginUser,
  registerStudent,
  logoutUser
} from '../services/authService';
import { DEMO_USERS } from '../services/demoSeedService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      // Default to demo student if no session in demo mode
      if (!currentUser && !localStorage.getItem('ecm_auth_user')) {
        setUser(DEMO_USERS.student);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setUser(res.user);
    return res.user;
  };

  const register = async (studentData) => {
    const res = await registerStudent(studentData);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || 'student', loading, login, register, logout }}>
      {children}
      <ToastContainer position="bottom-right" autoClose={3000} theme="light" />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
