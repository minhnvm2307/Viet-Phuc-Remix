import React, { useState } from 'react';
import Header from './components/Header';
import HeritageCatalog from './pages/HeritageCatalog';
import StudioPage from './pages/StudioPage';
import { Compass, Sparkles, Heart, ShieldCheck, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudioCostume, setSelectedStudioCostume] = useState(null);
  const [selectedStudioAccessory, setSelectedStudioAccessory] = useState(null);
  const [studioInitialMode, setStudioInitialMode] = useState('gallery');

  const handleSelectForStudio = (costume, mode = 'gallery', accessory = null) => {
    setSelectedStudioCostume(costume);
    setSelectedStudioAccessory(accessory);
    setStudioInitialMode(mode);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header */}
      <Header
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'catalog' && (
          <HeritageCatalog
            searchQuery={searchQuery}
            onSelectForStudio={handleSelectForStudio}
          />
        )}

        {activeTab === 'studio' && (
          <StudioPage
            initialCostume={selectedStudioCostume}
            initialAccessory={selectedStudioAccessory}
            initialMode={studioInitialMode}
            onBackToCatalog={() => {
              setActiveTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'community' && (
          <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{
              maxWidth: '600px',
              margin: '0 auto',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>
                Bảng Bình Chọn Cộng Đồng (Trang 3)
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                Không gian chia sẻ lookbook, bảng vàng sáng tạo và bình chọn các bản phối ấn tượng nhất tuần.
              </p>
              <button onClick={() => setActiveTab('catalog')} className="btn btn-primary">
                Quay lại Khám Phá Di Sản
              </button>
            </div>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{
              maxWidth: '600px',
              margin: '0 auto',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>
                Chuyển Hóa Xu Hướng TikTok / Reels (Tính Năng 4)
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                Trích xuất phong cách từ video ngắn mạng xã hội và ánh xạ tương ứng sang trang phục truyền thống Việt Nam.
              </p>
              <button onClick={() => setActiveTab('catalog')} className="btn btn-primary">
                Quay lại Khám Phá Di Sản
              </button>
            </div>
          </div>
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
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--color-text-subtle)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span>© 2026 Việt Phục Remix. Thiết kế theo phong cách Modern Editorial Heritage.</span>
            <span>Bảo tồn di sản số • Khơi nguồn cảm hứng sáng tạo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
