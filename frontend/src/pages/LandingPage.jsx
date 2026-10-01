import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Layers,
  Palette,
  ShieldCheck,
  Video,
  Bookmark,
  ExternalLink,
  Compass,
  ArrowRight,
  Download,
  Maximize2,
  Sliders,
  CheckCircle2,
  Calendar,
  CloudLightning
} from 'lucide-react';

export default function LandingPage({ onStartStudio }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'tiktok' | 'context' | 'lookbook'

  const handleStartMix = () => {
    if (!isAuthenticated) {
      if (onStartStudio) onStartStudio('/studio');
    } else {
      navigate('/studio');
    }
  };

  const handleGoTo = (path) => {
    if ((path === '/studio' || path === '/profile') && !isAuthenticated) {
      if (onStartStudio) onStartStudio(path);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="landing-page-container">
      {/* =========================================================================
          1. HERO SECTION WITH PRODUCT WIREFRAME MOCKUP
          ========================================================================= */}
      <section className="landing-hero-section">
        <div className="landing-hero-backdrop-glow" />

        <div className="landing-hero-content">
          <div className="landing-kicker-badge">
            <Sparkles size={13} style={{ display: 'inline-block', marginRight: 6, verticalAlign: '-1px' }} />
            <span>HỆ SINH THÁI THỜI TRANG DI SẢN SỐ & TRÍ TUỆ NHÂN TẠO</span>
          </div>

          <h1 className="landing-main-title">
            KẾT NỐI CỔ PHỤC ĐẠI VIỆT VÀO PHONG CÁCH ĐƯƠNG ĐẠI
          </h1>

          <p className="landing-tagline">
            Nền tảng số hóa di sản tiên phong: Khảo cứu quy chuẩn y quan ngàn năm, phân tích cảm hứng từ TikTok, sáng tạo bản phối AI độc bản và lưu trữ tủ đồ Lookbook cá nhân.
          </p>

          <div className="landing-hero-cta-group">
            <button
              type="button"
              className="landing-btn-primary"
              onClick={handleStartMix}
            >
              <Sparkles size={15} style={{ marginRight: 8, display: 'inline-block', verticalAlign: '-2px' }} />
              BẮT ĐẦU PHỐI ĐỒ NGAY
            </button>

            <a
              href="#features"
              className="landing-btn-secondary"
            >
              <Compass size={15} style={{ marginRight: 8, display: 'inline-block', verticalAlign: '-2px' }} />
              KHÁM PHÁ CÁC TÍNH NĂNG
            </a>
          </div>
        </div>

        {/* HERO UI WIREFRAME BROWSER FRAME: STUDIO SCREENSHOT MOCKUP */}
        <div className="landing-wireframe-browser">
          <div className="wireframe-browser-header">
            <div className="wireframe-browser-dots">
              <span className="wireframe-dot red" />
              <span className="wireframe-dot yellow" />
              <span className="wireframe-dot green" />
            </div>

            <div className="wireframe-browser-address">
              <i className="fa-solid fa-lock" />
              <span>vietphucremix.vn/studio</span>
            </div>

            <div className="wireframe-browser-badges">
              <span className="wireframe-mode-badge">AI LIVE STUDIO</span>
            </div>
          </div>

          <div className="wireframe-browser-body">
            {/* Floating Highlights Badges */}
            <div className="wireframe-float-badge left">
              <Sparkles size={16} color="#8C2D19" />
              <span>Tự động tách 2 Option song song</span>
            </div>

            <div className="wireframe-float-badge right">
              <ShieldCheck size={16} color="#0D9488" />
              <span>100% Bảo tồn quy chuẩn vạt hữu</span>
            </div>

            {/* Studio Workspace Simulation */}
            <div className="mockup-studio-bar">
              <div className="mockup-costume-info">
                <img
                  src="/static/seeds/images/ao-giao-linh-remix.jpg"
                  alt="Áo Giao Lĩnh"
                  className="mockup-costume-thumb"
                />
                <div>
                  <div className="mockup-costume-title">Áo Giao Lĩnh (Trực Lĩnh)</div>
                  <div className="mockup-costume-subtitle">Triều Lý - Trần - Hậu Lê • Phom Lập Lĩnh / Vạt Chéo</div>
                </div>
              </div>

              <div className="mockup-chips-row">
                <span className="mockup-chip active">
                  <Layers size={13} />
                  <span>Trang phục nền</span>
                </span>
                <span className="mockup-chip active">
                  <Palette size={13} />
                  <span>Sắc Lam Huyền</span>
                </span>
                <span className="mockup-chip active">
                  <i className="fa-solid fa-hat-cowboy" style={{ fontSize: 11 }} />
                  <span>Nón Ba Tầm Quai Thao</span>
                </span>
                <span className="mockup-chip">
                  <i className="fa-solid fa-plus" style={{ fontSize: 10 }} />
                  <span>Thêm phụ kiện</span>
                </span>
              </div>
            </div>

            {/* Prompt Bar Simulation */}
            <div className="mockup-prompt-row">
              <div className="mockup-prompt-text">
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#8C2D19', marginRight: 8 }} />
                Phối trang phục cổ phục cùng phong cách hiện đại (Quần jean, áo len cổ lọ, blazer dạo phố)
              </div>
              <span className="mockup-gemini-pill">GEMINI 2.5 FLASH</span>
              <div className="mockup-btn-sparkle">
                <Sparkles size={13} />
                <span>Đã Tạo Xong</span>
              </div>
            </div>

            {/* Dual Outputs Grid Simulation */}
            <div className="mockup-output-grid">
              {/* Option 1: Studio Editorial */}
              <div className="mockup-output-card">
                <div className="mockup-output-header">
                  <span className="mockup-opt-badge">OPTION 1 • STUDIO EDITORIAL</span>
                  <span className="mockup-opt-badge" style={{ background: 'rgba(140, 45, 25, 0.85)' }}>
                    PHOM DÁNG CHUẨN
                  </span>
                </div>
                <img
                  src="/static/seeds/images/ao-giao-linh-remix-opt1.jpg"
                  alt="Bản phối 1: Studio Editorial"
                  className="mockup-output-img"
                  onError={(e) => { e.target.src = '/static/seeds/images/ao-giao-linh-remix.jpg'; }}
                />
                <div className="mockup-output-footer">
                  <span className="mockup-output-style-title">Phom Dáng Thanh Lịch • Ánh Sáng Studio 8K</span>
                  <div className="mockup-output-actions">
                    <span className="mockup-icon-btn" title="Phóng to"><Maximize2 size={13} /></span>
                    <span className="mockup-icon-btn" title="Tải ảnh"><Download size={13} /></span>
                  </div>
                </div>
              </div>

              {/* Option 2: Contemporary Streetwear */}
              <div className="mockup-output-card">
                <div className="mockup-output-header">
                  <span className="mockup-opt-badge">OPTION 2 • PHONG CÁCH ĐƯƠNG ĐẠI</span>
                  <span className="mockup-opt-badge" style={{ background: 'rgba(30, 64, 175, 0.85)' }}>
                    STREETWEAR GEN Z
                  </span>
                </div>
                <img
                  src="/static/seeds/images/ao-giao-linh-remix-opt2.jpg"
                  alt="Bản phối 2: Streetwear Hiện Đại"
                  className="mockup-output-img"
                  onError={(e) => { e.target.src = '/static/seeds/images/ao-tac-remix.jpg'; }}
                />
                <div className="mockup-output-footer">
                  <span className="mockup-output-style-title">Phối Quần Jean & Blazer • Bối Cảnh Phố Hiện Đại</span>
                  <div className="mockup-output-actions">
                    <span className="mockup-icon-btn" title="Phóng to"><Maximize2 size={13} /></span>
                    <span className="mockup-icon-btn" title="Tải ảnh"><Download size={13} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. CORE FEATURES SHOWCASE WITH INTERACTIVE UI WIREFRAMES
          ========================================================================= */}
      <section id="features" className="landing-features-section">
        <div className="landing-section-header">
          <div className="landing-kicker-badge">TÍNH NĂNG NỀN TẢNG</div>
          <h2 className="landing-section-title">
            TRẢI NGHIỆM ĐỒNG BỘ TRÊN GIAO DIỆN HIỆN ĐẠI
          </h2>
          <p className="landing-section-subtitle">
            Khám phá 4 công cụ chủ đạo được tối ưu cho cả nghiên cứu khảo cứu di sản lẫn sáng tạo thời trang ứng dụng thế hệ mới.
          </p>
        </div>

        {/* INTERACTIVE FEATURE SELECTOR TABS */}
        <div className="feature-tabs-nav">
          <button
            type="button"
            className={`feature-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
          >
            <Sparkles size={16} />
            <span>1. Studio Phối Đồ AI</span>
          </button>

          <button
            type="button"
            className={`feature-tab-btn ${activeTab === 'tiktok' ? 'active' : ''}`}
            onClick={() => setActiveTab('tiktok')}
          >
            <Video size={16} />
            <span>2. Thiết Kế Từ Link TikTok</span>
          </button>

          <button
            type="button"
            className={`feature-tab-btn ${activeTab === 'context' ? 'active' : ''}`}
            onClick={() => setActiveTab('context')}
          >
            <Compass size={16} />
            <span>3. Gợi Ý Bối Cảnh & Dịp Mặc</span>
          </button>

          <button
            type="button"
            className={`feature-tab-btn ${activeTab === 'lookbook' ? 'active' : ''}`}
            onClick={() => setActiveTab('lookbook')}
          >
            <Bookmark size={16} />
            <span>4. Tủ Đồ Lookbook Cá Nhân</span>
          </button>
        </div>

        {/* TAB 1: STUDIO PHỐI ĐỒ AI */}
        {activeTab === 'studio' && (
          <div className="feature-showcase-panel">
            <div className="feature-info-col">
              <span className="feature-num-tag">CÔNG NGHỆ CHÍNH • STUDIO AI</span>
              <h3 className="feature-title">Studio Phối Đồ AI Độc Bản</h3>
              <p className="feature-desc">
                Không gian thiết kế trực quan cho phép người dùng tự do lựa chọn trang phục di sản, thử nghiệm bảng màu ngũ sắc truyền thống và kết hợp phụ kiện chuẩn xác theo triều đại.
              </p>

              <ul className="feature-checklist">
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Tự động tách 2 Option song song:</strong> Render 1 lượt nhưng tự động tách thành 2 bản phối: Bản 1 chuẩn mực studio, Bản 2 hiện đại phá cách.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Bảo mật & Tối ưu Prompt:</strong> Mẫu prompt hệ thống chuyên sâu giúp AI hiểu rõ cấu trúc vạt hữu, không bị biến dạng trang phục cổ.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Hộp thoại Lightbox đa năng:</strong> Bấm vào bất kỳ bản phối nào để phóng to toàn màn hình, tải ảnh 8K hoặc gõ thêm mô tả chỉnh sửa.</span>
                </li>
              </ul>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={() => handleGoTo('/studio')}
                >
                  TRẢI NGHIỆM PHỐI ĐỒ NGAY
                  <ArrowRight size={15} style={{ marginLeft: 8, display: 'inline-block', verticalAlign: '-2px' }} />
                </button>
              </div>
            </div>

            <div className="feature-visual-col">
              <div className="feature-mini-mockup">
                <div className="mini-mockup-header">
                  <div className="wireframe-browser-dots">
                    <span className="wireframe-dot red" />
                    <span className="wireframe-dot yellow" />
                    <span className="wireframe-dot green" />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#666' }}>Giao Diện Studio Phối Đồ</span>
                  <span className="mockup-gemini-pill">AI ACTIVE</span>
                </div>
                <div className="mini-mockup-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ border: '1px solid #E2DCD2', borderRadius: 10, overflow: 'hidden' }}>
                      <img
                        src="/static/seeds/images/ao-giao-linh-remix-opt1.jpg"
                        alt="Studio Option 1"
                        style={{ width: '100%', height: 260, objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/static/seeds/images/ao-giao-linh-remix.jpg'; }}
                      />
                      <div style={{ padding: '8px 10px', fontSize: 11.5, fontWeight: 600, background: '#fff' }}>
                        Option 1 • Phom Dáng Lịch Sử
                      </div>
                    </div>
                    <div style={{ border: '1px solid #E2DCD2', borderRadius: 10, overflow: 'hidden' }}>
                      <img
                        src="/static/seeds/images/ao-giao-linh-remix-opt2.jpg"
                        alt="Studio Option 2"
                        style={{ width: '100%', height: 260, objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/static/seeds/images/ao-tac-remix.jpg'; }}
                      />
                      <div style={{ padding: '8px 10px', fontSize: 11.5, fontWeight: 600, background: '#fff' }}>
                        Option 2 • Streetwear Đương Đại
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THIẾT KẾ TỪ LINK TIKTOK */}
        {activeTab === 'tiktok' && (
          <div className="feature-showcase-panel">
            <div className="feature-info-col">
              <span className="feature-num-tag">XU HƯỚNG MẠNG XÃ HỘI • TIKTOK SCANNER</span>
              <h3 className="feature-title">Thiết Kế Cổ Phục Từ Link TikTok</h3>
              <p className="feature-desc">
                Biến những khoảnh khắc video ngắn triệu view trên TikTok thành nguồn cảm hứng phối đồ. Hệ thống AI tự động phân tích tinh thần trang phục, gam màu và đề xuất cổ phục tương thích.
              </p>

              <ul className="feature-checklist">
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Nhận diện tự động link TikTok:</strong> Chỉ cần dán link video ngắn bất kỳ (hoặc tải ảnh chụp outfit), hệ thống sẽ trích xuất bối cảnh thời trang ngay tức thì.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Khớp nối tinh thần văn hóa:</strong> Video mang phong cách thanh lịch dạo phố thu đông sẽ được khớp nối chuẩn xác với Áo Giao Lĩnh lụa mộc buông tà hoặc Áo Tấc hoàng gia.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Chuyển giao mượt mà sang Studio:</strong> Một nút bấm "Phối trang phục này" sẽ mang toàn bộ gợi ý sang Studio để tạo ảnh ngay mà không cần cấu hình lại.</span>
                </li>
              </ul>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={() => handleGoTo('/advisor')}
                >
                  THỬ PHÂN TÍCH LINK TIKTOK
                  <ArrowRight size={15} style={{ marginLeft: 8, display: 'inline-block', verticalAlign: '-2px' }} />
                </button>
              </div>
            </div>

            <div className="feature-visual-col">
              <div className="feature-mini-mockup">
                <div className="mini-mockup-header">
                  <div className="wireframe-browser-dots">
                    <span className="wireframe-dot red" />
                    <span className="wireframe-dot yellow" />
                    <span className="wireframe-dot green" />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#666' }}>Gợi Ý & Trích Xuất Xu Hướng TikTok</span>
                  <span className="mockup-tiktok-badge"><i className="fa-brands fa-tiktok" /> TIKTOK</span>
                </div>

                <div className="mini-mockup-body">
                  {/* Simulated URL Input */}
                  <div className="mockup-tiktok-input">
                    <i className="fa-brands fa-tiktok" style={{ fontSize: 16 }} />
                    <input
                      type="text"
                      readOnly
                      value="https://www.tiktok.com/@user/video/738291..."
                    />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8C2D19' }}>ĐÃ PHÂN TÍCH</span>
                  </div>

                  {/* Simulated Extracted Result Card */}
                  <div className="mockup-extract-box">
                    <img
                      src="/static/seeds/landing-page-tiktok.png"
                      alt="Ảnh video TikTok thời trang"
                      className="mockup-extract-img"
                    />
                    <div className="mockup-extract-info">
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <span className="mockup-tag-pill">#streetwear</span>
                        <span className="mockup-tag-pill">#autumn_vibe</span>
                        <span className="mockup-tag-pill">#minimalist</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#262422', marginBottom: 4 }}>
                        Đề xuất: Áo Giao Lĩnh Hiện Đại
                      </div>
                      <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                        Phối cùng áo len cao cổ mỏng, quần jean ống suông và giày da — phong thái thanh lịch cho mùa thu đông.
                      </p>
                      <button
                        type="button"
                        className="landing-btn-secondary"
                        style={{ padding: '6px 14px', fontSize: 11.5 }}
                        onClick={() => handleGoTo('/studio?costume=ao-giao-linh')}
                      >
                        Phối Đồ Với Bộ Này
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GỢI Ý BỐI CẢNH & DỊP MẶC */}
        {activeTab === 'context' && (
          <div className="feature-showcase-panel">
            <div className="feature-info-col">
              <span className="feature-num-tag">CỐ VẤN NGỮ CẢNH • CULTURAL GUARDRAILS</span>
              <h3 className="feature-title">Gợi Ý Bối Cảnh & Chuẩn Mực Phối Đồ</h3>
              <p className="feature-desc">
                Thời trang di sản chỉ tỏa sáng khi đặt đúng bối cảnh. Hệ thống cố vấn phân tích đa chiều theo Dịp mặc, Thời tiết và Vibe cảm xúc, đồng thời bảo vệ nghiêm ngặt quy chuẩn văn hóa dân tộc.
              </p>

              <ul className="feature-checklist">
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Đa dạng bối cảnh đời thực:</strong> Dạo phố cuối tuần, Đi học / Sự kiện trường, Dạ tiệc trang trọng, Lễ hội truyền thống hay Chụp lookbook nghệ thuật.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Tỷ lệ vàng 60 - 30 - 10:</strong> 60% Trang phục nền truyền thống, 30% Thời trang hiện đại ứng dụng, 10% Phụ kiện điểm xuyết độc đáo.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Quy chuẩn vạt hữu bất biến:</strong> Cam kết 100% cổ phục khép vạt sang phải theo đúng y quan Đại Việt, không xuyên tạc phẩm trật hoàng gia.</span>
                </li>
              </ul>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={() => handleGoTo('/advisor')}
                >
                  TÌM BỐI CẢNH PHÙ HỢP
                  <ArrowRight size={15} style={{ marginLeft: 8, display: 'inline-block', verticalAlign: '-2px' }} />
                </button>
              </div>
            </div>

            <div className="feature-visual-col">
              <div className="feature-mini-mockup">
                <div className="mini-mockup-header">
                  <div className="wireframe-browser-dots">
                    <span className="wireframe-dot red" />
                    <span className="wireframe-dot yellow" />
                    <span className="wireframe-dot green" />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#666' }}>Cố Vấn Ngữ Cảnh Phục Trang</span>
                  <span className="mockup-gemini-pill" style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
                    <ShieldCheck size={11} style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }} />
                    CHUẨN VẠT HỮU
                  </span>
                </div>

                <div className="mini-mockup-body">
                  <div className="mockup-context-row">
                    <div className="mockup-context-item">
                      <span className="mockup-context-label">Dịp Mặc Lựa Chọn</span>
                      <div className="mockup-chips-row">
                        <span className="mockup-chip active">Dạo phố</span>
                        <span className="mockup-chip">Dạ tiệc</span>
                        <span className="mockup-chip">Chụp Lookbook</span>
                      </div>
                    </div>

                    <div className="mockup-context-item">
                      <span className="mockup-context-label">Thời Tiết & Khí Hậu</span>
                      <div className="mockup-chips-row">
                        <span className="mockup-chip active">Mát mẻ (Thu)</span>
                        <span className="mockup-chip">Lạnh (Đông)</span>
                      </div>
                    </div>

                    <div className="mockup-context-item">
                      <span className="mockup-context-label">Phong Cách (Vibe)</span>
                      <div className="mockup-chips-row">
                        <span className="mockup-chip active">Thanh lịch</span>
                        <span className="mockup-chip">Cá tính</span>
                        <span className="mockup-chip">Phá cách</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 8, padding: 12, background: '#FAF8F5', borderRadius: 10, border: '1px solid #E8E2D8', fontSize: 12, color: '#444' }}>
                      <strong style={{ color: '#8C2D19' }}>Công thức đề xuất: </strong>
                      Áo Tấc lụa đỏ son buông tà + Quần culottes trắng kem + Vòng ngọc trai + Giày mule cao gót nhung mũi nhọn.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TỦ ĐỒ LOOKBOOK CÁ NHÂN */}
        {activeTab === 'lookbook' && (
          <div className="feature-showcase-panel">
            <div className="feature-info-col">
              <span className="feature-num-tag">LƯU TRỮ ĐÁM MÂY • LOOKBOOK VAULT</span>
              <h3 className="feature-title">Tủ Đồ Lookbook Cá Nhân</h3>
              <p className="feature-desc">
                Mỗi tài khoản được trang bị kho lưu trữ cá nhân hóa: Tự động lưu toàn bộ các bản phối AI đã tạo, ghi nhớ thông số phụ kiện, màu sắc và sẵn sàng tải về với chất lượng cao nhất.
              </p>

              <ul className="feature-checklist">
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Tự động đồng bộ hóa đám mây:</strong> Mỗi khi nhấn "Tạo Ảnh", bản phối ưng ý sẽ tự động được đưa vào Lookbook mà không lo thất lạc.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Tải ảnh chất lượng cao & Chia sẻ:</strong> Tải về file ảnh chuẩn HD/8K phục vụ in ấn, đăng tải mạng xã hội hoặc chia sẻ cùng bạn bè.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span><strong>Quản lý công thức phối đồ:</strong> Xem lại chi tiết từng món phụ kiện, màu sắc và prompt đã dùng để tái sử dụng bất cứ lúc nào.</span>
                </li>
              </ul>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={() => handleGoTo('/profile')}
                >
                  TRUY CẬP TỦ ĐỒ CỦA BẠN
                  <ArrowRight size={15} style={{ marginLeft: 8, display: 'inline-block', verticalAlign: '-2px' }} />
                </button>
              </div>
            </div>

            <div className="feature-visual-col">
              <div className="feature-mini-mockup">
                <div className="mini-mockup-header">
                  <div className="wireframe-browser-dots">
                    <span className="wireframe-dot red" />
                    <span className="wireframe-dot yellow" />
                    <span className="wireframe-dot green" />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#666' }}>Tủ Đồ Cá Nhân Lookbook</span>
                  <span className="mockup-gemini-pill" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}>
                    <Bookmark size={11} style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }} />
                    CLOUD VAULT
                  </span>
                </div>

                <div className="mini-mockup-body">
                  <div className="mockup-lookbook-grid">
                    <div className="mockup-lookbook-card">
                      <img
                        src="/static/seeds/images/ao-giao-linh-remix-opt1.jpg"
                        alt="Lookbook 1"
                        className="mockup-lookbook-img"
                        onError={(e) => { e.target.src = '/static/seeds/images/ao-giao-linh-remix.jpg'; }}
                      />
                      <div className="mockup-lookbook-caption">
                        <div className="mockup-lookbook-name">Áo Giao Lĩnh Studio</div>
                        <span style={{ fontSize: 10, color: '#888' }}>Màu Lam • Mũ Ba Tầm</span>
                      </div>
                    </div>

                    <div className="mockup-lookbook-card">
                      <img
                        src="/static/seeds/images/ao-giao-linh-remix-opt2.jpg"
                        alt="Lookbook 2"
                        className="mockup-lookbook-img"
                        onError={(e) => { e.target.src = '/static/seeds/images/ao-tac-remix.jpg'; }}
                      />
                      <div className="mockup-lookbook-caption">
                        <div className="mockup-lookbook-name">Áo Giao Lĩnh Phố</div>
                        <span style={{ fontSize: 10, color: '#888' }}>Quần Jean • Blazer</span>
                      </div>
                    </div>

                    <div className="mockup-lookbook-card">
                      <img
                        src="/static/seeds/images/ao-tac-remix.jpg"
                        alt="Lookbook 3"
                        className="mockup-lookbook-img"
                      />
                      <div className="mockup-lookbook-caption">
                        <div className="mockup-lookbook-name">Áo Tấc Hoàng Gia</div>
                        <span style={{ fontSize: 10, color: '#888' }}>Sắc Đỏ Son • Kiềng Bạc</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          3. QUY TRÌNH 3 BƯỚC TRỰC QUAN (WORKFLOW JOURNEY)
          ========================================================================= */}
      <section className="landing-steps-section">
        <div className="landing-section-header">
          <div className="landing-kicker-badge">HÀNH TRÌNH SÁNG TẠO</div>
          <h2 className="landing-section-title">
            3 BƯỚC ĐƠN GIẢN ĐỂ SỞ HỮU BẢN PHỐI DI SẢN
          </h2>
          <p className="landing-section-subtitle">
            Trải nghiệm công nghệ AI thông minh gói gọn trong quy trình mượt mà, tiện lợi và không đòi hỏi kiến thức chuyên môn sâu.
          </p>
        </div>

        <div className="landing-steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3 className="step-title">Chọn Cổ Phục Hoặc Dán Link TikTok</h3>
            <p className="step-desc">
              Khám phá danh mục di sản theo từng triều đại (Lý, Trần, Lê, Nguyễn) hoặc dán link video TikTok dạo phố để hệ thống tự động nhận diện phong cách tương ứng.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">02</div>
            <h3 className="step-title">Tùy Biến Bảng Màu & Phụ Kiện</h3>
            <p className="step-desc">
              Chọn sắc độ Ngũ Sắc Hoàng Gia (Huyền, Hoàng, Xích, Thanh, Bạch) và thêm tối đa 3 món phụ kiện di sản (Nón Ba Tầm, Trâm cài tóc, Khăn vấn) cùng mô tả phối đồ.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">03</div>
            <h3 className="step-title">Tách 2 Option Song Song & Lưu Lookbook</h3>
            <p className="step-desc">
              AI kết xuất 2 góc phối (Studio chuẩn mực & Streetwear hiện đại). Tự do phóng to, tải ảnh 8K chất lượng cao và tự động lưu vào tủ đồ cá nhân trên hệ thống.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. BOTTOM CTA BANNER
          ========================================================================= */}
      <section className="landing-bottom-cta">
        <div className="bottom-cta-box">
          <div className="bottom-cta-seal">VP</div>
          <h2 className="bottom-cta-title">Sẵn Sàng Trải Nghiệm Di Sản Theo Cách Riêng?</h2>
          <p className="bottom-cta-sub">
            Gia nhập cộng đồng người trẻ yêu mến văn hóa dân tộc, kết nối ngàn năm lịch sử cùng phong cách thời trang đương đại.
          </p>
          <div className="bottom-cta-actions">
            <button
              type="button"
              className="landing-btn-primary"
              onClick={handleStartMix}
            >
              <Sparkles size={15} style={{ marginRight: 8, display: 'inline-block', verticalAlign: '-2px' }} />
              THỬ PHỐI ĐỒ NGAY
            </button>
            <button
              type="button"
              className="landing-btn-outline"
              onClick={() => navigate('/catalog')}
            >
              KHÁM PHÁ DANH MỤC DI SẢN
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

