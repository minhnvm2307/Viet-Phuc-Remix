import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  Images, 
  ShieldCheck, 
  ArrowLeft
} from 'lucide-react';

export default function CuratorModal({ costume, onClose, onSelectForStudio }) {
  if (!costume) return null;

  // Gallery hình ảnh trang phục
  const costumeImages = [
    costume.remix_image ? { src: costume.remix_image, label: 'Bản Phối Hiện Đại (Remix Editorial)' } : null,
    costume.cover_image ? { src: costume.cover_image, label: 'Hiện Vật & Phục Dựng Lịch Sử' } : null,
    ...(costume.gallery || []).map((img, idx) => ({
      src: img,
      label: `Góc Nhìn Khảo Cứu #${idx + 1}`
    })),
    costume.cutout_image ? { src: costume.cutout_image, label: 'Bản Tách Nền Studio' } : null
  ].filter(Boolean);

  const [activeCostumeImgIdx, setActiveCostumeImgIdx] = useState(0);
  const [activeView, setActiveView] = useState('costume'); // 'costume' | 'accessory'
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [activeAlbumId, setActiveAlbumId] = useState('all');
  const [accessories, setAccessories] = useState([]);

  // Xác định mã triều đại tương ứng với trang phục
  const getDynastyCodesForCostume = (c) => {
    const cid = (c.id || '').toLowerCase();
    const eraCode = (c.era_code || '').toUpperCase();
    const eraOrigin = (c.era_origin || '').toLowerCase();

    if (cid.includes('nguyen') || cid.includes('nhat-binh') || cid.includes('ao-tac') || eraCode.includes('NGUYEN') || eraOrigin.includes('nguyễn')) {
      return ['NGUYEN_DYNASTY'];
    }
    if (cid.includes('tran') || eraOrigin.includes('trần') || cid.includes('ly') || eraOrigin.includes('lý')) {
      return ['LY_TRAN'];
    }
    if (cid.includes('le') || eraOrigin.includes('lê')) {
      return ['LE_MAC', 'LY_TRAN'];
    }
    if (cid.includes('tu-than') || eraCode.includes('DAN_GIAN') || eraOrigin.includes('dân gian')) {
      return ['DAN_GIAN'];
    }
    return ['NGUYEN_DYNASTY', 'DAN_GIAN', 'LY_TRAN', 'LE_MAC'];
  };

  const dynastyCodes = getDynastyCodesForCostume(costume);

  // Tải danh mục phụ kiện từ API
  useEffect(() => {
    fetch('/api/heritage/accessories')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          const matched = data.items.filter((item) => 
            dynastyCodes.includes(item.dynasty_code)
          );
          setAccessories(matched);
        }
      })
      .catch((err) => console.error('Error fetching accessories for modal:', err));
  }, [costume.id]);

  // Nhóm phụ kiện thành các album mini: Mũ & Nón, Kiểu Tóc, Trang Sức, Hài & Guốc
  const accessoryAlbums = [
    {
      id: 'headwear',
      title: 'Mũ & Nón',
      icon: '👑',
      items: accessories.filter((a) => a.category === 'headwear')
    },
    {
      id: 'hairstyles',
      title: 'Kiểu Tóc',
      icon: '💇‍♀️',
      items: accessories.filter((a) => a.category === 'hairstyles')
    },
    {
      id: 'jewelry',
      title: 'Trang Sức',
      icon: '💎',
      items: accessories.filter((a) => a.category === 'jewelry')
    },
    {
      id: 'footwear',
      title: 'Hài & Guốc',
      icon: '🥿',
      items: accessories.filter((a) => a.category === 'footwear')
    }
  ].filter((album) => album.items.length > 0);

  // Ảnh đang hiển thị ở khung to bên trái
  const currentHero = activeView === 'accessory' && selectedAccessory
    ? { src: selectedAccessory.image, label: `${selectedAccessory.category_name}: ${selectedAccessory.name}` }
    : (costumeImages[activeCostumeImgIdx] || costumeImages[0] || { src: costume.cover_image, label: costume.name });

  const currentAlbum = accessoryAlbums.find((a) => a.id === activeAlbumId);
  const currentAlbumItems = currentAlbum ? currentAlbum.items : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(24, 23, 22, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid var(--border-line)',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng tối giản */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: 'var(--text-muted)',
            transition: 'color 0.2s'
          }}
          title="Đóng"
        >
          <X size={18} />
        </button>

        {/* Nội dung 2 cột theo phong cách Editorial Minimalist */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 420px) 1fr', minHeight: '620px' }}>
          
          {/* CỘT TRÁI: KHU VỰC DUY NHẤT HIỂN THỊ HÌNH ẢNH */}
          <div
            style={{
              backgroundColor: '#FAF8F5',
              borderRight: '1px solid var(--border-line)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Header khu vực ảnh */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Images size={14} color="var(--dynasty-color)" />
                  <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dynasty-color)' }}>
                    Thư Viện Ảnh & Khảo Cứu
                  </span>
                </div>
                {activeView === 'accessory' && (
                  <button
                    onClick={() => {
                      setActiveView('costume');
                      setSelectedAccessory(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <ArrowLeft size={11} />
                    <span>Xem lại áo</span>
                  </button>
                )}
              </div>

              {/* Khung ảnh chính duy nhất */}
              <div
                style={{
                  height: '380px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <img
                  src={currentHero.src}
                  alt={currentHero.label}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transition: 'all 0.25s ease'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '8px 12px',
                    background: 'rgba(20, 19, 18, 0.72)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  {currentHero.label}
                </div>
              </div>

              {/* Dải ảnh thumbnail & album mini phụ kiện để cùng list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Danh sách ảnh trang phục */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Ảnh Trang Phục
                  </div>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {costumeImages.map((img, idx) => {
                      const isSelected = activeView === 'costume' && activeCostumeImgIdx === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveView('costume');
                            setSelectedAccessory(null);
                            setActiveCostumeImgIdx(idx);
                          }}
                          style={{
                            flex: '0 0 54px',
                            height: '54px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: isSelected ? '2px solid var(--dynasty-color)' : '1px solid var(--border-line)',
                            padding: 0,
                            cursor: 'pointer',
                            background: '#FFFFFF',
                            opacity: isSelected ? 1 : 0.65,
                            transition: 'all 0.15s'
                          }}
                          title={img.label}
                        >
                          <img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Các ô mini riêng dạng album cho phụ kiện (Mũ, Giày, Kiểu tóc, Trang sức) */}
                {accessoryAlbums.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Album Phụ Kiện Triều Đại
                    </div>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {accessoryAlbums.map((album) => {
                        const isAlbumActive = activeView === 'accessory' && activeAlbumId === album.id;
                        const previewItem = album.items[0];
                        return (
                          <button
                            key={album.id}
                            onClick={() => {
                              setActiveView('accessory');
                              setActiveAlbumId(album.id);
                              setSelectedAccessory(album.items[0]);
                            }}
                            style={{
                              flex: '0 0 68px',
                              height: '68px',
                              borderRadius: '8px',
                              border: isAlbumActive ? '2px solid var(--dynasty-color)' : '1px solid var(--border-line)',
                              background: '#FFFFFF',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isAlbumActive ? 1 : 0.7,
                              transition: 'all 0.15s'
                            }}
                            title={`Album ${album.title} (${album.items.length})`}
                          >
                            <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              <img
                                src={previewItem.image}
                                alt={album.title}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <span style={{ fontSize: '9.5px', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                              {album.title}
                            </span>
                            <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                              ({album.items.length})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Nếu đang xem 1 album phụ kiện, hiện các mini pic của album đó để bấm đổi nhanh */}
                {activeView === 'accessory' && currentAlbumItems.length > 1 && (
                  <div style={{ marginTop: '2px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Mẫu trong {currentAlbum?.title}:
                    </div>
                    <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
                      {currentAlbumItems.map((item) => {
                        const isSelected = selectedAccessory?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedAccessory(item)}
                            style={{
                              flex: '0 0 46px',
                              height: '46px',
                              borderRadius: '6px',
                              border: isSelected ? '2px solid var(--dynasty-color)' : '1px solid var(--border-line)',
                              padding: '2px',
                              background: '#FFFFFF',
                              cursor: 'pointer',
                              opacity: isSelected ? 1 : 0.6
                            }}
                            title={item.name}
                          >
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nút hành động duy nhất: Sang Studio phối đồ (Cấm thêm nút ướm thử vào đây) */}
            <div style={{ marginTop: '20px' }}>
              <button
                className="btn-editorial-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                onClick={() => {
                  onClose();
                  onSelectForStudio(costume, selectedAccessory);
                }}
              >
                <span>Phối Đồ Trên Studio</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: MÔ TẢ NỘI DUNG (HOÁN ĐỔI GIỮA TRANG PHỤC VÀ PHỤ KIỆN) */}
          <div style={{ padding: '32px 36px', overflowY: 'auto' }}>
            
            {/* TRƯỜNG HỢP 1: HIỂN THỊ MÔ TẢ TRANG PHỤC */}
            {activeView === 'costume' && (
              <div>
                <div style={{ marginBottom: '22px' }}>
                  <div className="costume-dynasty-badge" style={{ marginBottom: '6px' }}>
                    <span>{costume.era_origin}</span>
                    <span className="badge-separator">•</span>
                    <span>{costume.region || 'Đại Việt'}</span>
                  </div>

                  <h2 className="costume-title-dominant" style={{ fontSize: '30px', marginBottom: '10px' }}>
                    {costume.name}
                  </h2>

                  <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.7', margin: 0 }}>
                    {costume.significance}
                  </p>
                </div>

                <div className="occasion-context-bar" style={{ marginBottom: '22px' }}>
                  <span className="occasion-context-label">Bối Cảnh:</span>
                  <span className="occasion-context-value">
                    {costume.occasion_usage || 'Điển lễ cung đình, nghi thức đại triều và giao tế bang giao.'}
                  </span>
                </div>

                {/* Quy chuẩn may & cấu trúc */}
                <div style={{ marginBottom: '22px', background: '#FAF8F5', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-line)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', color: 'var(--text-main)' }}>
                    Quy Chuẩn Cổ Phục
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Cổ áo: </span>
                      <strong>{costume.collar_type || 'Cổ truyền thống'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Tay áo: </span>
                      <strong>{costume.sleeve_type || 'Tay thụng'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Cấu trúc: </span>
                      <strong>{costume.panel_count ? `${costume.panel_count} thân` : 'Chuẩn quy cách'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Chất liệu: </span>
                      <strong>{costume.standard_materials || 'Lụa tơ tằm, Sa, Gấm'}</strong>
                    </div>
                  </div>
                </div>

                {/* Ghi chú quy tắc di sản */}
                {costume.cultural_guardrails?.curator_note && (
                  <div style={{ padding: '14px 16px', background: '#F8F5F0', borderLeft: '3px solid var(--dynasty-color)', borderRadius: '0 6px 6px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '11px', color: 'var(--dynasty-color)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      <ShieldCheck size={14} />
                      <span>Quy Tắc Di Sản Cần Tuân Thủ</span>
                    </div>
                    <p style={{ fontSize: '13px', fontStyle: 'italic', margin: 0, lineHeight: '1.6', color: 'var(--text-main)' }}>
                      {costume.cultural_guardrails.curator_note}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TRƯỜNG HỢP 2: HIỂN THỊ MÔ TẢ PHỤ KIỆN (KHI USER BẤM VÀO MINI PIC/ALBUM PHỤ KIỆN) */}
            {activeView === 'accessory' && selectedAccessory && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className="costume-dynasty-badge">
                    <span>{selectedAccessory.dynasty_name}</span>
                    <span className="badge-separator">•</span>
                    <span>{selectedAccessory.category_name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveView('costume');
                      setSelectedAccessory(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '11.5px',
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    ← Trở lại trang phục
                  </button>
                </div>

                <h2 className="costume-title-dominant" style={{ fontSize: '28px', marginBottom: '8px' }}>
                  {selectedAccessory.name}
                </h2>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Niên đại khảo cứu: <strong>{selectedAccessory.era_period}</strong>
                </div>

                <p style={{ color: 'var(--text-main)', fontSize: '14.5px', lineHeight: '1.7', marginBottom: '22px' }}>
                  {selectedAccessory.description}
                </p>

                {/* Quy chuẩn lịch sử / guardrail của phụ kiện */}
                <div style={{
                  padding: '16px',
                  background: '#F8F5F0',
                  borderLeft: '3px solid var(--dynasty-color)',
                  borderRadius: '0 6px 6px 0',
                  marginBottom: '22px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '11px', color: 'var(--dynasty-color)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    <ShieldCheck size={14} />
                    <span>Quy Chuẩn Di Sản Lịch Sử</span>
                  </div>
                  <p style={{ fontSize: '13px', fontStyle: 'italic', margin: 0, lineHeight: '1.6', color: 'var(--text-main)' }}>
                    {selectedAccessory.cultural_guardrail}
                  </p>
                </div>

                {/* Danh sách các phụ kiện cùng loại trong triều đại này */}
                {currentAlbumItems.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Danh Sách Phụ Kiện Trong Album {currentAlbum?.title}:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {currentAlbumItems.map((item) => {
                        const isCurrent = selectedAccessory.id === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedAccessory(item)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: isCurrent ? '1px solid var(--dynasty-color)' : '1px solid var(--border-line)',
                              background: isCurrent ? 'var(--dynasty-color)' : '#FFFFFF',
                              color: isCurrent ? '#FFFFFF' : 'var(--text-main)',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
