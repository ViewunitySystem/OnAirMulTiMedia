import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// WebSocket Hook für Live-Updates
function useWebSocket(url) {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          reconnectAttempts.current = 0;
          setSocket(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'status_update' || data.type === 'status') {
              setStatus(data.data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setConnected(false);
          setSocket(null);
          
          // Reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        return ws;
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        return null;
      }
    };

    const ws = connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, status, connected, sendMessage };
}

// API Hook für REST-Endpoints
function useApi() {
  const [uiVariants, setUiVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUiVariants = async (params = {}) => {
    try {
      setLoading(true);
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/ui-variants?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUiVariants(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching UI variants:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async (endpoint) => {
    try {
      const response = await fetch(`/api/status/${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint} status:`, err);
      return null;
    }
  };

  useEffect(() => {
    fetchUiVariants();
  }, []);

  return {
    uiVariants,
    loading,
    error,
    fetchUiVariants,
    fetchStatus
  };
}

// UI-Varianten-Komponente
function UiVariantCard({ variant, isSelected, onSelect, onShowDetails }) {
  return (
    <div 
      className={`ui-variant-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(variant)}
    >
      <div className="card-header">
        <img 
          src={variant.preview} 
          alt={`${variant.name} preview`}
          className="preview-image"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDI4MCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iNjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJldmlldyBOb3QgQXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
          }}
        />
        <div className="card-overlay">
          <button 
            className="details-btn"
            onClick={(e) => {
              e.stopPropagation();
              onShowDetails(variant);
            }}
          >
            ℹ️ Details
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="variant-name">{variant.name}</h3>
        <p className="variant-tagline">{variant.tagline}</p>
        
        <div className="variant-meta">
          <span className="license-badge">{variant.license}</span>
          <span className="popularity-score">⭐ {variant.popularity}</span>
        </div>
        
        <div className="variant-features">
          {variant.features.slice(0, 3).map((feature, index) => (
            <span key={index} className="feature-tag">{feature}</span>
          ))}
          {variant.features.length > 3 && (
            <span className="feature-tag more">+{variant.features.length - 3}</span>
          )}
        </div>
        
        <div className="card-actions">
          <a 
            href={variant.repo} 
            target="_blank" 
            rel="noopener noreferrer"
            className="repo-link"
            onClick={(e) => e.stopPropagation()}
          >
            🔗 Repository
          </a>
        </div>
      </div>
    </div>
  );
}

// Theme-Selector-Komponente
function ThemeSelector({ variants, selectedVariant, onSelect, onShowDetails }) {
  const scrollContainerRef = useRef(null);

  const scrollToVariant = (index) => {
    if (scrollContainerRef.current) {
      const cardWidth = 320; // card width + gap
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="theme-selector">
      <div className="selector-header">
        <h2>🎨 UI/UX-Varianten wählen</h2>
        <p className="selector-description">
          Wählen Sie aus verschiedenen UI-Kits für Ihr SDR-Dashboard. 
          Alle Varianten sind Open-Source und rechtssicher.
        </p>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="variants-container"
      >
        {variants.map((variant, index) => (
          <UiVariantCard
            key={variant.id}
            variant={variant}
            isSelected={selectedVariant?.id === variant.id}
            onSelect={onSelect}
            onShowDetails={onShowDetails}
          />
        ))}
      </div>
      
      <div className="selector-controls">
        <div className="variant-indicators">
          {variants.map((_, index) => (
            <button
              key={index}
              className={`indicator ${selectedVariant === variants[index] ? 'active' : ''}`}
              onClick={() => scrollToVariant(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Status-Dashboard-Komponente
function StatusDashboard({ status, connected }) {
  if (!status) {
    return (
      <div className="status-dashboard">
        <h3>📊 Live-Status</h3>
        <div className="status-loading">Lade Status...</div>
      </div>
    );
  }

  const getStatusIcon = (ok) => ok ? '✅' : '❌';
  const getStatusColor = (ok) => ok ? '#10B981' : '#EF4444';

  return (
    <div className="status-dashboard">
      <div className="dashboard-header">
        <h3>📊 Live-Status</h3>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🔗 Verbunden' : '🔌 Getrennt'}
        </div>
      </div>
      
      <div className="status-grid">
        <div className="status-section">
          <h4>📡 SDR-Feeds</h4>
          <div className="feeds-list">
            {Object.entries(status.feeds || {}).map(([domain, feed]) => (
              <div key={domain} className="feed-item">
                <span className="feed-icon">{getStatusIcon(feed.ok)}</span>
                <span className="feed-name">{domain}</span>
                <span className="feed-region">{feed.region}</span>
                <span className="feed-freshness">{feed.freshnessSec}s</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="status-section">
          <h4>📋 Lizenz-Compliance</h4>
          <div className="compliance-info">
            <div className="compliance-score">
              <span className="score-label">Score:</span>
              <span className="score-value">{status.compliance?.score || 0}%</span>
            </div>
            <div className="license-status">
              <span className="status-label">Status:</span>
              <span 
                className="status-value"
                style={{ color: getStatusColor(status.license?.overall === 'compliant') }}
              >
                {status.license?.overall || 'unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SDR-Enzyklopädie-Modal
function SdrEncyclopediaModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const sdrInfo = {
    definition: "Software-Defined Radio (SDR) ist eine Funktechnologie, bei der Hardware-Komponenten durch Software ersetzt werden.",
    bands: [
      { name: "HF", range: "3-30 MHz", description: "Kurzwellen, Amateurfunk" },
      { name: "VHF", range: "30-300 MHz", description: "UKW, Flugfunk" },
      { name: "UHF", range: "300-3000 MHz", description: "Mobilfunk, Satelliten" }
    ],
    features: [
      "Empfang verschiedener Frequenzbänder",
      "Digitale Signalverarbeitung",
      "Spektrumanalyse",
      "Aufzeichnung und Wiedergabe"
    ]
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 SDR-Enzyklopädie</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="encyclopedia-section">
            <h3>Was ist SDR?</h3>
            <p>{sdrInfo.definition}</p>
          </div>
          
          <div className="encyclopedia-section">
            <h3>Frequenzbänder</h3>
            <div className="bands-list">
              {sdrInfo.bands.map((band, index) => (
                <div key={index} className="band-item">
                  <strong>{band.name}</strong> ({band.range}): {band.description}
                </div>
              ))}
            </div>
          </div>
          
          <div className="encyclopedia-section">
            <h3>Hauptfunktionen</h3>
            <ul className="features-list">
              {sdrInfo.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          
          <div className="encyclopedia-section">
            <h3>Rechtliche Hinweise</h3>
            <div className="legal-notice">
              <p>⚠️ <strong>Wichtig:</strong> Beachten Sie die lokalen Gesetze und Vorschriften für den Betrieb von SDR-Empfängern.</p>
              <p>📋 Informieren Sie sich über Frequenzzuteilungen und Sendelizenzen in Ihrer Region.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Haupt-App-Komponente
function SdrUiRotationApp() {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  
  const { uiVariants, loading, error, fetchUiVariants } = useApi();
  const { status, connected } = useWebSocket('ws://localhost:3000');

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    console.log('Selected UI variant:', variant);
  };

  const handleShowDetails = (variant) => {
    setShowDetails(variant);
  };

  const handleCloseDetails = () => {
    setShowDetails(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Lade UI-Varianten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>❌ Fehler beim Laden</h2>
        <p>{error}</p>
        <button onClick={() => fetchUiVariants()}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="sdr-ui-rotation-app">
      <header className="app-header">
        <h1>🎛️ SDR UI Rotation System</h1>
        <p>Professionelles UI/UX-Rotationssystem für Software-Defined Radio</p>
        <div className="header-actions">
          <button 
            className="encyclopedia-btn"
            onClick={() => setShowEncyclopedia(true)}
          >
            📚 SDR-Enzyklopädie
          </button>
        </div>
      </header>

      <main className="app-main">
        <ThemeSelector
          variants={uiVariants}
          selectedVariant={selectedVariant}
          onSelect={handleVariantSelect}
          onShowDetails={handleShowDetails}
        />

        <StatusDashboard status={status} connected={connected} />

        {selectedVariant && (
          <div className="selected-variant-info">
            <h3>✅ Ausgewählte Variante: {selectedVariant.name}</h3>
            <p>{selectedVariant.tagline}</p>
            <div className="variant-details">
              <p><strong>Kategorie:</strong> {selectedVariant.category}</p>
              <p><strong>Popularität:</strong> {selectedVariant.popularity}/100</p>
              <p><strong>Barrierefreiheit:</strong> {selectedVariant.a11y}</p>
            </div>
          </div>
        )}
      </main>

      <SdrEncyclopediaModal 
        isOpen={showEncyclopedia} 
        onClose={() => setShowEncyclopedia(false)} 
      />

      {showDetails && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showDetails.name}</h2>
              <button className="close-btn" onClick={handleCloseDetails}>✕</button>
            </div>
            <div className="modal-body">
              <div className="variant-detail-content">
                <img src={showDetails.preview} alt={`${showDetails.name} preview`} className="detail-preview" />
                <div className="detail-info">
                  <p><strong>Beschreibung:</strong> {showDetails.tagline}</p>
                  <p><strong>Lizenz:</strong> {showDetails.license}</p>
                  <p><strong>Barrierefreiheit:</strong> {showDetails.a11y}</p>
                  <p><strong>Letztes Update:</strong> {showDetails.lastUpdated}</p>
                  
                  <h4>Features:</h4>
                  <ul>
                    {showDetails.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  
                  <div className="detail-actions">
                    <a 
                      href={showDetails.repo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="repo-link-btn"
                    >
                      🔗 Repository besuchen
                    </a>
                    <button 
                      className="select-btn"
                      onClick={() => {
                        handleVariantSelect(showDetails);
                        handleCloseDetails();
                      }}
                    >
                      ✅ Diese Variante auswählen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// App initialisieren
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SdrUiRotationApp />);
