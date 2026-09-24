import React from 'react';
import { ArrowRight, Images } from 'lucide-react';

/**
 * Section Triều đại & Việt phục với Floating Detail Card:
 * 1. Khối Visual: Ảnh hero static chuẩn tạp chí, có offset color backdrop tạo chiều sâu.
 *    - Click vào ảnh sẽ mở modal khám phá chi tiết (CuratorModal)
 * 2. Floating Detail Card (Thẻ chi tiết nổi):
 *    - Tên loại việt phục
 *    - Triều đại & Thời gian
 *    - Mô tả ngắn gọn, thoáng mắt
 *    - Bối cảnh mặc / sử dụng
 *    - Cụm nút hành động: "Tìm hiểu thêm" (mở modal) & "Thử đồ" (sang Studio)
 */
export default function DynastyZigZagSection({
  dynasty,
  index,
  onOpenGallery,
  onTryOn
}) {
  const costume = dynasty.primaryCostume || {};
  const heroImage = costume.remix_image || costume.cover_image;

  // Rút gọn mô tả còn 1-2 câu tinh tế, tránh nhồi nhét chữ gây rối mắt
  const getConciseDescription = (text) => {
    if (!text) return 'Di sản phục trang truyền thống Việt Nam kết tinh giá trị lịch sử và bản sắc thẩm mỹ ngàn năm.';
    const sentences = text.split(/(?<=[.!?])\s+/);
    if (sentences.length > 2) {
      return sentences.slice(0, 2).join(' ');
    }
    return text;
  };

  return (
    <section
      id={dynasty.id}
      className={`dynasty-section ${index === 0 ? 'active' : ''}`}
      data-theme-color={dynasty.themeColor || '#8C2D19'}
      data-bg-color={dynasty.bgColor || '#FBF8F5'}
    >
      <div className="dynasty-grid">
        {/* Khối Visual: Ảnh static chuẩn tạp chí với offset color backdrop */}
        <div className="visual-col">
          <div className="color-backdrop" />
          <div 
            className="image-hero-wrapper static-hero"
            onClick={() => onOpenGallery(costume)}
            style={{ cursor: 'pointer' }}
            title={`Bấm vào ảnh để xem chi tiết ${costume.name || dynasty.name}`}
          >
            <img
              src={heroImage}
              alt={costume.name || dynasty.archCaption}
              loading="lazy"
              onError={(e) => {
                e.target.src = costume.cover_image;
              }}
            />
          </div>
          <div className="era-watermark-text">
            {dynasty.watermarkText || dynasty.name.toUpperCase()}
          </div>
        </div>

        {/* Khối Thông tin: Chứa Floating Detail Card nổi bật */}
        <div className="info-col">
          <div className="floating-detail-card">
            {/* 1. HIỆN TO NHẤT: Tên loại việt phục */}
            <h2 className="costume-title-dominant">
              {costume.name || dynasty.archCaption}
            </h2>

            {/* 2. CẤP TIẾP THEO: Triều đại & Thời gian */}
            <div className="costume-dynasty-badge">
              <span className="dynasty-name-text">{dynasty.name}</span>
              <span className="badge-separator">•</span>
              <span className="costume-era-period">{costume.era_origin || dynasty.period}</span>
            </div>

            {/* 3. NỘI DUNG CHÍNH: Mô tả ngắn gọn, thoáng mắt */}
            <p className="costume-short-desc">
              {getConciseDescription(costume.significance || dynasty.description)}
            </p>

            {/* 4. DƯỚI CÙNG: Bối cảnh mặc/sử dụng */}
            <div className="occasion-context-bar">
              <span className="occasion-context-label">Bối Cảnh Mặc:</span>
              <span className="occasion-context-value">
                {costume.occasion_usage || 'Điển lễ cung đình, nghi thức đại triều và giao tế bang giao.'}
              </span>
            </div>

            {/* 5. CỤM NÚT HÀNH ĐỘNG */}
            <div className="action-button-group">
              <button
                onClick={() => onOpenGallery(costume)}
                className="btn-editorial-secondary"
                id={`btn-gallery-${costume.id || dynasty.id}`}
                title={`Xem toàn bộ gallery ảnh và tư liệu khảo cứu của ${costume.name}`}
              >
                <Images size={15} />
                <span>Tìm hiểu thêm</span>
              </button>

              <button
                onClick={() => onTryOn(costume)}
                className="btn-editorial-primary"
                id={`btn-tryon-${costume.id || dynasty.id}`}
                title={`Thử phối trang phục ${costume.name} cùng ảnh cá nhân`}
              >
                <span>Thử đồ</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
