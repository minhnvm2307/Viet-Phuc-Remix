import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (tab === 'login') {
      const res = await login(username, password);
      setIsSubmitting(false);
      if (res.success) {
        onSuccess?.(res.user);
        onClose();
      } else {
        setErrorMsg(res.error);
      }
    } else {
      if (!email.includes('@')) {
        setErrorMsg('Vui lòng nhập định dạng email hợp lệ');
        setIsSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Mật khẩu tối thiểu 6 ký tự');
        setIsSubmitting(false);
        return;
      }

      const res = await register(username, email, password, fullName);
      setIsSubmitting(false);
      if (res.success) {
        onSuccess?.(res.user);
        onClose();
      } else {
        setErrorMsg(res.error);
      }
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} title="Đóng">
          ✕
        </button>

        <div className="auth-modal-header">
          <div className="auth-brand-badge">VIỆT PHỤC REMIX</div>
          <h2 className="auth-modal-title">
            {tab === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Thành Viên'}
          </h2>
          <p className="auth-modal-subtitle">
            {tab === 'login'
              ? 'Đăng nhập để lưu trữ các bộ Lookbook phối đồ di sản độc bản của bạn.'
              : 'Gia nhập cộng đồng yêu di sản trang phục truyền thống Việt Nam.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
          >
            ĐĂNG KÝ
          </button>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              autoFocus
            />
          </div>

          {tab === 'register' && (
            <>
              <div className="auth-field">
                <label>Họ và tên hiển thị:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh..."
                />
              </div>

              <div className="auth-field">
                <label>Email:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@vidu.vn"
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <label>Mật khẩu:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : tab === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
          </button>
        </form>
      </div>
    </div>
  );
}
