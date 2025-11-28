import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // First, get CSRF token
      await authAPI.getCsrfToken();
      
      // Then attempt login
      const response = await authAPI.login(credentials);
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const sendLoginPin = async (phone_number) => {
    try {
      await authAPI.getCsrfToken();
      await authAPI.sendLoginPin({ phone_number });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send login code',
      };
    }
  };

  const verifyLoginPin = async ({ phone_number, pin }) => {
    try {
      await authAPI.getCsrfToken();
      const response = await authAPI.verifyLoginPin({ phone_number, pin });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const newUser = response.data.user;
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    loading,
    login,
    sendLoginPin,
    verifyLoginPin,
    register,
    logout,
    isAuthenticated: !!user,
    isHomeowner: user?.user_type === 'homeowner',
    isMaid: user?.user_type === 'maid',
    isCleaningCompany: user?.user_type === 'cleaning_company',
    isHomeNurse: user?.user_type === 'home_nurse',
    isAdmin: user?.user_type === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
