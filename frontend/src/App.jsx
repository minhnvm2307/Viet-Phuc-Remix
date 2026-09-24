import React, { useState } from 'react';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import HeritageCatalog from './pages/HeritageCatalog';
import StudioPage from './pages/StudioPage';
import ProfilePage from './pages/ProfilePage';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudioCostume, setSelectedStudioCostume] = useState(null);
  const [selectedStudioAccessory, setSelectedStudioAccessory] = useState(null);
  const [studioInitialMode, setStudioInitialMode] = useState('gallery');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Xử lý chuyển từ Catalog sang Studio
  const handleSelectForStudio = (costume, mode = 'gallery', accessory = null) => {
    setSelectedStudioCostume(costume);
    setSelectedStudioAccessory(accessory);
    setStudioInitialMode(mode);

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      setActiveTab('studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mở Studio từ nút điều hướng chung
  const handleOpenStudio = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      setActiveTab('studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Tinh Gọn */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenStudio={handleOpenStudio}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* 1. TRANG LANDING GIỚI THIỆU */}
        {activeTab === 'landing' && (
          <LandingPage
            onExploreCatalog={() => {
              setActiveTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartStudio={handleOpenStudio}
          />
        )}

        {/* 2. TRANG CHÍNH - KHÁM PHÁ DI SẢN */}
        {activeTab === 'catalog' && (
          <HeritageCatalog
            searchQuery={searchQuery}
            onSelectForStudio={handleSelectForStudio}
          />
        )}

        {/* 3. TRANG MIX STUDIO AI */}
        {activeTab === 'studio' && (
          <StudioPage
            initialCostume={selectedStudioCostume}
            initialAccessory={selectedStudioAccessory}
            initialMode={studioInitialMode}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onBackToCatalog={() => {
              setActiveTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* 4. TRANG CÁ NHÂN & TỦ ĐỒ LOOKBOOK */}
        {activeTab === 'profile' && (
          <ProfilePage
            onNavigateToStudio={handleOpenStudio}
            onNavigateToCatalog={() => {
              setActiveTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
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
          setActiveTab('studio');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
