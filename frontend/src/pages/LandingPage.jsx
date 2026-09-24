import React from 'react';

const FEATURED_HIGHLIGHTS = [
  {
    id: 'ao-ngu-than-tay-chen',
    title: 'Áo Ngũ Thân Tay Chẽn',
    dynasty: 'Thời Chúa Nguyễn & Triều Nguyễn',
    image: '/static/seeds/images/ao-ngu-than-tay-chen-cover.jpg',
    tag: 'Tiền thân Áo Dài'
  },
  {
    id: 'ao-tac',
    title: 'Áo Tấc Đại Lễ Phục',
    dynasty: 'Triều Nguyễn (1744 - 1945)',
    image: '/static/seeds/images/ao-tac-gallery-1.jpg',
    tag: 'Đại lễ Hoàng gia'
  },
  {
    id: 'ao-nhat-binh',
    title: 'Áo Nhật Bình Cung Đình',
    dynasty: 'Hoàng cung Phú Xuân',
    image: '/static/seeds/images/ao-nhat-binh-cover.jpg',
    tag: 'Hậu Cung Quý Tộc'
  },
  {
    id: 'ao-dai-lemur-le-pho',
    title: 'Áo Dài Lemur & Lê Phổ',
    dynasty: 'Mỹ Thuật Đông Dương 1930',
    image: '/static/seeds/images/ao-dai-lemur-le-pho-cover.png',
    tag: 'Tân Thời Cách Tân'
  }
];

export default function LandingPage({
  onExploreCatalog,
  onStartStudio
}) {
  return (
    <div className="landing-page-container">
      {/* 1. HERO SECTION */}
      <section className="landing-hero-section">
        <div className="landing-hero-backdrop-glow" />

        <div className="landing-hero-content">
          <div className="landing-kicker-badge">
            <span>DI SẢN TRANG PHỤC VIỆT NAM — PHIÊN BẢN SỐ HÓA</span>
          </div>

          <h1 className="landing-main-title">
            VIỆT PHỤC REMIX
          </h1>

          <p className="landing-tagline">
            Đưa ngàn năm văn hiến y quan Đại Việt vào đời sống đương đại. Khảo cứu chuẩn mực di sản, tái hiện phom dáng nguyên bản và sáng tạo phong cách phối đồ độc bản cùng trí tuệ nhân tạo.
          </p>

          <div className="landing-hero-cta-group">
            <button
              type="button"
              className="landing-btn-primary"
              onClick={onExploreCatalog}
            >
              KHÁM PHÁ DI SẢN
            </button>

            <button
              type="button"
              className="landing-btn-secondary"
              onClick={onStartStudio}
            >
              BẮT ĐẦU PHỐI ĐỒ
            </button>
          </div>
        </div>

        {/* Khung Vòm Hero Trưng Bày 4 Cổ Phục Tiêu Biểu */}
        <div className="landing-hero-showcase">
          <div className="showcase-arch-grid">
            {FEATURED_HIGHLIGHTS.map((item, idx) => (
              <div
                key={item.id}
                className="showcase-arch-card"
                onClick={onExploreCatalog}
                title={`Xem chi tiết ${item.title}`}
              >
                <div className="arch-img-frame">
                  <img src={item.image} alt={item.title} />
                  <div className="arch-card-overlay">
                    <span className="arch-tag">{item.tag}</span>
                    <h3 className="arch-title">{item.title}</h3>
                    <span className="arch-dynasty">{item.dynasty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. 3 TRỤ CỘT GIÁ TRỊ (3 PILLARS) */}
      <section className="landing-pillars-section">
        <div className="pillars-container">
          <div className="pillar-card">
            <div className="pillar-number">01</div>
            <h3 className="pillar-title">Khảo Cứu Chuẩn Xác</h3>
            <p className="pillar-desc">
              Hệ thống tư liệu phục dựng nguyên gốc từ các triều đại Lý, Trần, Lê, Nguyễn. Cam kết bảo tồn quy chuẩn vạt hữu và triết lý thẩm mỹ dân tộc.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-number">02</div>
            <h3 className="pillar-title">Mix Studio AI Độc Bản</h3>
            <p className="pillar-desc">
              Phối hợp chân dung cá nhân với phục trang nền và phụ kiện truyền thống (Mũ nón, Kiểu tóc, Trang sức) để tạo nên diện mạo thời trang Gen Z độc đáo.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-number">03</div>
            <h3 className="pillar-title">Tủ Đồ Lookbook Cá Nhân</h3>
            <p className="pillar-desc">
              Mỗi tài khoản sở hữu không gian lưu trữ riêng, quản lý toàn bộ các bản phối AI đã tạo, sẵn sàng chia sẻ và tải về bộ sưu tập di sản của riêng bạn.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CTA BOTTOM BANNER */}
      <section className="landing-bottom-cta">
        <div className="bottom-cta-box">
          <div className="bottom-cta-seal">VP</div>
          <h2 className="bottom-cta-title">Sẵn Sàng Trải Nghiệm Di Sản Theo Cách Riêng?</h2>
          <p className="bottom-cta-sub">
            Gia nhập hành trình kết nối di sản ngàn năm cùng phong cách thời trang đương đại.
          </p>
          <div className="bottom-cta-actions">
            <button
              type="button"
              className="landing-btn-primary"
              onClick={onStartStudio}
            >
              THỬ PHỐI ĐỒ NGAY
            </button>
            <button
              type="button"
              className="landing-btn-outline"
              onClick={onExploreCatalog}
            >
              TÌM HIỂU CỔ PHỤC
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
