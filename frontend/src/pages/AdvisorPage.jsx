import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Trang "Gợi Ý Phối Đồ" — port 1:1 từ docs/advisor-2a.html + docs/advisor-2b.html
// (Claude Design). 1 form duy nhất gộp Dịp + Cảm Hứng. Không icon.

const OCCASION_OPTIONS = ['Đi học', 'Dạo phố', 'Dạ tiệc', 'Lễ hội', 'Cưới hỏi', 'Chụp lookbook'];
const WEATHER_OPTIONS = ['Nóng', 'Mát', 'Lạnh', 'Mưa'];
const VIBE_OPTIONS = ['Thanh lịch', 'Cá tính', 'Mộc mạc', 'Sang trọng', 'Phá cách'];

const PLACEHOLDER_QUOTE =
  'Hãy cho tôi biết dịp bạn sẽ mặc. Nếu có một khoảnh khắc bạn thích, gửi kèm — tôi sẽ tìm bộ cổ phục cùng tinh thần.';

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div className="advisor-chip-group">
      <span className="advisor-group-label">{label}</span>
      <div className="advisor-chip-row">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`advisor-chip ${value === opt ? 'active' : ''}`}
            onClick={() => onChange(value === opt ? null : opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdvisorPage({ onRequireAuth }) {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [occasion, setOccasion] = useState(null);
  const [weather, setWeather] = useState(null);
  const [vibe, setVibe] = useState(null);
  const [freeText, setFreeText] = useState('');
  const [trendUrl, setTrendUrl] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
  const [showUploadFallback, setShowUploadFallback] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error

  const hasAnyInput = Boolean(occasion || weather || vibe || freeText.trim() || trendUrl.trim() || uploadFile);

  const filterSummaryParts = [occasion, weather, vibe].filter(Boolean);
  const extraInspirationCount = (trendUrl.trim() || uploadFile) ? 1 : 0;

  const handleRemoveLink = () => setTrendUrl('');

  const handleUploadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploadFile(file);
    setUploadPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasAnyInput) return;
    setIsLoading(true);
    setErrorMsg('');
    setResult(null);
    setSaveState('idle');

    const formData = new FormData();
    if (occasion) formData.append('occasion', occasion);
    if (weather) formData.append('weather', weather);
    if (vibe) formData.append('vibe', vibe);
    if (freeText.trim()) formData.append('free_text', freeText.trim());
    if (uploadFile) {
      formData.append('screenshot', uploadFile);
    } else if (trendUrl.trim()) {
      formData.append('source_url', trendUrl.trim());
    }

    try {
      const res = await fetch('/api/heritage/advisor', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('request_failed');
      const data = await res.json();

      if (data.status === 'ok') {
        setResult(data);
        setShowUploadFallback(false);
      } else if (data.status === 'failed' && !uploadFile) {
        setErrorMsg(
          data.reason === 'invalid_file_type' || data.reason === 'file_too_large'
            ? 'Ảnh không hợp lệ, vui lòng thử ảnh khác.'
            : 'Bài đăng này ở chế độ riêng tư hoặc không hỗ trợ — gửi ảnh chụp màn hình thay thế.'
        );
        setShowUploadFallback(true);
      } else if (data.status === 'failed') {
        setErrorMsg('Ảnh không hợp lệ, vui lòng thử ảnh khác.');
      } else {
        setErrorMsg('Chưa phân tích được lúc này, vui lòng thử lại.');
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối đến máy chủ, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseInStudio = (costumeId, sourceImageDataUrl) => {
    navigate(`/studio?costume=${costumeId}`, { state: { sourceImageDataUrl } });
  };

  const handleSaveToGallery = async () => {
    if (!result?.source_image_data_url) return;
    if (!isAuthenticated) {
      onRequireAuth?.('/advisor');
      return;
    }
    setSaveState('saving');
    try {
      const res = await fetch('/api/source-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          image_data: result.source_image_data_url,
          costume_id: result.primary.costume_id,
          costume_name: result.primary.name
        })
      });
      if (!res.ok) throw new Error('save_failed');
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
    }
  };

  const resultsHeaderLabel = result
    ? `PHIẾU GỢI Ý · ${[...filterSummaryParts, extraInspirationCount ? `+ ${extraInspirationCount} CẢM HỨNG` : null].filter(Boolean).join(' · ').toUpperCase()}`
    : 'PHIẾU GỢI Ý · CHƯA CÓ';
  const resultsCountLabel = result ? `${1 + result.secondary.length} bộ` : 'Điền ít nhất một mục';

  return (
    <div className="advisor-page-container">
      <div className="advisor-studio-layout">
        {/* CỘT TRÁI: FORM NHẬP */}
        <aside className="advisor-sidebar">
          <div className="advisor-sidebar-kicker-wrap">
            <span className="advisor-kicker-badge">GIÁM TUYỂN THỜI TRANG SỐ</span>
            <h1 className="advisor-sidebar-title">Gợi Ý<br />Phối Đồ</h1>
            <p className="advisor-sidebar-subtitle">
              Cho biết dịp mặc, thêm một cảm hứng nếu có — nhận 1–3 bộ cổ phục đã chọn sẵn.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="advisor-form-section">
              <div className="advisor-section-header">
                <span className="advisor-section-roman">I.</span>
                <span className="advisor-section-title">Dịp</span>
                <span className="advisor-section-hint">Bạn mặc khi nào</span>
              </div>

              <ChipGroup label="SỰ KIỆN" options={OCCASION_OPTIONS} value={occasion} onChange={setOccasion} />
              <ChipGroup label="THỜI TIẾT" options={WEATHER_OPTIONS} value={weather} onChange={setWeather} />
              <ChipGroup label="PHONG CÁCH" options={VIBE_OPTIONS} value={vibe} onChange={setVibe} />

              <textarea
                className="advisor-textarea"
                rows={2}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Đi xem triển lãm ở Bảo tàng Mỹ thuật cuối tuần…"
              />
            </div>

            <div className="advisor-form-section">
              <div className="advisor-section-header">
                <span className="advisor-section-roman">II.</span>
                <span className="advisor-section-title">Cảm Hứng</span>
                <span className="advisor-section-hint">Không bắt buộc</span>
              </div>

              {!showUploadFallback && (
                <div className="advisor-freetext-group">
                  <span className="advisor-group-label">LINK TIKTOK / FACEBOOK</span>
                  {trendUrl ? (
                    <div className="advisor-link-preview">
                      <div className="advisor-link-preview-text">
                        <span className="advisor-link-preview-url">{trendUrl}</span>
                      </div>
                      <button type="button" className="advisor-link-remove-btn" onClick={handleRemoveLink}>
                        Gỡ
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="advisor-textarea"
                      value={trendUrl}
                      onChange={(e) => setTrendUrl(e.target.value)}
                      placeholder="Dán link video/bài viết bạn thấy đang trend"
                    />
                  )}
                  <button type="button" className="advisor-inline-link-btn" onClick={() => setShowUploadFallback(true)}>
                    Link riêng tư? <span>Tải ảnh chụp màn hình</span>
                  </button>
                </div>
              )}

              {showUploadFallback && (
                <div className="advisor-freetext-group">
                  {errorMsg && <div className="advisor-fb-private-warning">{errorMsg}</div>}
                  {uploadPreviewUrl ? (
                    <div className="advisor-trend-upload-preview">
                      <img src={uploadPreviewUrl} alt="Ảnh chụp màn hình đã chọn" />
                    </div>
                  ) : (
                    <div className="advisor-trend-upload-zone" onClick={() => document.getElementById('advisor-upload-input')?.click()}>
                      <div className="advisor-trend-upload-zone-text">
                        <span className="advisor-trend-upload-zone-title">Kéo ảnh vào đây</span>
                        <span className="advisor-trend-upload-zone-hint">JPG, PNG · tối đa 10MB</span>
                      </div>
                      <span className="advisor-choose-file-btn">Chọn ảnh</span>
                    </div>
                  )}
                  <input
                    id="advisor-upload-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadFile(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="advisor-inline-link-btn"
                    onClick={() => {
                      setShowUploadFallback(false);
                      setUploadFile(null);
                      setUploadPreviewUrl(null);
                      setErrorMsg('');
                    }}
                  >
                    <span>Dùng link thay thế</span>
                  </button>
                </div>
              )}
            </div>

            {errorMsg && !showUploadFallback && <div className="advisor-error-text">{errorMsg}</div>}

            <button type="submit" className="advisor-submit-btn-full" disabled={!hasAnyInput || isLoading}>
              {isLoading ? 'Đang tổng hợp' : 'Nhận gợi ý'}
            </button>
          </form>

          <div className="advisor-steps-indicator">
            <span className="active">01 Chọn</span>
            <span>—</span>
            <span className="active">02 Phân tích</span>
            <span>—</span>
            <span className="active">03 Phối đồ</span>
          </div>
        </aside>

        {/* CỘT PHẢI: KẾT QUẢ */}
        <section className="advisor-results-panel">
          <div className="advisor-results-header">
            <span>{resultsHeaderLabel}</span>
            <span className="advisor-results-count">{resultsCountLabel}</span>
          </div>

          <p className={`advisor-big-quote ${!result ? 'is-empty' : ''}`}>
            "{result ? result.curator_quote : PLACEHOLDER_QUOTE}"
          </p>

          {result && (
            <div className="advisor-primary-card">
              <div className="advisor-primary-card-header">
                <span>
                  {result.source_image_data_url
                    ? 'LỰA CHỌN HÀNG ĐẦU · TỪ CẢM HỨNG CỦA BẠN'
                    : 'LỰA CHỌN HÀNG ĐẦU · TỪ BỐI CẢNH'}
                </span>
                <span>{result.primary.era_origin}</span>
              </div>

              <div className={`advisor-primary-media ${result.source_image_data_url ? '' : 'no-source'}`}>
                {result.source_image_data_url && (
                  <div className="advisor-media-box">
                    <div className="advisor-media-frame">
                      <img src={result.source_image_data_url} alt="Ảnh cảm hứng" />
                    </div>
                    <span className="advisor-media-caption">Ảnh từ link</span>
                  </div>
                )}

                {result.primary.mapping.length > 0 && (
                  <div className="advisor-mapping-table">
                    {result.primary.mapping.map((row) => (
                      <div key={row.label} className="advisor-mapping-row">
                        <span className="advisor-mapping-label">{row.label}</span>
                        <span className="advisor-mapping-from">{row.source_value}</span>
                        <span className="advisor-mapping-arrow">→</span>
                        <span className="advisor-mapping-to">{row.target_value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="advisor-media-box">
                  <div className="advisor-media-frame">
                    <img src={result.primary.cover_image} alt={result.primary.name} />
                  </div>
                  <span className="advisor-media-caption">Kho di sản</span>
                </div>
              </div>

              <div className="advisor-primary-footer">
                <h3 className="advisor-primary-title">{result.primary.name}</h3>
                <div className="advisor-primary-actions">
                  {result.source_image_data_url && (
                    <button
                      type="button"
                      className="advisor-btn-outline"
                      onClick={handleSaveToGallery}
                      disabled={saveState === 'saving' || saveState === 'saved'}
                    >
                      {saveState === 'saved' ? 'Đã lưu' : saveState === 'saving' ? 'Đang lưu' : 'Lưu vào gallery'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="advisor-btn-filled"
                    onClick={() => handleUseInStudio(result.primary.costume_id, result.source_image_data_url)}
                  >
                    Phối đồ ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {result && result.secondary.length > 0 && (
            <div className="advisor-secondary-grid">
              {result.secondary.map((rec, idx) => (
                <div key={rec.costume_id} className="advisor-secondary-card">
                  <div className="advisor-secondary-img-frame">
                    <img src={rec.cover_image} alt={rec.name} />
                  </div>
                  <div className="advisor-secondary-body">
                    <span className="advisor-secondary-tag">{`0${idx + 2} · ${rec.tag}`}</span>
                    <h4 className="advisor-secondary-title">{rec.name}</h4>
                    <p className="advisor-secondary-reason">{rec.reason}</p>
                    <button type="button" className="advisor-card-action" onClick={() => handleUseInStudio(rec.costume_id, null)}>
                      Phối đồ ngay →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!result && (
            <div className="advisor-empty-explainer-grid">
              <div className="advisor-empty-explainer-card">
                <h4>I. Dịp</h4>
                <p>Chọn sự kiện, thời tiết, phong cách — giám tuyển lọc kho di sản theo đúng hoàn cảnh.</p>
                <div className="advisor-empty-explainer-img" />
              </div>
              <div className="advisor-empty-explainer-card">
                <h4>II. Cảm Hứng</h4>
                <p>Dán link TikTok hoặc Facebook — màu sắc, phom dáng, vibe được ánh xạ sang Việt phục.</p>
                <div className="advisor-empty-explainer-img" />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
