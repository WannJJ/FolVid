import { useState, useEffect, useRef } from 'react';
import ContextMenu, {MenuItem} from "./ContextMenu.jsx";
import './App.css';

const API = 'http://localhost:4000';

function formatTime1(seconds) {
  if (!seconds || seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const mb = bytes / 1024 / 1024;
  return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);      // % của timeline (0-100)
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoop, setIsLoop] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [editingName, setEditingName] = useState(null); // Tên file đang được sửa
  const [tempName, setTempName] = useState(''); // Giá trị tạm trong input
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null,      // 'listItem' | 'player'
    target: null,    // tên file video nếu là listItem
  });

  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Tự động đổi title khi chuyển video
  useEffect(() => {
    if (currentVideo) {
      document.title = `▶ ${currentVideo.filename} | FolVid`;
    } else {
      document.title = 'FolVid';
    }
  }, [currentVideo]);

  useEffect(() => {
    fetch(`${API}/api/videos`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data);
        if (data.length > 0) setCurrentVideo(data[0]);
      })  
      .catch((err) => console.error('Lỗi tải danh sách video:', err));
  }, []);
  


  useEffect(() => {
    const handleKey = (e) => { 
      if(editingName) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === 'ArrowLeft' || e.code === 'Numpad4') {
        videoRef.current.currentTime -= 5;
      }
      if (e.code === 'ArrowRight' || e.code === 'Numpad6') {
        videoRef.current.currentTime += 5;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, editingName]); // Dependency để togglePlay đọc đúng trạng thái

  // Đóng Speed Menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.speed-box')) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Chỉ prevent nếu click vào vùng tự quản lý
      if (e.target.closest('.sidebar')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  const fetchVideoList = async () => {
    try {
      const res = await fetch(`${API}/api/videos`);
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error('Lỗi tải danh sách:', err);
    }
  };


  const handleSelectVideo = (v) => {
    if(editingName) return; // handleSelectVideo sẽ không hoạt động nếu đang editing name
    setCurrentVideo(v);
    setSidebarOpen(false); // Đóng sidebar sau khi chọn (trên mobile)
  };

  // Format giây → "mm:ss" hoặc "hh:mm:ss"
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  };

  // Play / Pause toggle method
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  // Khi video đang chạy, cập nhật thanh timeline
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const pct = (vid.currentTime / vid.duration) * 100;
    setProgress(pct);
    setCurrentTime(vid.currentTime);
  };

  // Khi load xong video, lấy tổng thời lượng
  const handleLoadedMeta = () => {
    setDuration(videoRef.current.duration);
  };

  // Tua khi click vào thanh timeline
  const handleSeek = (e) => {
    const bar = timelineRef.current;
    if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
    setProgress(pos * 100);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleSeek(e); // Gọi lại hàm tua
  };

  // Adjust playback speed
  const changeSpeed = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;  // HTML5 Video API
    setSpeed(rate);
    setShowSpeedMenu(false); // Chọn xong thì đóng menu
  };

  // Thay đổi âm lượng
  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
  };

  // Loop Function
  const toggleLoop = () => {
    if (!videoRef.current) return;
    const next = !isLoop;
    videoRef.current.loop = next;   // HTML5 Video API
    setIsLoop(next);
  };

  // Xử lý khi chọn file qua input
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);

  };
  
  // Hàm xử lý khi kéo thả
  const handleDropFile = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Quan trọng: nếu không có dòng này, trình duyệt sẽ mở file thay vì drop
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  // Hàm gọi API upload
  const uploadFile = async (file) => {
    // Kiểm tra đuôi file có hợp lệ không
    const validExts = ['.mp4', '.mp3', '.webm', '.ogg', '.mov'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExts.includes(ext)) {
      alert('Chỉ chấp nhận file .mp4, .webm, .ogg, .mov');
      return;
    }
    
    const formData = new FormData();
    formData.append('video', file); // 'video' phải khớp với upload.single('video')

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData, // Không set Content-Type, browser tự set kèm boundary
      });
      const data = await res.json();
      if (res.ok) {
        alert('Upload thành công: ' + data.filename);
        
        await fetchVideoList();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Hàm thay đổi file name
  const startRename = (filename) => {
    setEditingName(filename);
    setTempName(filename);
  };

  const cancelRename = () => {
    setEditingName(null);
    setTempName('');
  };

  const confirmRename = async (oldName) => {
    if (!tempName || tempName === oldName) {
      cancelRename();
      return;
    }

    try {
      const res = await fetch(`${API}/api/videos/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: tempName }),
      });

      if (res.ok) {
        // Cập nhật lại danh sách
        await fetchVideoList();
        // Nếu video đang phát bị đổi tên, cập nhật lại currentVideo
        if (currentVideo.filename === oldName) setCurrentVideo(tempName);
      } else {
        const err = await res.json();
        alert('Lỗi đổi tên: ' + err.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingName(null);
    }
  };




  return (
    <div className="app-container">
      {/* Overlay để đóng sidebar khi bấm ra ngoài */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h2>📁 FolVid</h2>
        <p className="count">{videos.length} video trong thư mục</p>
        <ul className="video-list">
          {videos.map((v) => (
            <li 
              key={v.filename}
              onClick={() => handleSelectVideo(v)}  
              onContextMenu = {(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  visible: true,  
                  x: e.clientX,
                  y: e.clientY,
                  type: 'listItem',
                  target: v,
                });
              }

              }
              className={`video-item ${currentVideo === v ? 'active' : ''}`}
            >
              {v.thumb ? (
                <img
                  src={`${API}${v.thumb}`}
                  alt=""
                  style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 4 }}
                />
              ) : (
                <div style={{
                  width: 120, height: 68, background: '#333', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24
                }}>
                  {v.filename.endsWith('.mp3') ? '🎵' : '🎬'}
                </div>
              )}

              {editingName === v.filename ? (
                <>
                  <input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename(v.filename);
                      if (e.key === 'Escape') cancelRename();
                    }}
                  />
                  <button onClick={() => confirmRename(v)}>✓</button>
                  <button onClick={cancelRename}>✕</button>
                </>
              ) : (
                <>
                  <span 
                    //onClick={() => handleSelectVideo(v)}
                  >
                      🎬 {v.filename}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        
        <div
          onDrop={handleDropFile}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: isDraggingFile ? '2px dashed #3b82f6' : '2px dashed #555',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px',
            borderRadius: '8px',
            background: isDraggingFile ? '#1a2f4a' : '#2a2a2a',
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept="video/*"
            style={{ display: ' ne' }}
            id="fileInput"
            onChange={handleFileSelect}
          />
          <label htmlFor="fileInput" style={{ cursor: 'pointer', color: '#fff' }}>
            {isDraggingFile ? 'Thả file vào đây' : 'Kéo thả video vào đây, hoặc click để chọn'}
          </label>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-area">

        {/* Nút hamburger chỉ hiện trên mobile */}
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="Mở/đóng danh sách video"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>

        {currentVideo ? (
          <>
            <div 
              className="player-wrapper"
              onMouseMove={() => {
                setShowControls(true);
                clearTimeout(controlsTimeoutRef.current);
                controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
              }}
              onContextMenu = {(e) => {
                e.preventDefault();
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  type: 'player',
                  target: currentVideo,
                })
              }}
            >
              <video
                ref={videoRef}
                src={`${API}/videos/${encodeURIComponent(currentVideo.filename)}`} // encodeURI: phòng khi file có dấu cách/ký tự đặc biệt
                autoPlay
                onPlay={() => setIsPlaying(true)}      // Trình duyệt báo để hiện nút Play/Pause cho đúng
                onPause={() => setIsPlaying(false)}    // Trình duyệt báo dừng để hiện nút Play/Pause cho đúng
                onTimeUpdate={handleTimeUpdate}      // Cập nhật liên tục khi video chạy
                onLoadedMetadata={handleLoadedMeta}  // Khi video load xong, lấy duration
                onClick={togglePlay}                 // Toggle play/pause
                className="video-player"
              />
              
              {/* Overlay controls */}
              <div className={`controls-bar ${showControls ? 'visible' : 'hidden'}`}>
                
                {/* Thanh timeline */}
                <div 
                  className="timeline-container" 
                  ref={timelineRef} 
                  onClick={handleSeek}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)} 
                >
                  <div className="timeline-track">
                    <div className="timeline-progress" style={{ width: `${progress}%` }} />
                  </div>
                  {/* Thumb tròn nhỏ nằm trên đầu progress */}
                  <div className="timeline-thumb" style={{ left: `${progress}%` }} />
                </div>

                {/* Hàng nút bên dưới */}
                <div className="controls-row">
                  {/* Play/Pause */}
                  <button className="control-btn" onClick={togglePlay}>
                    {/*isPlaying ? '⏸' : '▶'*/}
                    {videoRef.current && !videoRef.current.paused ? '⏸' : '▶'}
                  </button>

                  {/* Thời gian */}
                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}  
                  </span>

                  {/* Volume */}
                  <div className="volume-box">
                    <button className="control-btn" onClick={() => {
                      const v = volume === 0 ? 1 : 0;
                      videoRef.current.volume = v;
                      setVolume(v);
                    }}>
                      {volume === 0 ? '🔇' : '🔊'}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolume}
                      className="volume-slider"
                    />
                  </div>

                  <div className="speed-box">
                    <button 
                      className="control-btn speed-toggle" 
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      title="Tốc độ phát"
                    >
                      {speed}x
                    </button>
                    
                    {showSpeedMenu && (
                      <div className="speed-menu">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <div
                            key={rate}
                            className={`speed-item ${speed === rate ? 'selected' : ''}`}
                            onClick={() => changeSpeed(rate)}
                          >
                            {rate === 1 ? 'Normal' : `${rate}x`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>    

                  {/* Loop Button*/}
                  <button 
                    className={`control-btn loop-btn ${isLoop ? 'active' : ''}`} 
                    onClick={toggleLoop}
                    title="Lặp lại"
                  >
                    🔄
                  </button>

                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>👈 Chọn một video từ danh sách bên trái</p>
          </div>
        )}
      </main>

      {/* Custom Context Menu */}
      <ContextMenu
        visible={contextMenu.visible && contextMenu.type === 'listItem'}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      >
        <MenuItem
          icon="▶️"
          label="Play"
          onClick={() => {
            setCurrentVideo(contextMenu.target);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <MenuItem
          icon="✏️"
          label="Rename"
          onClick={() => {
            // Gọi hàm rename bạn đã có, truyền contextMenu.target
            startRename(contextMenu.target.filename);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <MenuItem
          icon="📋"
          label="Copy filename"
          onClick={() => {
            navigator.clipboard.writeText(contextMenu.target);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <div style={{ borderTop: '1px solid #444', margin: '4px 0' }} />
        <MenuItem
          icon="ℹ️"
          label="Details"
          onClick={() => {
            openDetailsModal(contextMenu.target);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
      </ContextMenu>
      <ContextMenu
        visible={contextMenu.visible && contextMenu.type === 'player'}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      >
        <MenuItem
          icon="🔁"
          label="Toggle loop"
          onClick={() => {
            // Bạn đã có logic loop, ví dụ:
            // setIsLoop(!isLoop);
            // videoRef.current.loop = !isLoop;
            toggleLoop(); // hàm bạn tự cài
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <div style={{ borderTop: '1px solid #444', margin: '4px 0' }} />
        <MenuItem
          icon="ℹ️"
          label="Details"
          onClick={() => {
            openDetailsModal(contextMenu.target);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
      </ContextMenu>
    </div>
  );
}

export default App;