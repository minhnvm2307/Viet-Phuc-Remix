import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Camera,
  Check,
  Paperclip,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

// Bảng màu sắc trang phục cung đình & dân gian
const COLOR_SWATCHES = [
  { name: 'Lam Chàm Cổ (Mộc)', hex: '#1B3B48', light: false },
  { name: 'Đỏ Son Cung Đình', hex: '#8C2D19', light: false },
  { name: 'Vàng Hoàng Yến', hex: '#C48B28', light: false },
  { name: 'Xanh Ngọc Bích', hex: '#1E6554', light: false },
  { name: 'Trắng Giấy Dó', hex: '#F0ECE1', light: true },
  { name: 'Mực Nho Huyền', hex: '#212121', light: false }
];

// Gợi ý prompt mẫu phong cách Gen Z
const SUGGESTION_CHIPS = [
  { icon: '🍂', label: 'Phối áo len cổ lọ mùa thu', prompt: 'Phối cùng áo len dệt kim cổ lọ tối giản và áo khoác ngoài' },
  { icon: '👔', label: 'Mix quần âu & giày da', prompt: 'Kết hợp quần tây ống suông cạp cao và giày da Loafers bóng' },
  { icon: '🦚', label: 'Điểm xuyết ngũ sắc hoàng gia', prompt: 'Thêm dải ngũ sắc cung đình thêu tay và chuỗi ngọc hoàng gia' }
];

// Ảnh chân dung mẫu mặc định
const DEFAULT_USER_PORTRAIT = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

