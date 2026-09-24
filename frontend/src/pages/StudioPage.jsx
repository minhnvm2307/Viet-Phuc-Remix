import React, { useState, useRef, useEffect } from 'react';

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
  { label: 'Phối áo len cổ lọ mùa thu', prompt: 'Phối cùng áo len dệt kim cổ lọ tối giản, quần tây và áo khoác ngoài' },
  { label: 'Ghép ảnh và thay quần jean', prompt: 'Ghép áo cổ phục trên và thay quần là quần jean ống rộng, giày sneaker' },
  { label: 'Mix quần âu & giày da', prompt: 'Kết hợp quần tây ống suông cạp cao và giày da Loafers bóng bẩy' },
  { label: 'Điểm xuyết ngũ sắc hoàng gia', prompt: 'Thêm dải ngũ sắc cung đình thêu tay và chuỗi ngọc hoàng gia' }
];

// 3 Danh mục phụ kiện THỰC TẾ duy nhất hiện có trong kho di sản
const ACCESSORY_TABS = [
  { id: 'headwear', label: 'MŨ & NÓN' },
  { id: 'hairstyles', label: 'KIỂU TÓC' },
  { id: 'jewelry', label: 'TRANG SỨC' }
];

// Phân loại triều đại CHÍNH XÁC theo từng trang phục
const getDynastyForCostume = (costume) => {
  if (!costume) return null;
  const era = (costume.era_code || '').toUpperCase();
  const id = (costume.id || '').toLowerCase();

  // Lý - Trần
  if (id.includes('ly-') || id.includes('tran-') || id.includes('giao-linh') || id.includes('vien-linh')) {
    return ['LY_TRAN'];
  }
  // Lê
  if (id.includes('le-')) {
    return ['LE_MAC'];
  }
  // Nguyễn
  if (era.includes('NGUYEN') || id.includes('nhat-binh') || id.includes('ao-tac') || id.includes('ngu-than')) {
    return ['NGUYEN_DYNASTY'];
  }
  // Dân gian Bắc Bộ
  if (id.includes('tu-than')) {
    return ['DAN_GIAN'];
  }
  // Dân gian Nam Bộ
  if (id.includes('ba-ba')) {
    return ['NAM_BO', 'DAN_GIAN'];
  }
  // Tân thời
  if (era.includes('TAN_THOI') || id.includes('lemur')) {
    return ['NGUYEN_DYNASTY', 'DAN_GIAN'];
  }
  // Đinh
  if (id.includes('dinh')) {
    return ['DINH'];
  }
  // Ngô
  if (id.includes('ngo')) {
    return ['NGO'];
  }
  return null;
};

