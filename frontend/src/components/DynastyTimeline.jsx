import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

export default function DynastyTimeline({ eras = [], selectedEra, onSelectEra }) {
  return (
    <div style={{
      width: '100%',
      padding: '24px 0',
      borderTop: '1px solid var(--color-border)',
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      margin: '32px 0 40px'
    }}>
      <div className="container">
        {/* Header timeline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--color-accent)" />
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-accent)'
            }}>
              Trục Thời Gian Lịch Sử Phục Trang
            </span>
          </div>

          {selectedEra && (
            <button
              onClick={() => onSelectEra(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Hiển thị toàn bộ thời kỳ
            </button>
          )}
        </div>

        {/* Horizontal scroll timeline track */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'thin'
        }}>
          {eras.map((era, index) => {
            const isSelected = selectedEra === era.id;
            return (
              <div
                key={era.id}
                onClick={() => onSelectEra(isSelected ? null : era.id)}
                style={{
                  flex: '0 0 240px',
                  backgroundColor: isSelected ? '#FFFFFF' : 'var(--color-base)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: isSelected ? '0 6px 18px rgba(158, 42, 43, 0.08)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Chỉ số thứ tự thời kỳ */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-serif)',
                    color: isSelected ? 'var(--color-accent)' : 'var(--color-text-subtle)'
                  }}>
                    0{index + 1}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)'
                  }}>
                    {era.period}
                  </span>
                </div>

                {/* Tên thời kỳ */}
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  lineHeight: '1.3',
                  marginBottom: '6px',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-text-main)'
                }}>
                  {era.name}
                </h4>

                {/* Mô tả ngắn */}
                <p style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.45',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {era.description}
                </p>

                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: 'var(--color-accent)'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
