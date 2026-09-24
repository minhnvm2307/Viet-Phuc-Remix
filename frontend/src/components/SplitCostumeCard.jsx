import React from 'react';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function SplitCostumeCard({ costume, onOpenDetail, onTryOn }) {
  // Ảnh nguyên bản: ưu tiên cutout_image hoặc cover_image
  const originalImage = costume.cutout_image || costume.cover_image;
  // Ảnh bản phối: remix_image
  const remixImage = costume.remix_image || costume.cover_image;

  return (
    <div className="split-card group" id={`costume-card-${costume.id}`}>
      {/* 50/50 Split Image Showcase Container */}
      <div className="split-card-media">
        {/* Nửa Trái: Trang phục gốc / Flat-lay / Cổ phục */}
        <div className="split-half" style={{ backgroundColor: '#F4EFE6' }}>
          <img
            src={originalImage}
            alt={`${costume.name} nguyên bản`}
            loading="lazy"
            onError={(e) => {
              e.target.src = costume.cover_image;
            }}
          />
          <span className="badge badge-original split-pill-left">
            Nguyên bản
          </span>
        </div>

        {/* Nửa Phải: Bản phối thực tế Gen Z / On-Model Remix */}
        <div className="split-half" style={{ backgroundColor: '#FAF6EF' }}>
          <img
            src={remixImage}
            alt={`${costume.name} bản phối Gen Z`}
            loading="lazy"
            onError={(e) => {
              e.target.src = costume.cover_image;
            }}
          />
          <span className="badge badge-remix split-pill-right">
            Bản phối Remix
          </span>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="split-card-content">
        <div>
          {/* Metadata pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)'
            }}>
              {costume.era_origin}
            </span>
            <span className="badge badge-indigo">
              {costume.ethnicity || 'Kinh'}
            </span>
          </div>

          {/* Tiêu đề trang phục */}
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            lineHeight: '1.3',
            margin: '8px 0 6px',
            color: 'var(--color-text-main)'
          }}>
            {costume.name}
          </h3>

          {/* Công thức phối tóm tắt */}
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {costume.remix_suggestions?.formula || costume.significance}
          </p>
        </div>

        {/* Tỷ lệ vàng phối đồ 60-30-10 */}
        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--color-text-muted)'
          }}>
            <span>Tỷ lệ chuẩn: 60 - 30 - 10</span>
            <span style={{ color: 'var(--color-accent)' }}>
              {costume.remix_suggestions?.concept_name || 'Couture'}
            </span>
          </div>
          <div className="ratio-meter">
            <div className="ratio-bar-traditional" title="60% Cổ phục truyền thống" />
            <div className="ratio-bar-contemporary" title="30% Trang phục đời thường hiện đại" />
            <div className="ratio-bar-accessories" title="10% Phụ kiện di sản" />
          </div>

          {/* Action CTAs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid rgba(232, 227, 217, 0.7)'
          }}>
            <button
              onClick={() => onOpenDetail(costume)}
              className="btn-text"
              id={`view-dossier-${costume.id}`}
            >
              <span>Xem hồ sơ di sản</span>
              <BookOpen size={14} />
            </button>

            <button
              onClick={() => onTryOn(costume)}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '12px' }}
              id={`try-on-${costume.id}`}
            >
              <span>Phối đồ</span>
              <ArrowRight size={13} color="var(--color-accent)" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