export default function StudioPage({
  initialCostume,
  initialAccessory = null,
  onBackToCatalog
}) {
  const [costumes, setCostumes] = useState([]);
  const [selectedCostume, setSelectedCostume] = useState(initialCostume || null);
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);

  // Phụ kiện từ backend và từ điển phụ kiện đang chọn (key theo category: max 1 món mỗi category)
  const [allAccessories, setAllAccessories] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState({});
  const [activeAccTab, setActiveAccTab] = useState('headwear');

  // Ảnh tải lên của người dùng
  const [userPhoto, setUserPhoto] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Ảnh từ Gallery của trang phục dùng để ghép: mặc định là ảnh đầu tiên trong list gallery
  const [selectedCostumeImage, setSelectedCostumeImage] = useState(null);

  // ChatGPT prompt bar & Trạng thái sinh AI
  const [mixPrompt, setMixPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [activeProposalIndex, setActiveProposalIndex] = useState(0);

  // Danh sách ảnh trong Gallery của trang phục được chọn (Ảnh phục dựng nguyên gốc để làm ảnh nền ghép)
  const costumeGallery = (selectedCostume?.gallery && selectedCostume.gallery.length > 0)
    ? selectedCostume.gallery
    : [selectedCostume?.cover_image].filter(Boolean);

  // Khi selectedCostume thay đổi:
  // 1. Tự động chọn ảnh ĐẦU TIÊN trong list gallery làm ảnh ghép
  // 2. RESET TOÀN BỘ trạng thái output (Chưa bấm Tạo Ảnh thì tuyệt đối không được hiện output)
  useEffect(() => {
    if (costumeGallery.length > 0) {
      setSelectedCostumeImage(costumeGallery[0]);
    }
    setHasGeneratedOnce(false);
    setIsGenerating(false);
    setActiveProposalIndex(0);
  }, [selectedCostume?.id]);

  // Khi thay đổi ảnh user, reset output (phải bấm Tạo Ảnh mới render lại)
  useEffect(() => {
    setHasGeneratedOnce(false);
    setIsGenerating(false);
  }, [userPhoto]);

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

  // Tải toàn bộ danh mục phụ kiện từ backend
  useEffect(() => {
    fetch('/api/heritage/accessories')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setAllAccessories(data.items);
        }
      })
      .catch((err) => console.error('Error fetching accessories:', err));
  }, []);

  // 1. PHÂN LOẠI ĐÚNG THEO TRIỀU ĐẠI CỦA TRANG PHỤC ĐANG CHỌN
  const matchedAccessories = React.useMemo(() => {
    const allowed = getDynastyForCostume(selectedCostume);
    if (!allowed) return allAccessories;
    const filtered = allAccessories.filter((acc) => allowed.includes(acc.dynasty_code) || acc.dynasty_code === 'ALL');
    return filtered.length > 0 ? filtered : allAccessories;
  }, [selectedCostume, allAccessories]);

  // Khi đổi trang phục, tự động chuyển tab phù hợp và chỉ gợi ý tối đa 1 món phụ kiện hợp triều đại
  useEffect(() => {
    if (matchedAccessories.length > 0) {
      const initialMap = {};
      if (initialAccessory && matchedAccessories.some((a) => a.id === initialAccessory.id)) {
        initialMap[initialAccessory.category] = initialAccessory;
      } else {
        const defHead = matchedAccessories.find((a) => a.category === 'headwear');
        if (defHead) initialMap[defHead.category] = defHead;
      }
      setSelectedAccessories(initialMap);
    } else {
      setSelectedAccessories({});
    }
  }, [selectedCostume?.id, matchedAccessories]);

  // Xử lý file ảnh tải lên
  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  // GIỚI HẠN PHỤ KIỆN: Mỗi loại (category) chỉ được chọn TỐI ĐA 1 MÓN, không bao giờ bị stacking
  const toggleAccessory = (item) => {
    setSelectedAccessories((prev) => {
      const next = { ...prev };
      // Nếu món này đã được chọn thì bỏ chọn
      if (next[item.category]?.id === item.id) {
        delete next[item.category];
        return next;
      }
      // Chọn món mới sẽ thay thế món cũ cùng loại (1 Mũ & Nón, 1 Kiểu Tóc, 1 Trang Sức)
      next[item.category] = item;
      return next;
    });
  };

  // Xóa món theo loại
  const removeAccessoryByCategory = (category) => {
    setSelectedAccessories((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  // Xử lý submit prompt tạo phối đồ AI
  const handlePromptSubmit = (e) => {
    e?.preventDefault();
    if (!mixPrompt.trim() && !hasGeneratedOnce) {
      setMixPrompt('Phối trang phục cổ phục cùng phong cách hiện đại');
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGeneratedOnce(true);
    }, 1800);
  };

  // Danh sách các phụ kiện hiện đang được pick (tối đa 3 món: 1 Mũ/Nón, 1 Kiểu Tóc, 1 Trang Sức)
  const selectedAccList = Object.values(selectedAccessories);

  // 2 Ô OUTPUT SAU KHI DÙNG AI MIX ĐỒ (Chỉ xuất hiện sau khi submit nút Tạo Ảnh)
  const getAiOutputs = () => {
    if (selectedCostume?.id === 'ao-ngu-than-tay-chen') {
      return [
        '/static/seeds/images/ao-ngu-than-tay-chen-remix.jpg',
        '/static/seeds/images/ao-ngu-than-tay-chen-remix-var2.jpg'
      ];
    }
    if (selectedCostume?.id === 'ao-tac') {
      return [
        '/static/seeds/images/ao-tac-remix.jpg',
        '/static/seeds/images/ao-tac-remix-var2.jpg'
      ];
    }
    if (selectedCostume?.id === 'ao-giao-linh') {
      return [
        '/static/seeds/images/ao-giao-linh-remix.jpg',
        '/static/seeds/images/ao-giao-linh-gallery-1.png'
      ];
    }
    if (selectedCostume?.id === 'ao-nhat-binh') {
      return [
        '/static/seeds/images/ao-nhat-binh-remix.jpg',
        '/static/seeds/images/ao-nhat-binh-gallery-1.jpg'
      ];
    }
    if (selectedCostume?.id === 'ao-tu-than') {
      return [
        '/static/seeds/images/ao-tu-than-remix.jpg',
        '/static/seeds/images/ao-tu-than-gallery-1.jpg'
      ];
    }
    if (selectedCostume?.id === 'ao-dai-lemur-le-pho') {
      return [
        '/static/seeds/images/ao-dai-lemur-le-pho-remix.jpg',
        '/static/seeds/images/ao-dai-lemur-le-pho-cover.png'
      ];
    }
    return [
      selectedCostume?.remix_image || selectedCostume?.cover_image || '/static/seeds/images/ao-giao-linh-remix.jpg',
      selectedCostume?.remix_image || selectedCostume?.cover_image || '/static/seeds/images/ao-giao-linh-remix.jpg'
    ];
  };
  const aiOutputImages = getAiOutputs();

  // Lọc phụ kiện theo tab đang chọn (chỉ trong danh sách đã khớp triều đại)
  const filteredAccessories = matchedAccessories.filter((a) => a.category === activeAccTab);

  // Đếm số phụ kiện đã chọn theo từng tab
  const getTabSelectedCount = (tabId) => {
    return selectedAccessories[tabId] ? 1 : 0;
  };

  // Ảnh trang phục đang chọn dùng để ghép
  const activeCostumeMixImage = selectedCostumeImage || costumeGallery[0];

  return (
    <div className="studio-container">
      {/* 1. THANH TOP BAR: ĐIỀU HƯỚNG TRANG PHỤC NỀN ĐẦY ĐỦ (CÓ KHOẢNG CÁCH KHÔNG BỊ CHÌM BỞI HEADER SITE) */}
      <div className="studio-costume-bar" style={{ marginTop: '10px' }}>
        <div className="bar-header-row">
          <button onClick={onBackToCatalog} className="btn-back-link" title="Quay lại danh mục cổ phục">
            QUAY LẠI
          </button>
          <span className="bar-label">TRANG PHỤC NỀN:</span>
          <span className="costume-count-badge">({costumes.length} mẫu di sản)</span>
        </div>

        {/* Danh sách trang phục nền đầy đủ cả 16 mẫu */}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BỐ CỤC CHÍNH 2 CỘT */}
      <div className="studio-main-grid">
        {/* ================= CỘT TRÁI ================= */}
        <div className="studio-left-col">
          {/* KHỐI 1: KHUNG ĐỐI SÁNH MIX ĐỒ (Upload ảnh User <-> Trang phục cổ phục) */}
          <div className="split-view-card">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* NỬA TRÁI: Ô TẢI ẢNH CỦA BẠN LÊN */}
            <div className="user-photo-half">
              {userPhoto ? (
                <div className="uploaded-photo-wrapper">
                  <img
                    src={userPhoto}
                    alt="Ảnh chân dung đã tải lên"
                    className="portrait-img"
                  />
                  <div className="user-photo-badge">
                    <span>ẢNH CỦA BẠN</span>
                  </div>
                  <div className="user-photo-actions">
                    <button
                      type="button"
                      className="btn-change-photo"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      ĐỔI ẢNH
                    </button>
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => setUserPhoto(null)}
                    >
                      XÓA
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Nhấp vào đây để tải ảnh chân dung của bạn lên"
                >
                  <div className="dropzone-title">TẢI ẢNH CỦA BẠN LÊN</div>
                  <div className="dropzone-subtitle">
                    Nhấp vào khung này hoặc kéo thả ảnh chân dung / toàn thân vào đây
                  </div>
                </div>
              )}
            </div>

            {/* HUY HIỆU MIX ĐỒ Ở GIỮA */}
            <div className="mix-transfer-indicator">
              <span className="indicator-label">MIX ĐỒ</span>
            </div>

            {/* NỬA PHẢI: ẢNH ĐỂ GHÉP (ẢNH ĐẦU TIÊN TRONG GALLERY, CÓ THỂ PICK CHỌN) */}
            <div className="costume-photo-half">
              <img
                src={activeCostumeMixImage}
                alt={selectedCostume?.name}
                className="costume-img"
              />

              {/* BỘ CHỌN (PICK) ẢNH ĐỂ GHÉP TỪ LIST GALLERY */}
              {costumeGallery.length > 1 && (
                <div className="costume-gallery-picker">
                  <div className="picker-header">
                    <span>CHỌN ẢNH ĐỂ GHÉP:</span>
                    <span className="picker-count">{costumeGallery.length} ảnh trong gallery</span>
                  </div>
                  <div className="picker-thumbnails">
                    {costumeGallery.map((imgUrl, idx) => {
                      const isImgActive = activeCostumeMixImage === imgUrl;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`thumb-btn ${isImgActive ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCostumeImage(imgUrl);
                          }}
                          title={`Chọn ảnh ${idx + 1} để ghép`}
                        >
                          <img src={imgUrl} alt={`Góc ảnh ${idx + 1}`} />
                          <span className="thumb-number">{idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="costume-overlay-tag">
                <span className="dot" style={{ backgroundColor: selectedColor.hex }} />
                <span>{selectedCostume?.name}</span>
              </div>
            </div>
          </div>

          {/* KHỐI 2: Ô HIỂN THỊ PHỤ KIỆN ĐƯỢC CHỌN (BOX CỐ ĐỊNH, MAX-WIDTH, KHÔNG STACKING) */}
          <div className="selected-mix-staging-bar">
            <div className="staging-header">
              <div className="staging-title-box">
                <span className="staging-indicator-dot">●</span>
                <span className="staging-title">Phụ kiện:</span>
              </div>
              <span className="staging-count-text">
                {selectedAccList.length}/3 món tối đa
              </span>
            </div>

            <div className="staging-items-flow">
              {/* Trang phục nền đang chọn */}
              <div className="staging-item-chip base">
                <div className="chip-thumb">
                  <img
                    src={activeCostumeMixImage}
                    alt={selectedCostume?.name}
                  />
                </div>
                <div className="chip-details">
                  <span className="chip-tag">TRANG PHỤC NỀN</span>
                  <span className="chip-name">{selectedCostume?.name}</span>
                </div>
              </div>

              {/* Các phụ kiện được pick (Mỗi loại tối đa 1 món duy nhất) */}
              {selectedAccList.map((acc) => (
                <div key={acc.id} className="staging-item-chip accessory">
                  <div className="chip-thumb">
                    <img src={acc.image} alt={acc.name} />
                  </div>
                  <div className="chip-details">
                    <span className="chip-tag">
                      {acc.category === 'headwear' ? 'MŨ & NÓN' :
                       acc.category === 'hairstyles' ? 'KIỂU TÓC' : 'TRANG SỨC'}
                    </span>
                    <span className="chip-name">{acc.name}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-chip-remove"
                    onClick={() => removeAccessoryByCategory(acc.category)}
                    title={`Bỏ món ${acc.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Các ô chờ cố định để giữ thanh phụ kiện luôn vừa vặn 3 phụ kiện và cố định vị trí */}
              {Array.from({ length: 3 - selectedAccList.length }).map((_, idx) => (
                <div key={`empty-slot-${idx}`} className="staging-item-slot-empty">
                  <span className="slot-empty-dot">+</span>
                  <span className="slot-empty-text">Thêm phụ kiện</span>
                </div>
              ))}
            </div>
          </div>

          {/* GỢI Ý CHIPS & THANH CHAT PROMPT */}
          <div className="prompt-container-card">
            <div className="suggestion-chips">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip-btn"
                  onClick={() => setMixPrompt(chip.prompt)}
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            <form className="chat-prompt-bar" onSubmit={handlePromptSubmit}>
              <input
                type="text"
                className="prompt-input"
                value={mixPrompt}
                onChange={(e) => setMixPrompt(e.target.value)}
                placeholder="Nhập mô tả của bạn"
              />

              <div className="model-badge">GEMINI</div>

              <button
                type="submit"
                className="prompt-submit-btn"
                disabled={isGenerating}
              >
                {isGenerating ? 'ĐANG TẠO...' : 'TẠO ẢNH'}
              </button>
            </form>
          </div>

          {/* KHỐI 3: ĐÚNG 2 Ô OUTPUT (CHỈ XUẤT HIỆN KHI SUBMIT, KHÔNG CÓ TIÊU ĐỀ / MÔ TẢ TRÊN ẢNH) */}
          {(isGenerating || hasGeneratedOnce) && (
            <div className="nano-output-section">
              <div className="nano-output-grid-two">
                {aiOutputImages.map((imgUrl, idx) => {
                  const isSelected = activeProposalIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`nano-card-two ${isSelected && hasGeneratedOnce ? 'active' : ''}`}
                      onClick={() => {
                        if (hasGeneratedOnce) setActiveProposalIndex(idx);
                      }}
                    >
                      {isGenerating ? (
                        /* HIỆU ỨNG LOADING MỜ MỜ NHƯ WATER KIỂU NANO BANANA CỦA GEMINI */
                        <div className="nano-water-loader">
                          <div className="water-wave-layer" />
                          <div className="water-wave-layer secondary" />
                          <div className="water-shimmer-glow" />
                        </div>
                      ) : (
                        /* CHỈ HIỂN THỊ ẢNH THUẦN TÚY, TUYỆT ĐỐI KHÔNG CÓ TITLE HAY MÔ TẢ TRÊN ẢNH */
                        <div className="nano-pure-img-wrapper">
                          <img src={imgUrl} alt="" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================= CỘT PHẢI ================= */}
        <div className="studio-right-col">
          {/* KHỐI 1: THÔNG TIN TRANG PHỤC NỀN & BẢNG MÀU */}
          <div className="costume-info-card">
            <div className="info-top-row">
              <span className="era-tag">
                {selectedCostume?.era_origin ? selectedCostume.era_origin.toUpperCase() : 'THỜI LÝ - TRẦN - LÊ'}
              </span>
            </div>

            <h2 className="costume-title">{selectedCostume?.name}</h2>

            <p className="costume-description">
              {selectedCostume?.significance}
            </p>

            {/* Bảng màu sắc */}
            <div className="color-palette-section">
              <div className="palette-header">
                <span className="palette-label">MÀU SẮC CHỦ ĐẠO:</span>
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
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* KHỐI 2: PHỤ KIỆN ĐI KÈM (PHÂN THEO ĐÚNG TRIỀU ĐẠI VÀ CHỈ 3 LOẠI CÓ THẬT) */}
          <div className="accessories-card">
            <div className="accessories-header">
              <div>
                <h3 className="accessories-title">Phụ Kiện Phối Kèm</h3>
                <span className="accessories-subtitle">Khảo cứu đúng triều đại trang phục đang chọn</span>
              </div>
              <span className="count-badge">{selectedAccList.length}/3 món đã chọn</span>
            </div>

            {/* THANH TAB 3 LOẠI CÓ THẬT (MŨ & NÓN, KIỂU TÓC, TRANG SỨC) */}
            <div className="accessory-category-tabs">
              {ACCESSORY_TABS.map((tab) => {
                const isTabActive = activeAccTab === tab.id;
                const tabCount = getTabSelectedCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`acc-tab-btn ${isTabActive ? 'active' : ''}`}
                    onClick={() => setActiveAccTab(tab.id)}
                  >
                    <span className="tab-label">{tab.label}</span>
                    {tabCount > 0 && <span className="tab-pill-count">{tabCount}</span>}
                  </button>
                );
              })}
            </div>

            {/* DANH SÁCH PHỤ KIỆN CHÍNH XÁC THEO DANH MỤC VÀ TRIỀU ĐẠI */}
            <div className="accessories-tab-content">
              <div className="current-tab-heading">
                <span>
                  {activeAccTab === 'headwear' && 'MŨ & NÓN DI SẢN'}
                  {activeAccTab === 'hairstyles' && 'KIỂU TÓC & KHĂN VẤN'}
                  {activeAccTab === 'jewelry' && 'TRANG SỨC & CỔ VẬT'}
                </span>
                <span className="item-count-sub">({filteredAccessories.length} mẫu phù hợp)</span>
              </div>

              <div className="accessory-cards-grid">
                {filteredAccessories.map((item) => {
                  const isSelected = selectedAccessories[item.category]?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`accessory-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAccessory(item)}
                    >
                      <div className="acc-img-wrapper">
                        <img src={item.image} alt={item.name} loading="lazy" />
                        {isSelected && (
                          <div className="acc-selected-badge">ĐÃ CHỌN</div>
                        )}
                      </div>
                      <div className="acc-caption">
                        <div className="acc-name">{item.name}</div>
                        <div className="acc-dynasty">{item.dynasty_name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredAccessories.length === 0 && (
                <div className="empty-category-notice">
                  Không có mẫu cho danh mục này ở triều đại hiện tại.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
