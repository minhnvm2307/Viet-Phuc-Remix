import React from 'react';
import { Search } from 'lucide-react';

export default function Header({ onSearch, searchQuery, activeTab, setActiveTab }) {
  const scrollTo = (hash) => {
    setActiveTab('catalog');
    setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <header className="editorial-header">
      {/* Brand Title */}
      <div
        className="brand-title"
        style={{ cursor: 'pointer' }}
        onClick={() => scrollTo('#gallery')}
      >
        <div className="brand-seal">VP</div>
        <span>Việt Phục Remix</span>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center' }}>
        <button onClick={() => scrollTo('#gallery')}>Bộ sưu tập</button>
        <button onClick={() => scrollTo('#dynasties')}>Dòng thời gian</button>
        <button
          onClick={() => setActiveTab('studio')}
          style={{
            color: activeTab === 'studio' ? 'var(--dynasty-color)' : 'var(--text-main)',
            fontWeight: activeTab === 'studio' ? '700' : '600'
          }}
        >
          Mix Studio AI
        </button>

        {/* Search Input Box */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-line)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 14px',
          marginLeft: '24px'
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Tìm theo kiểu áo..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              width: '160px',
              color: 'var(--text-main)'
            }}
          />
        </div>
      </nav>
    </header>
  );
}
