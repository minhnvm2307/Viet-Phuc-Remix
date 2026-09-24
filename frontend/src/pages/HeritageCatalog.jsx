import React, { useState, useEffect } from 'react';
import DongSonWatermark from '../components/DongSonWatermark';
import ArchCarousel from '../components/ArchCarousel';
import DynastyZigZagSection from '../components/DynastyZigZagSection';
import CuratorModal from '../components/CuratorModal';

export default function HeritageCatalog({ searchQuery, onSelectForStudio }) {
  const [costumes, setCostumes] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [selectedCostume, setSelectedCostume] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tải danh mục phụ kiện từ backend
  useEffect(() => {
    fetch('/api/heritage/accessories')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setAccessories(data.items);
      })
      .catch((err) => console.error('Lỗi tải phụ kiện:', err));
  }, []);

  // Danh sách các triều đại và cấu hình theme màu tương ứng
  const DYNASTY_CONFIGS = [
    {
      id: 'dynasty-nguyen',
      name: 'Nhà Nguyễn',
      watermarkText: 'TRIỀU NGUYỄN',
      period: 'Thế Kỷ XIX – Đầu Thế Kỷ XX',
      themeColor: '#8C2D19', // Đỏ son hoàng cung
      bgColor: '#FBF8F5',
      costumeId: 'ao-nhat-binh',
      archCaption: 'Áo Nhật Bình',
      eraName: 'Nhà Nguyễn'
    },
    {
      id: 'dynasty-le',
      name: 'Nhà Hậu Lê',
      watermarkText: 'HẬU LÊ',
      period: 'Thế Kỷ XV – Thế Kỷ XVIII',
      themeColor: '#1B3B48', // Xanh chàm indigo
      bgColor: '#F5F9FA',
      costumeId: 'ao-giao-linh',
      archCaption: 'Áo Giao Lĩnh',
      eraName: 'Nhà Hậu Lê'
    },
    {
      id: 'dynasty-tran',
      name: 'Nhà Trần - Lý',
      watermarkText: 'LÝ - TRẦN',
      period: 'Thế Kỷ XI – Thế Kỷ XIV',
      themeColor: '#704828', // Nâu đất trầm mặc / Đồ gốm ngự
      bgColor: '#FBF7F2',
      costumeId: 'ao-vien-linh',
      archCaption: 'Áo Viên Lĩnh',
      eraName: 'Nhà Trần'
    },
    {
      id: 'dynasty-ao-tac',
      name: 'Lễ Phục Triều Nguyễn',
      watermarkText: 'ÁO TẤC',
      period: 'Năm 1744 – 1945',
      themeColor: '#204646', // Xanh ngọc bích / Sage
      bgColor: '#F5F9F8',
      costumeId: 'ao-tac',
      archCaption: 'Áo Tấc Tay Thụng',
      eraName: 'Triều Nguyễn'
    },
    {
      id: 'dynasty-dan-gian',
      name: 'Văn Hóa Kinh Bắc',
      watermarkText: 'KINH BẮC',
      period: 'Dân Gian Cổ Truyền',
      themeColor: '#6B4024', // Nâu vỏ dà / Đũi mộc
      bgColor: '#FAF6F2',
      costumeId: 'ao-tu-than',
      archCaption: 'Áo Tứ Thân',
      eraName: 'Dân Gian'
    },
    {
      id: 'dynasty-tan-thoi',
      name: 'Tân Thời 1930s',
      watermarkText: 'TÂN THỜI',
      period: 'Thập Niên 1930 – 1954',
      themeColor: '#8C4654', // Hồng mận Indochine
      bgColor: '#FAF5F7',
      costumeId: 'ao-dai-lemur-le-pho',
      archCaption: 'Áo Dài Lemur',
      eraName: 'Tân Thời'
    },
    {
      id: 'dynasty-tay-bac',
      name: 'Thổ Cẩm Tây Bắc',
      watermarkText: 'TÂY BẮC',
      period: 'Di Sản Dân Tộc Bản Địa',
      themeColor: '#3A4852', // Xám than chì & Khăn Piêu
      bgColor: '#F6F8F9',
      costumeId: 'trang-phuc-thai-den',
      archCaption: 'Áo Khóm Thái',
      eraName: 'Tây Bắc'
    }
  ];

  // Fetch dữ liệu từ FastAPI backend
  useEffect(() => {
    fetchCostumes();
  }, [searchQuery]);

  const fetchCostumes = async () => {
    try {
      const url = searchQuery
        ? `/api/heritage/costumes?q=${encodeURIComponent(searchQuery)}`
        : '/api/heritage/costumes';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCostumes(data.costumes || []);
      }
    } catch (e) {
      console.error('Lỗi tải costumes:', e);
    } finally {
      setLoading(false);
    }
  };

  // 4. Cơ chế Đổi Màu Động Theo Triều Đại bằng IntersectionObserver
  useEffect(() => {
    const sections = document.querySelectorAll('.dynasty-section');
    if (!sections.length) return;

    const root = document.documentElement;
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: 0.35
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sections.forEach((s) => s.classList.remove('active'));
          entry.target.classList.add('active');

          const themeColor = entry.target.getAttribute('data-theme-color');
          const bgColor = entry.target.getAttribute('data-bg-color');

          if (themeColor) {
            root.style.setProperty('--dynasty-color', themeColor);
          }
          if (bgColor) {
            root.style.setProperty('--bg-light', bgColor);
          }
        }
      });
    }, observerOptions);

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      observer.disconnect();
    };
  }, [costumes]);

  // Cuộn mượt đến triều đại khi click vào thẻ vòm Carousel
  const scrollToDynasty = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Ghép dữ liệu phục trang vào từng triều đại
  const dynastySections = DYNASTY_CONFIGS.map((cfg) => {
    const matched = costumes.find((c) => c.id === cfg.costumeId);
    return {
      ...cfg,
      primaryCostume: matched || {
        id: cfg.costumeId,
        name: cfg.archCaption,
        era_origin: cfg.period,
        significance: 'Di sản phục trang truyền thống Việt Nam tiêu biểu của thời kỳ.',
        cover_image: `/static/seeds/images/${cfg.costumeId}-cover.jpg`,
        remix_image: `/static/seeds/images/${cfg.costumeId}-remix.jpg`
      }
    };
  });

  // Dữ liệu cho Arch Hero Carousel
  const archCarouselItems = dynastySections.map((d) => ({
    id: d.id,
    sectionId: d.id,
    name: d.archCaption,
    eraName: d.eraName,
    image: d.primaryCostume.remix_image || d.primaryCostume.cover_image,
    fallbackImage: d.primaryCostume.cover_image
  }));

  return (
    <div style={{ position: 'relative' }}>
      {/* 1. NỀN HOA VĂN TRỐNG ĐỒNG ĐÔNG SƠN CỐ ĐỊNH (STATIC WATERMARK) */}
      <DongSonWatermark />

      {/* 2. CAROUSEL DANH MỤC KHUNG VÒM (ARCH HERO CAROUSEL) */}
      <ArchCarousel
        items={archCarouselItems}
        onScrollToDynasty={scrollToDynasty}
      />

      {/* 3. DANH SÁCH TRIỀU ĐẠI BỐ CỤC ZIG-ZAG */}
      <main id="dynasties" className="timeline-container">
        {dynastySections.map((dynasty, index) => (
          <DynastyZigZagSection
            key={dynasty.id}
            dynasty={dynasty}
            index={index}
            allAccessories={accessories}
            onOpenGallery={(costume) => setSelectedCostume(costume)}
            onTryOn={(costume, accessory) => onSelectForStudio(costume, 'upload', accessory)}
          />
        ))}
      </main>

      {/* Modal Sổ Tay Giám Tuyển Khi Người Dùng Muốn Tra Cứu Toàn Diện */}
      {selectedCostume && (
        <CuratorModal
          costume={selectedCostume}
          onClose={() => setSelectedCostume(null)}
          onSelectForStudio={(c, accessory) => {
            setSelectedCostume(null);
            onSelectForStudio(c, 'upload', accessory);
          }}
        />
      )}
    </div>
  );
}
