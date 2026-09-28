import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CuratorGuardrailNote from '../components/CuratorGuardrailNote';

// Khóa lưu bản nháp Studio trong localStorage
const DRAFT_KEY = 'vietphuc_studio_draft';

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

// Hàm đọc an toàn bản nháp từ localStorage
const loadSavedDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi đọc bản nháp studio từ localStorage:', err);
  }
  return null;
};

export default function StudioPage({
  initialCostume,
  initialAccessory = null,
  onBackToCatalog,
  onRequireAuth
}) {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const costumeQueryId = searchParams.get('costume');
  // Ảnh nguồn được truyền từ trang /advisor (vd trích xuất từ trend) — nếu có,
  // ưu tiên dùng ảnh này làm ảnh ghép thay vì ảnh mặc định trong gallery di sản.
  const incomingSourceImage = location.state?.sourceImageDataUrl || null;

  // Khôi phục bản nháp ban đầu
  const initialDraft = React.useMemo(() => loadSavedDraft(), []);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [costumes, setCostumes] = useState([]);
  const [selectedCostume, setSelectedCostume] = useState(initialCostume || null);
  const [selectedColor, setSelectedColor] = useState(initialDraft?.selectedColor || COLOR_SWATCHES[0]);

  // Phụ kiện từ backend và từ điển phụ kiện đang chọn (key theo category: max 1 món mỗi category)
  const [allAccessories, setAllAccessories] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState(initialDraft?.selectedAccessories || {});
  const [activeAccTab, setActiveAccTab] = useState(initialDraft?.activeAccTab || 'headwear');

  // Ảnh tải lên của người dùng
  const [userPhoto, setUserPhoto] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Ảnh từ Gallery của trang phục dùng để ghép
  const [selectedCostumeImage, setSelectedCostumeImage] = useState(initialDraft?.selectedCostumeImage || null);

  // ChatGPT prompt bar & Trạng thái sinh AI
  const [mixPrompt, setMixPrompt] = useState(initialDraft?.mixPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [activeProposalIndex, setActiveProposalIndex] = useState(0);

  // Trạng thái tiến trình tạo ảnh (Dynamic Progress Steps) & Floating Modal
  const [loadingStageText, setLoadingStageText] = useState('1. Đang khởi tạo template phối đồ...');
  const [loadingProgressPercent, setLoadingProgressPercent] = useState(15);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [generatedResults, setGeneratedResults] = useState(null);

  // Kiểm định văn hóa (Cultural Guardrail)
  const [guardrail, setGuardrail] = useState(null);

  // Tủ ảnh nguồn cá nhân đã lưu (vd từ trang Trend) — dùng lại làm ảnh ghép
  const [savedSourceImages, setSavedSourceImages] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSavedSourceImages([]);
      return;
    }
    fetch('/api/source-images/my', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSavedSourceImages(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Lỗi tải tủ ảnh đã lưu:', err));
  }, [isAuthenticated, token]);

  // Danh sách ảnh trong Gallery của trang phục được chọn: ảnh nguồn truyền từ Advisor
  // (nếu có) + ảnh đã lưu khớp trang phục này + ảnh phục dựng gốc trong catalog.
  const costumeGallery = React.useMemo(() => {
    const base = (selectedCostume?.gallery && selectedCostume.gallery.length > 0)
      ? selectedCostume.gallery
      : [selectedCostume?.cover_image].filter(Boolean);
    const savedForCostume = savedSourceImages
      .filter((img) => img.costume_id === selectedCostume?.id)
      .map((img) => img.image_data);
    const combined = [incomingSourceImage, ...savedForCostume, ...base].filter(Boolean);
    return [...new Set(combined)];
  }, [selectedCostume, savedSourceImages, incomingSourceImage]);

  // Khi thay đổi ảnh user, reset output (phải bấm Tạo Ảnh mới render lại)
  useEffect(() => {
    setHasGeneratedOnce(false);
    setIsGenerating(false);
  }, [userPhoto]);

  // Tải danh sách trang phục và đồng bộ theo Query Param hoặc Draft
  useEffect(() => {
    fetch('/api/heritage/costumes')
      .then((res) => res.json())
      .then((data) => {
        if (data.costumes && data.costumes.length > 0) {
          setCostumes(data.costumes);
          let target = null;
          if (costumeQueryId) {
            target = data.costumes.find((c) => c.id === costumeQueryId);
          }
          if (!target && initialDraft?.costumeId) {
            target = data.costumes.find((c) => c.id === initialDraft.costumeId);
          }
          if (!target && initialCostume) {
            target = data.costumes.find((c) => c.id === initialCostume.id) || initialCostume;
          }
          if (!target) {
            target = data.costumes[0];
          }
          setSelectedCostume(target);

          // Khôi phục ảnh gallery nền — ưu tiên ảnh nguồn truyền từ Advisor (nếu có)
          const gallery = (target?.gallery && target.gallery.length > 0)
            ? target.gallery
            : [target?.cover_image].filter(Boolean);
          if (incomingSourceImage) {
            setSelectedCostumeImage(incomingSourceImage);
          } else if (initialDraft?.selectedCostumeImage && gallery.includes(initialDraft.selectedCostumeImage)) {
            setSelectedCostumeImage(initialDraft.selectedCostumeImage);
          } else if (gallery.length > 0) {
            setSelectedCostumeImage(gallery[0]);
          }

          setHasHydratedDraft(true);
        }
      })
      .catch((err) => console.error('Error fetching costumes:', err));
  }, [costumeQueryId]);

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

  // Tự động lưu bản nháp vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    if (!hasHydratedDraft || !selectedCostume) return;
    const draftData = {
      costumeId: selectedCostume.id,
      selectedCostumeImage: selectedCostumeImage,
      selectedColor: selectedColor,
      selectedAccessories: selectedAccessories,
      activeAccTab: activeAccTab,
      mixPrompt: mixPrompt,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } catch (err) {
      // quota or private browsing mode
    }
  }, [hasHydratedDraft, selectedCostume?.id, selectedCostumeImage, selectedColor, selectedAccessories, activeAccTab, mixPrompt]);

  // Phân loại phụ kiện theo triều đại
  const matchedAccessories = React.useMemo(() => {
    const allowed = getDynastyForCostume(selectedCostume);
    if (!allowed) return allAccessories;
    const filtered = allAccessories.filter((acc) => allowed.includes(acc.dynasty_code) || acc.dynasty_code === 'ALL');
    return filtered.length > 0 ? filtered : allAccessories;
  }, [selectedCostume, allAccessories]);

  // Xử lý đổi trang phục từ danh sách thanh ngang
  const handleSelectCostume = (costume) => {
    if (costume.id === selectedCostume?.id) return;
    setSelectedCostume(costume);
    const gallery = (costume.gallery && costume.gallery.length > 0)
      ? costume.gallery
      : [costume.cover_image].filter(Boolean);
    setSelectedCostumeImage(gallery[0] || null);

    // Gợi ý 1 món mũ nón mặc định hợp triều đại mới
    const allowed = getDynastyForCostume(costume);
    const dynastyAcc = allAccessories.filter((a) => !allowed || allowed.includes(a.dynasty_code) || a.dynasty_code === 'ALL');
    const defHead = dynastyAcc.find((a) => a.category === 'headwear');
    setSelectedAccessories(defHead ? { [defHead.category]: defHead } : {});

    setHasGeneratedOnce(false);
    setIsGenerating(false);
    setActiveProposalIndex(0);
    setGuardrail(null);

    // Cập nhật URL Query Param
    setSearchParams({ costume: costume.id }, { replace: true });
  };

  // Đặt lại bản phối (Clear Draft)
  const handleResetDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {}
    setSelectedAccessories({});
    setMixPrompt('');
    setSelectedColor(COLOR_SWATCHES[0]);
    if (costumes.length > 0) {
      const first = costumes[0];
      setSelectedCostume(first);
      const gallery = (first.gallery && first.gallery.length > 0)
        ? first.gallery
        : [first.cover_image].filter(Boolean);
      setSelectedCostumeImage(gallery[0] || null);
      setSearchParams({ costume: first.id }, { replace: true });
    }
    setHasGeneratedOnce(false);
    setIsGenerating(false);
    setActiveProposalIndex(0);
    setGuardrail(null);
  };

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

  // Danh sách các phụ kiện hiện đang được pick (tối đa 3 món: 1 Mũ/Nón, 1 Kiểu Tóc, 1 Trang Sức)
  const selectedAccList = Object.values(selectedAccessories);

  // Tải ảnh về máy người dùng
  const handleDownloadImage = (url) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    const costumeSlug = (selectedCostume?.name || 'VietPhucRemix').replace(/\s+/g, '_');
    link.download = `VietPhucRemix_${costumeSlug}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Xử lý submit prompt tạo phối đồ AI với tiến trình trực quan
  const handlePromptSubmit = async (e, promptOverride = null) => {
    e?.preventDefault();

    // 1. Kiểm tra đăng nhập (chỉ người dùng có tài khoản mới được tạo ảnh và lưu lookbook)
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    const currentPrompt = (promptOverride !== null ? promptOverride : mixPrompt).trim() || 'Phối trang phục cổ phục cùng phong cách hiện đại';
    if (!mixPrompt.trim() || promptOverride !== null) {
      setMixPrompt(currentPrompt);
    }

    setIsGenerating(true);
    setSaveSuccessMsg('');
    setGuardrail(null);
    setLoadingProgressPercent(15);
    setLoadingStageText(`1. Đang khảo sát phom dáng ${selectedCostume?.name || 'cổ phục'}...`);

    try {
      // Gọi API bảo mật trên backend để xây dựng prompt template và lấy các bước tiến trình
      const res = await fetch('/api/heritage/remix-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costume_id: selectedCostume?.id || 'ao-nhat-binh',
          selected_image_url: activeCostumeMixImage,
          color: selectedColor,
          accessories: selectedAccList.map((a) => ({ id: a.id, name: a.name, category: a.category })),
          user_prompt: currentPrompt,
          has_user_photo: !!userPhoto
        })
      });

      if (!res.ok) throw new Error('remix_generate_failed');
      const data = await res.json();
      setGuardrail(data.guardrail || null);

      // Kiểm định văn hóa chặn tạo ảnh: dừng lại, chỉ hiển thị ghi chú giám tuyển
      if (data.guardrail?.verdict === 'BLOCK') {
        setIsGenerating(false);
        return;
      }

      const steps = data.stage_steps || [
        `1. Đang phân tích phom dáng ${selectedCostume?.name || 'cổ phục'}...`,
        '2. Cố định quy chuẩn vạt hữu & dựng phom vạt áo...',
        `3. Nhuộm sắc độ ${selectedColor.name} & kết nối phụ kiện...`,
        '4. Áp dụng phong cách thời trang đương đại...',
        '5. Tinh chỉnh ánh sáng studio & kết xuất 2 bản phối chuẩn 8K...'
      ];

      // Diễn hoạt các bước tiến trình tạo ảnh trực quan (2.6s)
      const stepDurations = [350, 850, 1450, 2050, 2600];
      const percents = [25, 45, 68, 88, 100];

      stepDurations.forEach((delay, idx) => {
        setTimeout(() => {
          if (steps[idx]) setLoadingStageText(steps[idx]);
          setLoadingProgressPercent(percents[idx]);
        }, delay);
      });

      setTimeout(() => {
        const finalOutputs = data.output_images && data.output_images.length > 0 ? data.output_images : getAiOutputs();
        setGeneratedResults(finalOutputs);
        setIsGenerating(false);
        setHasGeneratedOnce(true);

        const chosenImage = finalOutputs[activeProposalIndex] || finalOutputs[0];
        if (token) {
          fetch('/api/lookbooks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              costume_id: selectedCostume?.id || 'heritage-mix',
              costume_name: selectedCostume?.name || 'Cổ Phục Remix',
              accessories_json: JSON.stringify(
                selectedAccList.map((a) => ({ id: a.id, name: a.name, category: a.category }))
              ),
              prompt: currentPrompt,
              result_image_url: chosenImage,
              user_photo_url: userPhoto || null
            })
          })
            .then((res) => {
              if (res.ok) {
                setSaveSuccessMsg('Đã tự động lưu bản phối vào Tủ đồ cá nhân của bạn!');
                setTimeout(() => setSaveSuccessMsg(''), 4500);
              }
            })
            .catch((err) => console.error('Lỗi lưu lookbook:', err));
        }
      }, 3000);
    } catch (err) {
      console.error('Lỗi tạo ảnh phối đồ:', err);
      setIsGenerating(false);
    }
  };

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
  const aiOutputImages = generatedResults || getAiOutputs();

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
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <span className="bar-label">TRANG PHỤC NỀN:</span>
          <span className="costume-count-badge">({costumes.length} mẫu di sản)</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => navigate('/advisor')}
              className="advisor-trigger-btn"
            >
              Gợi ý theo bối cảnh
            </button>
            <button
              type="button"
              onClick={handleResetDraft}
              className="btn-back-link"
              style={{ background: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              title="Xóa dữ liệu nháp đang phối và làm mới"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </div>

        {/* Danh sách trang phục nền đầy đủ cả 16 mẫu */}
        <div className="costume-pill-list">
          {costumes.map((c) => {
            const isSelected = selectedCostume?.id === c.id;
            return (
              <button
                key={c.id}
                className={`costume-pill ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectCostume(c)}
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
                      title="Đổi ảnh"
                    >
                      <i className="fa-solid fa-arrows-rotate"></i>
                    </button>
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => setUserPhoto(null)}
                      title="Xóa ảnh"
                    >
                      <i className="fa-solid fa-trash-can"></i>
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
              <span className="indicator-label" title="Phối đồ di sản">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </span>
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
                placeholder="Mô tả chỉnh sửa"
              />

              <div className="model-badge">GEMINI</div>

              <button
                type="submit"
                className="prompt-submit-btn"
                disabled={isGenerating}
                title="Tạo ảnh"
              >
                {isGenerating ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                )}
              </button>
            </form>

            {saveSuccessMsg && (
              <div className="save-lookbook-toast">
                <span className="toast-dot">●</span>
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <CuratorGuardrailNote guardrail={guardrail} />
          </div>

          {/* KHỐI 3: ĐÚNG 2 Ô OUTPUT (CHỈ XUẤT HIỆN KHI SUBMIT, TRỌN VẸN PHOM DÁNG KHÔNG MẤT GÓC, BẤM VÀO ĐỂ PHÓNG TO & CHỈNH SỬA) */}
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
                        if (hasGeneratedOnce && !isGenerating) {
                          setActiveProposalIndex(idx);
                          setZoomedImage(imgUrl);
                        }
                      }}
                      title={hasGeneratedOnce ? 'Bấm để xem phóng to, tải về hoặc chỉnh sửa' : ''}
                    >
                      {isGenerating ? (
                        /* HIỆU ỨNG LOADING MỜ MỜ NHƯ WATER KIỂU NANO BANANA CỦA GEMINI CÙNG TIẾN TRÌNH TẠO ẢNH */
                        <div className="nano-water-loader">
                          <div className="water-wave-layer" />
                          <div className="water-wave-layer secondary" />
                          <div className="water-shimmer-glow" />

                          <div className="nano-loader-progress-box">
                            <div className="loader-badge-tag">
                              <span className="loader-pulse-dot" />
                              <span>Tiến trình AI Phối Đồ</span>
                            </div>
                            <div className="loader-step-text">
                              {loadingStageText}
                            </div>
                            <div className="loader-progress-track">
                              <div
                                className="loader-progress-fill"
                                style={{ width: `${loadingProgressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* CHỈ HIỂN THỊ ẢNH THUẦN TÚY TRỌN VẸN, KHÔNG BỊ CẮT XÉN GÓC ẢNH */
                        <div className="nano-pure-img-wrapper">
                          <img src={imgUrl} alt="Bản phối Việt Phục Remix" />
                          <div className="nano-card-hover-hint" title="Xem chi tiết &amp; chỉnh sửa">
                            <i className="fa-solid fa-expand"></i>
                          </div>
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

      {/* FLOATING CARD MODAL: PHÓNG TO / TẢI VỀ / CHỈNH SỬA THÊM */}
      {zoomedImage && (
        <div className="floating-preview-backdrop" onClick={() => setZoomedImage(null)}>
          <div className="floating-preview-card" onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="floating-preview-header">
              <div>
                <h3 className="floating-preview-title">{selectedCostume?.name || 'Bản Phối Cổ Phục Remix'}</h3>
                <div className="floating-preview-meta">
                  Sắc độ: {selectedColor?.name} • {selectedAccList.length} món phụ kiện phối kèm
                </div>
              </div>
              <button
                type="button"
                className="floating-preview-close-btn"
                onClick={() => setZoomedImage(null)}
                title="Đóng cửa sổ"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Ảnh Full View Trọn Vẹn Không Bị Cắt Xén */}
            <div className="floating-preview-body">
              <div className="floating-preview-img-box">
                <img src={zoomedImage} alt={selectedCostume?.name || 'Việt Phục Remix'} />
              </div>
            </div>

            {/* Footer Toolbar: Tải về + Gõ thêm mô tả chỉnh sửa */}
            <div className="floating-preview-footer">
              <div className="floating-actions-row">
                <button
                  type="button"
                  className="floating-download-btn"
                  onClick={() => handleDownloadImage(zoomedImage)}
                  title="Tải ảnh về máy"
                >
                  <i className="fa-solid fa-download"></i>
                </button>

                <form
                  className="floating-refine-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!refinePrompt.trim()) return;
                    const updatedPrompt = `${mixPrompt ? mixPrompt + ' • ' : ''}Chỉnh sửa thêm: ${refinePrompt.trim()}`;
                    setZoomedImage(null);
                    setRefinePrompt('');
                    handlePromptSubmit(null, updatedPrompt);
                  }}
                >
                  <input
                    type="text"
                    className="floating-refine-input"
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder="Mô tả chỉnh sửa"
                  />
                  <button
                    type="submit"
                    className="floating-refine-btn"
                    disabled={!refinePrompt.trim()}
                    title="Tạo lại với chỉnh sửa"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
