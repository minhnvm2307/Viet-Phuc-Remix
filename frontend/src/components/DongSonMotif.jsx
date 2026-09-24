import React from 'react';

/**
 * Họa tiết Trống đồng Đông Sơn (Ngọc Lũ / Hoàng Hạ)
 * Kết cấu chuẩn mực:
 * - Ngôi sao trung tâm 14 cánh (mặt trời chiếu rọi)
 * - Vòng tia lửa / tam giác răng lược
 * - Vòng chim Lạc bay ngược chiều kim đồng hồ
 * - Vòng hoa văn chữ S và chấm tròn đồng tâm
 */
export default function DongSonMotif({ className = '', size = 500, opacity = 0.05, rotating = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        opacity: opacity,
        animation: rotating ? 'spin 120s linear infinite' : 'none'
      }}
    >
      <defs>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </defs>

      {/* Vành ngoài cùng */}
      <circle cx="250" cy="250" r="240" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="250" cy="250" r="232" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="250" cy="250" r="222" stroke="currentColor" strokeWidth="1.5" />

      {/* Vòng 1: Họa tiết răng cưa tam giác */}
      <circle cx="250" cy="250" r="210" stroke="currentColor" strokeWidth="1" />
      {Array.from({ length: 48 }).map((_, i) => {
        const angle = (i * 360) / 48;
        const rad = (angle * Math.PI) / 180;
        const x1 = 250 + 210 * Math.cos(rad);
        const y1 = 250 + 210 * Math.sin(rad);
        const x2 = 250 + 222 * Math.cos(rad + 0.05);
        const y2 = 250 + 222 * Math.sin(rad + 0.05);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" />;
      })}

      {/* Vòng 2: Chim Lạc bay (Biểu tượng linh thiêng sông Hồng) */}
      <circle cx="250" cy="250" r="185" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="250" cy="250" r="160" stroke="currentColor" strokeWidth="1.5" />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        const rad = (angle * Math.PI) / 180;
        const cx = 250 + 172 * Math.cos(rad);
        const cy = 250 + 172 * Math.sin(rad);
        return (
          <g key={`bird-${i}`} transform={`translate(${cx}, ${cy}) rotate(${angle + 90}) scale(0.6)`}>
            {/* Hình cách điệu Chim Lạc mỏ dài đuôi thon */}
            <path
              d="M-20,0 C-10,-8 5,-8 20,-2 C25,0 15,4 5,3 C-5,2 -12,6 -20,0 Z"
              fill="currentColor"
            />
            <path
              d="M0,-5 C10,-18 18,-15 15,-2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </g>
        );
      })}

      {/* Vòng 3: Vòng xoắn ốc chữ gãy và vòng tròn đồng tâm */}
      <circle cx="250" cy="250" r="145" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="250" cy="250" r="125" stroke="currentColor" strokeWidth="1.5" />

      {/* Vòng 4: Vòng hươu / sinh hoạt dân gian */}
      <circle cx="250" cy="250" r="100" stroke="currentColor" strokeWidth="1" />
      <circle cx="250" cy="250" r="85" stroke="currentColor" strokeWidth="1.5" />

      {/* Ngôi sao 14 cánh trung tâm (Mặt trời Đông Sơn) */}
      <circle cx="250" cy="250" r="80" stroke="currentColor" strokeWidth="1" />
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i * 360) / 14;
        const rad = (angle * Math.PI) / 180;
        const radNext = (((i + 0.5) * 360) / 14 * Math.PI) / 180;
        const xTip = 250 + 78 * Math.cos(rad);
        const yTip = 250 + 78 * Math.sin(rad);
        const xBase = 250 + 28 * Math.cos(radNext);
        const yBase = 250 + 28 * Math.sin(radNext);
        return (
          <path
            key={`ray-${i}`}
            d={`M250,250 L${xTip},${yTip} L${xBase},${yBase} Z`}
            fill="currentColor"
            opacity="0.75"
          />
        );
      })}

      {/* Tâm trống đồng */}
      <circle cx="250" cy="250" r="22" fill="currentColor" opacity="0.9" />
      <circle cx="250" cy="250" r="14" fill="#FDFBF7" />
      <circle cx="250" cy="250" r="6" fill="currentColor" />
    </svg>
  );
}
