import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('vietphuc_token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục phiên đăng nhập khi khởi động trang
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vietphuc_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setToken(storedToken);
        } else {
          // Token hết hạn hoặc không hợp lệ
          localStorage.removeItem('vietphuc_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Lỗi kiểm tra phiên đăng nhập:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Đăng nhập không thành công' };
      }

      localStorage.setItem('vietphuc_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'Không thể kết nối đến máy chủ xác thực' };
    }
  };

  const register = async (username, email, password, full_name) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, full_name })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Đăng ký không thành công' };
      }

      localStorage.setItem('vietphuc_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
  };

  const logout = () => {
    localStorage.removeItem('vietphuc_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
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
