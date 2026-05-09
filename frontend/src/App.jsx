import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:4000';

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const videoRef = useRef(null);

  // Lấy danh sách video khi load trang
  useEffect(() => {
    fetch(`${API}/api/videos`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data);
        // Tự động chọn video đầu tiên nếu có
        if (data.length > 0) {
          setCurrentVideo(data[0]);
        }
      })
      .catch((err) => console.error('Lỗi tải danh sách video:', err));
  }, []);

  const handleSpeedChange = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar: Danh sách video */}
      <aside
        style={{
          width: '300px',
          background: '#1e1e1e',
          color: '#fff',
          padding: '20px',
          overflowY: 'auto',
          borderRight: '1px solid #333',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>📁 FolVid</h2>
        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>
          {videos.length} video trong thư mục
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {videos.map((v) => (
            <li
              key={v}
              onClick={() => setCurrentVideo(v)}
              style={{
                padding: '10px',
                marginBottom: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: currentVideo === v ? '#3b82f6' : '#2a2a2a',
                transition: 'background 0.2s',
              }}
            >
              🎬 {v}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main: Khu vực phát video */}
      <main style={{ flex: 1, background: '#000', display: 'flex', flexDirection: 'column' }}>
        {currentVideo ? (
          <>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={videoRef}
                src={`${API}/videos/${currentVideo}`}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  outline: 'none',
                }}
              />
            </div>

            {/* Thanh điều khiển tốc độ */}
            <div
              style={{
                padding: '15px 20px',
                background: '#111',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderTop: '1px solid #333',
              }}
            >
              <span style={{ fontSize: '0.9rem', marginRight: '10px' }}>Tốc độ:</span>
              {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#3b82f6',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  {rate}x
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#aaa' }}>
                Đang phát: {currentVideo}
              </span>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '1.2rem',
            }}
          >
            <p>👈 Chọn một video từ danh sách bên trái</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;