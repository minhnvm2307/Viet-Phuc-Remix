import React from 'react';

/**
 * 2. CAROUSEL DANH MỤC KHUNG VÒM (Arch Hero Carousel - Tham khảo Hình 1)
 * - Đặt ở đầu trang, hiển thị 4-6 trang phục truyền thống tiêu biểu
 * - Khung ảnh vòm bán nguyệt (bo tròn nửa trên border-radius: 120px 120px 16px 16px)
 * - Khi click vào ảnh sẽ cuộn mượt xuống triều đại tương ứng
 */
export default function ArchCarousel({ items = [], onScrollToDynasty }) {
  return (
    <section id="gallery" className="hero-gallery">
      <span className="hero-label">Di Sản Nghìn Năm • Ngũ Sắc Tự Hào</span>
      <h1 className="hero-heading">Phục Dựng & Cảm Hứng Phối Cổ Phục Đương Đại</h1>

      <div className="arch-carousel">
        {items.map((item) => (
          <div
            key={item.id}
            className="arch-card"
            onClick={() => onScrollToDynasty(item.sectionId || item.id)}
            title={`Cuộn đến ${item.name}`}
          >
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              onError={(e) => {
                e.target.src = item.fallbackImage || item.image;
              }}
            />
            <div className="card-caption">
              <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.08em' }}>
                {item.eraName}
              </div>
              <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '2px' }}>
                {item.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