export default function StudioPage({
  initialCostume,
  initialAccessory = null,
  onBackToCatalog
}) {
  const [costumes, setCostumes] = useState([]);
  const [selectedCostume, setSelectedCostume] = useState(initialCostume || null);
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  const [selectedProposal, setSelectedProposal] = useState(0);

  // Phụ kiện được chọn: dictionary { [id]: item }
  const [selectedAccessories, setSelectedAccessories] = useState({});
  const [accessories, setAccessories] = useState([]);

  // Ảnh người dùng
  const [userPhoto, setUserPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // ChatGPT prompt bar
  const [mixPrompt, setMixPrompt] = useState('Ghép ảnh trên và thay quần là quần jean');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState('');

  // Tải danh sách trang phục
  useEffect(() => {
    fetch('/api/heritage/costumes')
      .then((res) => res.json())
      .then((data) => {
        if (data.costumes && data.costumes.length > 0) {
          setCostumes(data.costumes);
          if (!selectedCostume) {
            setSelectedCostume(data.costumes[0]);
          } else {
            const matched = data.costumes.find((c) => c.id === selectedCostume.id);
            if (matched) setSelectedCostume(matched);
          }
        }
      })
      .catch((err) => console.error('Error fetching costumes:', err));
  }, []);

  // Cập nhật khi prop initialCostume thay đổi
  useEffect(() => {
    if (initialCostume) {
      setSelectedCostume(initialCostume);
    }
  }, [initialCostume]);

  // Tải phụ kiện từ API
  useEffect(() => {
    fetch('/api/heritage/accessories')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setAccessories(data.items);

          // Mặc định chọn 2-3 phụ kiện đẹp cho giống bản mẫu
          const initialMap = {};
          if (initialAccessory) {
            initialMap[initialAccessory.id] = initialAccessory;
          }
          // Chọn mẫu nón quai thao & kiềng bạc nếu có
          const kieng = data.items.find((a) => a.id.includes('vong') || a.id.includes('tram') || a.id.includes('kieng'));
          const non = data.items.find((a) => a.id.includes('non') || a.id.includes('mu'));
          if (kieng) initialMap[kieng.id] = kieng;
          if (non) initialMap[non.id] = non;

          setSelectedAccessories(initialMap);
        }
      })
      .catch((err) => console.error('Error fetching accessories:', err));
  }, []);

  // Xử lý upload ảnh cá nhân
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserPhoto(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle chọn / bỏ chọn phụ kiện
  const toggleAccessory = (item) => {
    setSelectedAccessories((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  };

  // Xử lý submit prompt
  const handlePromptSubmit = (e) => {
    e?.preventDefault();
    if (!mixPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedNote(mixPrompt);
    }, 1200);
  };

  // 3 phương án phối AI
  const proposals = [
    {
      id: 0,
      title: 'Phương Án 1',
      image: selectedCostume?.remix_image || selectedCostume?.cover_image || '/static/seeds/images/ao-giao-linh-remix.jpg',
      desc: 'Bản phối đương đại sắc nét'
    },
    {
      id: 1,
      title: 'Phương Án 2',
      image: selectedCostume?.cover_image || '/static/seeds/images/ao-nhat-binh-cover.jpg',
      desc: 'Phục dựng lịch sử nguyên bản'
    },
    {
      id: 2,
      title: 'Phương Án 3',
      image: selectedCostume?.gallery?.[0] || selectedCostume?.remix_image || '/static/seeds/images/ao-tac-remix.jpg',
      desc: 'Phối phá cách Modern Minimalist'
    }
  ];

  // Nhóm phụ kiện theo nhóm chuẩn trong hình mẫu
  const accessoryGroups = [
    {
      id: 'headwear',
      label: 'MŨ & NÓN',
      items: accessories.filter((a) => a.category === 'headwear')
    },
    {
      id: 'jewelry',
      label: 'TRANG SỨC',
      items: accessories.filter((a) => a.category === 'jewelry')
    },
    {
      id: 'hairstyles',
      label: 'KIỂU TÓC & KHĂN VẤN',
      items: accessories.filter((a) => a.category === 'hairstyles')
    },
    {
      id: 'footwear',
      label: 'HÀI & GUỐC',
      items: accessories.filter((a) => a.category === 'footwear')
    }
  ].filter((g) => g.items.length > 0);

  const selectedCount = Object.keys(selectedAccessories).length;
  const currentCostumeImage = proposals[selectedProposal]?.image || selectedCostume?.remix_image || selectedCostume?.cover_image;

  return (
    <div className="studio-container">
      {/* 1. TOP BAR: THANH ĐIỀU HƯỚNG TRANG PHỤC NỀN */}
      <div className="studio-costume-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBackToCatalog} className="btn-back-link" title="Quay lại danh mục">
            <ArrowLeft size={16} />
          </button>
          <span className="bar-label">TRANG PHỤC NỀN:</span>
        </div>

        <div className="costume-pill-list">
          {costumes.map((c) => {
            const isSelected = selectedCostume?.id === c.id;
            return (
              <button
                key={c.id}
                className={`costume-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCostume(c)}
              >
                <span>{c.name}</span>
                {isSelected && <Check size={13} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. LƯỚI BỐ CỤC CHÍNH 2 CỘT CHUẨN THIẾT KẾ MẪU */}
      <div className="studio-main-grid">
        {/* ================= CỘT TRÁI ================= */}
        <div className="studio-left-col">
          {/* KHỐI 1: KHUNG ẢNH ĐỐI SÁNH SONG SONG (User Portrait + Costume Model) */}
          <div className="split-view-card">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* Nửa trái: Ảnh chân dung cá nhân */}
            <div className="user-photo-half">
              <img
                src={userPhoto || DEFAULT_USER_PORTRAIT}
                alt="Chân dung cá nhân"
                className="portrait-img"
              />
              <button
                type="button"
                className="btn-upload-overlay"
                onClick={() => fileInputRef.current?.click()}
                title="Tải ảnh chân dung của bạn lên"
              >
                <Upload size={14} />
              </button>
            </div>

            {/* Nửa phải: Ảnh người mẫu mặc cổ phục */}
            <div className="costume-photo-half">
              <img
                src={currentCostumeImage}
                alt={selectedCostume?.name}
                className="costume-img"
              />
            </div>
          </div>

          {/* KHỐI 2: 3 PHƯƠNG ÁN PHỐI AI + THANH CHAT PROMPT */}
          <div className="proposals-card">
            {/* Header phương án */}
            <div className="proposals-header">
              <div className="proposals-title">
                <span className="red-dot">●</span>
                <span>3 PHƯƠNG ÁN PHỐI AI</span>
              </div>
              <span className="proposals-hint">Bấm vào ảnh để chọn phương án</span>
            </div>

            {/* 3 Thẻ phương án phối */}
            <div className="proposals-grid">
              {proposals.map((prop, idx) => {
                const isSelected = selectedProposal === idx;
                return (
                  <div
                    key={prop.id}
                    className={`proposal-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedProposal(idx)}
                  >
                    <img src={prop.image} alt={prop.title} />
                    <span className="proposal-label">{prop.title}</span>
                    {isSelected && (
                      <div className="selected-check-badge">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Gợi ý chips */}
            <div className="suggestion-chips">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip-btn"
                  onClick={() => setMixPrompt(chip.prompt)}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Thanh chat prompt phong cách ChatGPT */}
            <form className="chat-prompt-bar" onSubmit={handlePromptSubmit}>
              <button
                type="button"
                className="prompt-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Tải ảnh đính kèm"
              >
                <Paperclip size={16} />
              </button>

              <input
                type="text"
                className="prompt-input"
                value={mixPrompt}
                onChange={(e) => setMixPrompt(e.target.value)}
                placeholder="Mô tả ý tưởng phối đồ (vd: Ghép ảnh trên và thay quần là quần jean)..."
              />

              <div className="model-badge">GEMINI 3 FLASH</div>

              <button
                type="submit"
                className="prompt-submit-btn"
                disabled={isGenerating}
                title="Gửi yêu cầu phối đồ"
              >
                {isGenerating ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={15} strokeWidth={2.5} />}
              </button>
            </form>

            {/* Chú thích bản quyền và đào tạo AI */}
            <div className="atelier-caption">
              AI Atelier được huấn luyện dựa trên quy chuẩn tư liệu Viện Nghiên cứu Di sản.
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI ================= */}
        <div className="studio-right-col">
          {/* KHỐI 1: THÔNG TIN TRANG PHỤC & BẢNG MÀU SẮC */}
          <div className="costume-info-card">
            <div className="info-top-row">
              <span className="era-tag">
                {selectedCostume?.era_origin ? selectedCostume.era_origin.toUpperCase() : 'THỜI LÝ - TRẦN - LÊ'}
              </span>
              <span className="region-tag">
                {selectedCostume?.region ? selectedCostume.region.toUpperCase() : 'BẮC BỘ • THĂNG LONG'}
              </span>
            </div>

            <h2 className="costume-title">{selectedCostume?.name}</h2>

            <p className="costume-description">
              {selectedCostume?.significance}
            </p>

            {/* Bộ màu sắc trang phục */}
            <div className="color-palette-section">
              <div className="palette-header">
                <span className="palette-label">MÀU SẮC TRANG PHỤC:</span>
                <span className="selected-color-name">{selectedColor.name}</span>
              </div>

              <div className="palette-swatches">
                {COLOR_SWATCHES.map((color, idx) => {
                  const isColorActive = selectedColor.hex === color.hex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`swatch-circle ${isColorActive ? 'active' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setSelectedColor(color)}
                      title={color.name}
                    >
                      {isColorActive && (
                        <Check size={12} strokeWidth={3} color={color.light ? '#000000' : '#FFFFFF'} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KHỐI 2: PHỤ KIỆN ĐI KÈM */}
          <div className="accessories-card">
            <div className="accessories-header">
              <div>
                <h3 className="accessories-title">Phụ Kiện Đi Kèm</h3>
                <span className="accessories-subtitle">Chọn để áp dụng vào 3 phương án phối</span>
              </div>
              <span className="count-badge">{selectedCount} món đã chọn</span>
            </div>

            {/* Danh sách phụ kiện cuộn chuẩn dạng lưới */}
            <div className="accessories-list-scroll">
              {accessoryGroups.map((group) => (
                <div key={group.id} className="accessory-group">
                  <div className="group-label">{group.label}</div>

                  <div className="accessory-cards-grid">
                    {group.items.map((item) => {
                      const isSelected = !!selectedAccessories[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`accessory-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleAccessory(item)}
                        >
                          <div className="acc-img-wrapper">
                            <img src={item.image} alt={item.name} loading="lazy" />
                          </div>
                          <div className="acc-caption">
                            <span>{item.name}</span>
                            {isSelected && <Check size={12} strokeWidth={2.5} className="check-icon" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
