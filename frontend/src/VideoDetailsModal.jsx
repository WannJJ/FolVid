import { useEffect } from 'react';

export default function VideoDetailsModal({ isOpen, onClose, details, filename }) {
    // details = { width, height, duration, size, artist, author, genre }
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        // Overlay
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',        // Hiệu ứng mờ nền rất đẹp
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>

            {/*Card*/}
            <div style={{
                background: '#252525',
                border: '1px solid #3a3a3a',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                color: '#eee',
                overflow: 'hidden',               // Giúp borderRadius ăn đều
                transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
                transform: isOpen ? 'scale(1)' : 'scale(0.95)',
                opacity: isOpen ? 1 : 0,
            }}>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid #333',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '1.2rem' }}>🎬</span>
                        <span style={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        }}>
                            {filename}
                        </span>
                    </div>
                    
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            fontSize: '1.3rem',
                            cursor: 'pointer',
                            padding: '0 4px',
                            lineHeight: 1,
                        }}
                        onMouseEnter={e => e.target.style.color = '#fff'}
                        onMouseLeave={e => e.target.style.color = '#888'}
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '20px' }}>
                    {/* Grid cho width, height, duration, size */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                    }}>
                        {/* Resolution */}
                        {details.width && details.height && (
                        <div style={{
                            background: '#2a2a2a',
                            borderRadius: '8px',
                            padding: '12px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>📐</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {details.width} × {details.height}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                            Resolution
                            </div>
                        </div>
                        )}

                        {/* Duration */}
                        {details.duration && (
                        <div style={{ background: '#2a2a2a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>⏱</div>
                            <div style={{ fontWeight: 600 }}>{details.duration}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Duration</div>
                        </div>
                        )}

                        {/* File Size – cho chiếm full width nếu chỉ có 1 hàng */}
                        {details.size && (
                        <div style={{
                            background: '#2a2a2a',
                            borderRadius: '8px',
                            padding: '12px',
                            textAlign: 'center',
                            gridColumn: details.width || details.duration ? 'span 1' : 'span 2',
                        }}>
                            <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>💾</div>
                            <div style={{ fontWeight: 600 }}>{details.size} </div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>File Size</div>
                        </div>
                        )}
                    </div>
                </div>

                {(details.artist || details.author || details.genre) && (
                    <>
                        {/* Divider */}
                        <div style={{ borderTop: '1px solid #333', margin: '0 20px' }} />
                        
                        <div style={{ padding: '16px 20px 20px' }}>
                        <div style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: '#666',
                            marginBottom: '12px',
                            fontWeight: 600,
                        }}>
                            Metadata
                        </div>

                        {details.artist && (
                            <InfoRow icon="🎤" label="Artist" value={details.artist} />
                        )}
                        {details.author && (
                            <InfoRow icon="✍️" label="Author" value={details.author} />
                        )}
                        {details.genre && (
                            <InfoRow icon="🎵" label="Genre" value={details.genre} />
                        )}
                        </div>
                    </>
                )}

                {/* Trong trường hợp tất cả các field đều trống */}                
                {!details.width && !details.height && !details.duration && !details.size && 
                    !details.artist && !details.author && !details.genre && (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#666',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                        <div style={{ fontSize: '0.9rem' }}>No details available for this video.</div>
                    </div>
                )}

            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '10px',
      padding: '6px 0',
      fontSize: '0.9rem',
    }}>
      <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>{icon}</span>
      <span style={{ color: '#888', minWidth: '50px' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 500 }}>{value}</span>
    </div>
  );
}