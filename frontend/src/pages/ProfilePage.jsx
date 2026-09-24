import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage({ onNavigateToStudio, onNavigateToCatalog }) {
  const { user, token, logout } = useAuth();
  const [lookbooks, setLookbooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  const fetchLookbooks = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/lookbooks/my-lookbooks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLookbooks(data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách lookbook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLookbooks();
  }, [token]);

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản phối này khỏi Lookbook?')) return;

    try {
      const res = await fetch(`/api/lookbooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLookbooks((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert('Không thể xóa bản phối lúc này');
      }
    } catch (err) {
      console.error('Lỗi xóa lookbook:', err);
    }
  };

  const handleDownload = (imageUrl, costumeName, e) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `VietPhucRemix_${costumeName.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="profile-page-container">
      {/* 1. KHỐI THÔNG TIN TÀI KHOẢN (USER HERO CARD) */}
      <div className="profile-hero-card">
        <div className="profile-avatar-seal">
          <span>{user?.full_name ? user.full_name[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'V'}</span>
        </div>

        <div className="profile-user-info">
          <div className="profile-badge-row">
            <span className="profile-role-badge">NHÀ SÁNG TẠO DI SẢN</span>
            <span className="profile-join-date">
              Tham gia: {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Mới'}
            </span>
          </div>

          <h1 className="profile-name">
            {user?.full_name || user?.username}
          </h1>
          <p className="profile-email">{user?.email}</p>
        </div>

        <div className="profile-actions-box">
          <button
            type="button"
            className="profile-btn-logout"
            onClick={logout}
            title="Đăng xuất tài khoản"
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </div>

      {/* 2. THANH TIÊU ĐỀ BỘ SƯU TẬP LOOKBOOK */}
      <div className="profile-gallery-header">
        <div className="gallery-title-box">
          <span className="gallery-indicator-dot">●</span>
          <h2 className="gallery-title">Tủ Đồ Di Sản Của Bạn (My Lookbooks)</h2>
          <span className="gallery-count-pill">{lookbooks.length} bản phối</span>
        </div>

        <button
          type="button"
          className="btn-create-mix"
          onClick={onNavigateToStudio}
        >
          + PHỐI ĐỒ MỚI
        </button>
      </div>

      {/* 3. LƯỚI DANH SÁCH LOOKBOOK */}
      {isLoading ? (
        <div className="profile-loading-box">
          <div className="profile-shimmer-pulse" />
          <span>Đang tải bộ sưu tập của bạn...</span>
        </div>
      ) : lookbooks.length === 0 ? (
        <div className="profile-empty-state">
          <div className="empty-state-seal">VP</div>
          <h3>Chưa Có Bản Phối Nào Trong Tủ Đồ</h3>
          <p>
            Bạn chưa lưu bản phối nào. Hãy vào Studio phối đồ để tự tay sáng tạo diện mạo thời trang di sản độc bản của riêng mình.
          </p>
          <div className="empty-state-actions">
            <button
              type="button"
              className="landing-btn-primary"
              onClick={onNavigateToStudio}
            >
              VÀO MIX STUDIO NGAY
            </button>
            <button
              type="button"
              className="landing-btn-outline"
              onClick={onNavigateToCatalog}
            >
              XEM DANH MỤC DI SẢN
            </button>
          </div>
        </div>
      ) : (
        <div className="lookbook-grid">
          {lookbooks.map((item) => {
            let accessories = [];
            try {
              accessories = JSON.parse(item.accessories_json || '[]');
            } catch (e) {
              accessories = [];
            }

            return (
              <div
                key={item.id}
                className="lookbook-card"
                onClick={() => setSelectedImageModal(item)}
              >
                <div className="lookbook-img-frame">
                  <img src={item.result_image_url} alt={item.costume_name} />
                  <div className="lookbook-hover-actions">
                    <button
                      type="button"
                      className="btn-card-action download"
                      onClick={(e) => handleDownload(item.result_image_url, item.costume_name, e)}
                      title="Tải ảnh về máy"
                    >
                      TẢI ẢNH
                    </button>
                    <button
                      type="button"
                      className="btn-card-action delete"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Xóa khỏi bộ sưu tập"
                    >
                      XÓA
                    </button>
                  </div>
                </div>

                <div className="lookbook-details">
                  <div className="lookbook-meta-top">
                    <span className="lookbook-costume-tag">TRANG PHỤC NỀN</span>
                    <span className="lookbook-date">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="lookbook-costume-name">{item.costume_name}</h3>

                  {accessories.length > 0 && (
                    <div className="lookbook-accessories-row">
                      {accessories.map((acc, aIdx) => (
                        <span key={aIdx} className="acc-mini-chip">
                          {acc.name || acc}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.prompt && (
                    <p className="lookbook-prompt-text" title={item.prompt}>
                      "{item.prompt}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP PHÓNG TO ẢNH LOOKBOOK */}
      {selectedImageModal && (
        <div
          className="lookbook-modal-backdrop"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="lookbook-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lookbook-modal-close"
              onClick={() => setSelectedImageModal(null)}
            >
              ✕
            </button>
            <div className="lookbook-modal-img-wrap">
              <img
                src={selectedImageModal.result_image_url}
                alt={selectedImageModal.costume_name}
              />
            </div>
            <div className="lookbook-modal-sidebar">
              <span className="lookbook-costume-tag">CHI TIẾT BẢN PHỐI DI SẢN</span>
              <h2 className="modal-sidebar-title">{selectedImageModal.costume_name}</h2>
              <p className="modal-sidebar-date">
                Tạo ngày {new Date(selectedImageModal.created_at).toLocaleString('vi-VN')}
              </p>

              {selectedImageModal.prompt && (
                <div className="modal-sidebar-section">
                  <label>Ý tưởng phối đồ:</label>
                  <p>"{selectedImageModal.prompt}"</p>
                </div>
              )}

              <div className="modal-sidebar-actions">
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={(e) =>
                    handleDownload(
                      selectedImageModal.result_image_url,
                      selectedImageModal.costume_name,
                      e
                    )
                  }
                >
                  TẢI ẢNH VỀ MÁY
                </button>
                <button
                  type="button"
                  className="btn-modal-delete"
                  onClick={(e) => {
                    handleDelete(selectedImageModal.id, e);
                    setSelectedImageModal(null);
                  }}
                >
                  XÓA BẢN PHỐI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
