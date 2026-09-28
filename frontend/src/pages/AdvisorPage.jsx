import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Trang "Gợi Ý Theo Bối Cảnh" — trước đây là modal trong Studio, nay tách thành
// trang riêng có nav item để dễ phát hiện hơn. Không icon, copy ngắn gọn.

const OCCASION_OPTIONS = ['Đi học, đi làm', 'Dạo phố, cà phê', 'Dạ tiệc', 'Lễ hội', 'Cưới hỏi', 'Chụp lookbook'];
const WEATHER_OPTIONS = ['Nóng', 'Mát', 'Lạnh', 'Mưa'];
const VIBE_OPTIONS = ['Thanh lịch', 'Cá tính', 'Mộc mạc', 'Sang trọng', 'Phá cách'];

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

export default function AdvisorPage() {
  const navigate = useNavigate();
  const [costumes, setCostumes] = useState([]);
  const [activeTab, setActiveTab] = useState('context');

  const [occasion, setOccasion] = useState(null);
  const [weather, setWeather] = useState(null);
  const [vibe, setVibe] = useState(null);
  const [freeText, setFreeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const [trendUrl, setTrendUrl] = useState('');
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState('');
  const [trendResult, setTrendResult] = useState(null);
  const [showUploadFallback, setShowUploadFallback] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);

  useEffect(() => {
    fetch('/api/heritage/costumes')
      .then((res) => res.json())
      .then((data) => {
        if (data.costumes) setCostumes(data.costumes);
      })
      .catch((err) => console.error('Lỗi tải danh mục trang phục:', err));
  }, []);

  const findCostume = (id) => costumes.find((c) => c.id === id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      const res = await fetch('/api/heritage/context-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion,
          weather,
          vibe,
          free_text: freeText.trim() || null
        })
      });
      if (!res.ok) throw new Error('request_failed');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setErrorMsg('Không thể tổng hợp gợi ý lúc này, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyTrendResponse = (data) => {
    if (data.status === 'ok') {
      setTrendResult(data);
      setShowUploadFallback(false);
    } else {
      setTrendResult(null);
      setTrendError(
        data.status === 'failed'
          ? 'Không truy cập được link này.'
          : 'Chưa phân tích được ảnh lúc này, vui lòng thử lại.'
      );
      setShowUploadFallback(true);
    }
  };

  const handleTrendUrlSubmit = async (e) => {
    e.preventDefault();
    setIsTrendLoading(true);
    setTrendError('');
    setTrendResult(null);
    setShowUploadFallback(false);
    try {
      const res = await fetch('/api/heritage/trend-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_url: trendUrl.trim() })
      });
      if (!res.ok) throw new Error('request_failed');
      applyTrendResponse(await res.json());
    } catch (err) {
      setTrendError('Không thể phân tích lúc này, vui lòng thử lại.');
      setShowUploadFallback(true);
    } finally {
      setIsTrendLoading(false);
    }
  };

  const handleUploadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploadFile(file);
    setUploadPreviewUrl(URL.createObjectURL(file));
  };

  const handleTrendUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsTrendLoading(true);
    setTrendError('');
    setTrendResult(null);
    try {
      const formData = new FormData();
      formData.append('screenshot', uploadFile);
      const res = await fetch('/api/heritage/trend-extract-upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('request_failed');
      applyTrendResponse(await res.json());
    } catch (err) {
      setTrendError('Không thể phân tích ảnh lúc này, vui lòng thử lại.');
    } finally {
      setIsTrendLoading(false);
    }
  };

  const resetTrendTab = () => {
    setTrendUrl('');
    setTrendResult(null);
    setTrendError('');
    setShowUploadFallback(false);
    setUploadFile(null);
    setUploadPreviewUrl(null);
  };

  const trendMatchedCostume = trendResult ? findCostume(trendResult.matched_costume_id) : null;

  return (
    <div className="studio-container advisor-page-container">
      <div className="advisor-page-header">
        <h1 className="advisor-page-title">Gợi Ý Theo Bối Cảnh</h1>
        <p className="advisor-page-subtitle">
          Mô tả bối cảnh của bạn, Giám tuyển sẽ đề xuất trang phục phù hợp.
        </p>
      </div>

      <div className="advisor-tab-bar">
        <button
          type="button"
          className={`advisor-chip ${activeTab === 'context' ? 'active' : ''}`}
          onClick={() => setActiveTab('context')}
        >
          Theo Bối Cảnh
        </button>
        <button
          type="button"
          className={`advisor-chip ${activeTab === 'trend' ? 'active' : ''}`}
          onClick={() => setActiveTab('trend')}
        >
          Theo Trend
        </button>
      </div>

      <div className="advisor-page-body">
        {activeTab === 'context' && (
          <>
            {!result && (
              <form onSubmit={handleSubmit} className="advisor-form">
                <ChipGroup label="Sự kiện" options={OCCASION_OPTIONS} value={occasion} onChange={setOccasion} />
                <ChipGroup label="Thời tiết" options={WEATHER_OPTIONS} value={weather} onChange={setWeather} />
                <ChipGroup label="Phong cách" options={VIBE_OPTIONS} value={vibe} onChange={setVibe} />

                <div className="advisor-freetext-group">
                  <span className="advisor-group-label">Mô tả thêm</span>
                  <textarea
                    className="advisor-textarea"
                    rows={2}
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Ví dụ: đi lễ hội Trung Thu phố cổ Hội An buổi tối"
                  />
                </div>

                {errorMsg && <div className="advisor-error-text">{errorMsg}</div>}

                <button type="submit" className="btn-editorial-primary advisor-submit-btn" disabled={isLoading}>
                  {isLoading ? 'Đang tổng hợp' : 'Xin gợi ý'}
                </button>
              </form>
            )}

            {result && (
              <div className="advisor-results">
                {result.curator_intro && <p className="advisor-intro-text">{result.curator_intro}</p>}

                <div className="advisor-card-list">
                  {result.recommendations.map((rec) => {
                    const costume = findCostume(rec.costume_id);
                    if (!costume) return null;
                    return (
                      <div key={rec.costume_id} className="advisor-recommend-card">
                        <div className="advisor-card-img">
                          <img src={costume.cover_image} alt={costume.name} />
                        </div>
                        <div className="advisor-card-body">
                          <span className="advisor-card-era">{costume.era_origin}</span>
                          <h4 className="advisor-card-title">{costume.name}</h4>
                          {rec.reason && <p className="advisor-card-reason">{rec.reason}</p>}
                          <button
                            type="button"
                            className="advisor-card-action"
                            onClick={() => navigate(`/studio?costume=${costume.id}`)}
                          >
                            Phối đồ ngay
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="button" className="btn-editorial-secondary advisor-retry-btn" onClick={() => setResult(null)}>
                  Thử bối cảnh khác
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'trend' && (
          <>
            {!trendResult && !showUploadFallback && (
              <form onSubmit={handleTrendUrlSubmit} className="advisor-form">
                <div className="advisor-freetext-group">
                  <span className="advisor-group-label">Link TikTok hoặc Facebook</span>
                  <input
                    type="text"
                    className="advisor-textarea"
                    value={trendUrl}
                    onChange={(e) => setTrendUrl(e.target.value)}
                    placeholder="Dán link video/bài viết bạn thấy đang trend"
                  />
                </div>

                {trendError && <div className="advisor-error-text">{trendError}</div>}

                <button
                  type="submit"
                  className="btn-editorial-primary advisor-submit-btn"
                  disabled={isTrendLoading || !trendUrl.trim()}
                >
                  {isTrendLoading ? 'Đang phân tích' : 'Phân Tích'}
                </button>
              </form>
            )}

            {showUploadFallback && !trendResult && (
              <form onSubmit={handleTrendUploadSubmit} className="advisor-form">
                {trendError && <div className="advisor-error-text">{trendError}</div>}

                <div
                  className="advisor-trend-upload-zone"
                  onClick={() => document.getElementById('trend-upload-input')?.click()}
                >
                  {uploadPreviewUrl ? (
                    <img src={uploadPreviewUrl} alt="Ảnh chụp màn hình đã chọn" />
                  ) : (
                    <span>Nhấp để tải ảnh chụp màn hình thay thế</span>
                  )}
                </div>
                <input
                  id="trend-upload-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadFile(e.target.files?.[0])}
                />

                <button
                  type="submit"
                  className="btn-editorial-primary advisor-submit-btn"
                  disabled={isTrendLoading || !uploadFile}
                >
                  {isTrendLoading ? 'Đang phân tích' : 'Phân Tích Ảnh'}
                </button>
              </form>
            )}

            {trendResult && trendMatchedCostume && (
              <div className="advisor-results">
                <div className="advisor-card-list">
                  <div className="advisor-recommend-card">
                    <div className="advisor-card-img">
                      <img
                        src={trendResult.thumbnail_url || uploadPreviewUrl}
                        alt={trendMatchedCostume.name}
                      />
                    </div>
                    <div className="advisor-card-body">
                      <span className="advisor-card-era">{trendMatchedCostume.era_origin}</span>
                      <h4 className="advisor-card-title">{trendMatchedCostume.name}</h4>
                      {trendResult.adaptation_reason && (
                        <p className="advisor-card-reason">{trendResult.adaptation_reason}</p>
                      )}
                      <button
                        type="button"
                        className="advisor-card-action"
                        onClick={() => navigate(`/studio?costume=${trendMatchedCostume.id}`)}
                      >
                        Phối đồ ngay
                      </button>
                    </div>
                  </div>
                </div>

                <button type="button" className="btn-editorial-secondary advisor-retry-btn" onClick={resetTrendTab}>
                  Thử link khác
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
