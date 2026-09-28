import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({ onOpenAuth }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateStudio = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth('/studio');
    } else {
      navigate('/studio');
    }
  };

  const handleNavigateProfile = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth('/profile');
    } else {
      navigate('/profile');
    }
  };

  return (
    <header className="editorial-header">
      {/* Brand Title */}
      <div
        className="brand-title"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
        title="Về Trang Giới Thiệu"
      >
        <div className="brand-seal">VP</div>
        <span>Việt Phục Remix</span>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className={`header-nav-btn ${location.pathname === '/catalog' ? 'active' : ''}`}
        >
          Khám Phá Di Sản
        </button>

        <button
          type="button"
          onClick={() => navigate('/advisor')}
          className={`header-nav-btn ${location.pathname === '/advisor' ? 'active' : ''}`}
        >
          Gợi Ý Bối Cảnh
        </button>

        <button
          type="button"
          onClick={handleNavigateStudio}
          className={`header-nav-btn ${location.pathname === '/studio' ? 'active' : ''}`}
        >
          Mix Studio AI
        </button>

        {/* User Account / Profile / Login Button */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleNavigateProfile}
            className={`header-nav-btn profile-btn ${location.pathname === '/profile' ? 'active' : ''}`}
            title="Xem hồ sơ và các Lookbook đã lưu"
          >
            <span className="profile-indicator">●</span>
            <span>Trang Cá Nhân ({user?.full_name?.split(' ')?.[0] || user?.username})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth && onOpenAuth()}
            className="header-login-btn"
            title="Đăng nhập tài khoản"
          >
            ĐĂNG NHẬP
          </button>
        )}
      </nav>
    </header>
  );
}

