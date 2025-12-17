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

  const getStorage = () => {
    return localStorage;
  };

  useEffect(() => {
    // Check if user is logged in on mount.
    // Use localStorage for persistence; also migrate from sessionStorage if needed.
    const storage = getStorage();
    const storedUser = storage.getItem('user');
    const storedToken = storage.getItem('accessToken');

    if (!storedUser) {
      const sessionUser = sessionStorage.getItem('user');
      const sessionToken = sessionStorage.getItem('accessToken');
      if (sessionUser) storage.setItem('user', sessionUser);
      if (sessionToken) storage.setItem('accessToken', sessionToken);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
    }

    const finalUser = storage.getItem('user');
    if (finalUser) {
      try {
        const parsed = JSON.parse(finalUser);
        setUser(parsed);
      } catch (e) {
        storage.removeItem('user');
        storage.removeItem('accessToken');
      }
    } else if (storedToken && !storedUser) {
      // If we ever have a token but no user, clear it to avoid inconsistent state.
      storage.removeItem('accessToken');
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const userData = response.data.user;
      const accessToken = response.data.access;
      const storage = getStorage();
      if (accessToken) {
        storage.setItem('accessToken', accessToken);
      }
      setUser(userData);
      storage.setItem('user', JSON.stringify(userData));
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
      const response = await authAPI.verifyLoginPin({ phone_number, pin });
      const userData = response.data.user;
      const accessToken = response.data.access;
      const storage = getStorage();
      if (accessToken) {
        storage.setItem('accessToken', accessToken);
      }
      setUser(userData);
      storage.setItem('user', JSON.stringify(userData));
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

      // Do not auto-login or set the user here. However, we do persist the
      // access token so that follow-up API calls during registration (e.g.
      // creating cleaning company or home nurse profiles) are authenticated.
      const accessToken = response.data.access;
      const storage = getStorage();
      if (accessToken) {
        storage.setItem('accessToken', accessToken);
      }

      return { success: true, data: response.data };
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
      // Clear from both storages to keep state consistent between web and native
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
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
