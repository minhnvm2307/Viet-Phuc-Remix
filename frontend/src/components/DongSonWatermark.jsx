import React from 'react';

/**
 * 1. NỀN HOA VĂN TRỐNG ĐỒNG ĐÔNG SƠN STATIC (CỐ ĐỊNH CHÍNH GIỮA MÀN HÌNH)
 * Theo chỉ thị thiết kế:
 * - Vị trí fixed chính giữa màn hình (z-index: 0, opacity 0.045)
 * - Khi người dùng scroll trang thì hình trống đồng vẫn đứng yên không bị trôi
 */
export default function DongSonWatermark() {
  return (
    <svg
      className="dongson-watermark"
      viewBox="0 0 1000 1000"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="500" cy="500" r="480" strokeWidth="3" />
      <circle cx="500" cy="500" r="420" strokeWidth="1.5" strokeDasharray="6 6" />
      <circle cx="500" cy="500" r="360" strokeWidth="2" />
      <circle cx="500" cy="500" r="300" strokeWidth="1" />
      <circle cx="500" cy="500" r="220" strokeWidth="2" />
      <circle cx="500" cy="500" r="140" strokeWidth="1.5" />
      <circle cx="500" cy="500" r="60" strokeWidth="3" />

      {/* Ngôi sao trung tâm 14 cánh */}
      <path
        d="M500 360 L515 470 L600 400 L530 485 L640 500 L530 515 L600 600 L515 530 L500 640 L485 530 L400 600 L470 515 L360 500 L470 485 L400 400 L485 470 Z"
        fill="currentColor"
        fillOpacity="0.25"
      />

      {/* Họa tiết tượng trưng chim Lạc */}
      <circle cx="500" cy="500" r="260" strokeWidth="8" strokeLinecap="round" strokeDasharray="1 30" />
      <circle cx="500" cy="500" r="390" strokeWidth="12" strokeLinecap="round" strokeDasharray="2 45" />
    </svg>
  );
}
