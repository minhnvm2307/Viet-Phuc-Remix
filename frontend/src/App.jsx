import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import HeritageCatalog from './pages/HeritageCatalog';
import StudioPage from './pages/StudioPage';
import AdvisorPage from './pages/AdvisorPage';
import ProfilePage from './pages/ProfilePage';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { ShieldCheck } from 'lucide-react';

// Tự động cuộn lên đầu trang khi chuyển Route
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  }, [pathname]);
  return null;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [redirectPathAfterAuth, setRedirectPathAfterAuth] = useState(null);

  // Mở Auth modal với đường dẫn chuyển hướng sau khi đăng nhập
  const handleOpenAuth = (targetPath = null) => {
    setRedirectPathAfterAuth(targetPath);
    setIsAuthModalOpen(true);
  };

  // Mở Studio từ nút điều hướng chung
  const handleOpenStudio = (targetPath = '/studio') => {
    if (!isAuthenticated) {
      handleOpenAuth(targetPath);
    } else {
      navigate(targetPath);
    }
  };

  // Xử lý chuyển từ Catalog sang Studio với trang phục cụ thể
  const handleSelectForStudio = (costume, mode = 'gallery', accessory = null) => {
    const targetUrl = `/studio?costume=${costume.id}`;
    if (!isAuthenticated) {
      handleOpenAuth(targetUrl);
    } else {
      navigate(targetUrl);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />

      {/* Sticky Header Tinh Gọn */}
      <Header onOpenAuth={handleOpenAuth} />

      {/* Main Content Area với React Router */}
      <main style={{ flex: 1 }}>
        <Routes>
          {/* 1. TRANG LANDING GIỚI THIỆU */}
          <Route
            path="/"
            element={
              <LandingPage
                onStartStudio={() => handleOpenStudio('/studio')}
              />
            }
          />

          {/* 2. TRANG CHÍNH - KHÁM PHÁ DI SẢN */}
          <Route
            path="/catalog"
            element={
              <HeritageCatalog
                searchQuery={searchQuery}
                onSelectForStudio={handleSelectForStudio}
              />
            }
          />

          {/* 3. TRANG MIX STUDIO AI */}
          <Route
            path="/studio"
            element={
              <StudioPage
                onRequireAuth={(target = '/studio') => handleOpenAuth(target)}
                onBackToCatalog={() => navigate('/catalog')}
              />
            }
          />

          {/* 4. TRANG GỢI Ý THEO BỐI CẢNH */}
          <Route
            path="/advisor"
            element={<AdvisorPage onRequireAuth={(target = '/advisor') => handleOpenAuth(target)} />}
          />

          {/* 5. TRANG CÁ NHÂN & TỦ ĐỒ LOOKBOOK */}
          <Route
            path="/profile"
            element={
              <ProfilePage
                onNavigateToStudio={() => handleOpenStudio('/studio')}
                onNavigateToCatalog={() => navigate('/catalog')}
              />
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Editorial Footer */}
      <footer style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '48px 0 32px'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            marginBottom: '40px'
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px',
                fontWeight: '700',
                marginBottom: '10px'
              }}>
                VIỆT PHỤC REMIX
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.7', maxWidth: '320px' }}>
                Nền tảng thời trang di sản tôn vinh giá trị văn hóa truyền thống Việt Nam qua ngôn ngữ đương đại của thế hệ trẻ.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Cam Kết Văn Hóa
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--color-accent)" />
                  <span>Tuân thủ quy chuẩn vạt hữu truyền thống</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--color-accent)" />
                  <span>Không xuyên tạc phẩm trật hoàng gia</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--color-accent)" />
                  <span>Ứng dụng tỷ lệ vàng phối đồ 60 - 30 - 10</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Tư Liệu Tham Chiếu
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Hiện vật và tư liệu sưu tập từ Bảo tàng Phụ nữ Việt Nam, Bảo tàng Mỹ thuật Việt Nam và các tài liệu khảo cứu lịch sử trang phục triều Nguyễn, Hậu Lê, Lý - Trần.
              </p>
            </div>
          </div>

          <div style={{
            paddingTop: '24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--color-text-muted)'
          }}>
            <span>© 2026 Việt Phục Remix. Bảo lưu mọi quyền di sản số.</span>
            <span>Hào Khí Đông A — Bản Sắc Muôn Đời</span>
          </div>
        </div>
      </footer>

      {/* Hộp thoại Đăng Nhập / Đăng Ký Popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (redirectPathAfterAuth) {
            navigate(redirectPathAfterAuth);
          }
        }}
      />
    </div>
  );
}
