import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenStudio
}) {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="editorial-header">
      {/* Brand Title */}
      <div
        className="brand-title"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('landing')}
        title="Về Trang Giới Thiệu"
      >
        <div className="brand-seal">VP</div>
        <span>Việt Phục Remix</span>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`header-nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
        >
          Khám Phá Di Sản
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenStudio) {
              onOpenStudio();
            } else {
              setActiveTab('studio');
            }
          }}
          className={`header-nav-btn ${activeTab === 'studio' ? 'active' : ''}`}
        >
          Mix Studio AI
        </button>

        {/* User Account / Profile / Login Button */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`header-nav-btn profile-btn ${activeTab === 'profile' ? 'active' : ''}`}
            title="Xem hồ sơ và các Lookbook đã lưu"
          >
            <span className="profile-indicator">●</span>
            <span>Trang Cá Nhân ({user?.full_name?.split(' ')?.[0] || user?.username})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
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
