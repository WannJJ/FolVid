import { useEffect, useRef, useState } from "react";
import "./App.css";
import SideBar from "./components/layout/Sidebar/SideBar";
import { API_BASE_URL } from "./config/api.js";
import {
  VideoDetailsModal,
  VideoPlayerContextMenu,
} from "./features/video-actions/components";
import VideoList from "./features/video-list/components/VideoList";
import { formatSize } from "./utils/formatSize";
import { formatTime } from "./utils/formatTime.js";

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [progress, setProgress] = useState(0); // % của timeline (0-100)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [latestVolume, setLatestVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [fx, setFx] = useState({ type: null, trigger: 0 });
  const [isLoop, setIsLoop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null, // 'listItem' | 'player'
    target: null, // tên file video nếu là listItem
  });
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    filename: "",
    details: null,
  });

  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const wrapperRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Tự động đổi title khi chuyển video
  useEffect(() => {
    if (currentVideo) {
      document.title = `▶ ${currentVideo.filename} | FolVid`;
    } else {
      document.title = "FolVid";
    }
  }, [currentVideo]);

  // Đóng Speed Menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".speed-box")) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Chỉ prevent nếu click vào vùng tự quản lý
      if (e.target.closest(".sidebar")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // useEffect khi playing file là mp3
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    video.addEventListener("loadedmetadata", () => {
      if (currentVideo.filename.endsWith(".mp3") && !currentVideo.thumb) {
        setIsAudioOnly(true);
      } else {
        setIsAudioOnly(false);
      }
    });
  }, [videoRef, currentVideo]);

  /* Theo dõi trạng thái Fullscreen */
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  const fetchVideoList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos`);
      const data = await res.json();
      setVideos(data);

      return data;
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    }
  };
  useEffect(() => {
    async function fetchVideos() {
      await fetchVideoList();
    }
    fetchVideos();
  }, []);

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
    saveState();
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
    videoRef.current.playbackRate = rate; // HTML5 Video API
    setSpeed(rate);
    setShowSpeedMenu(false); // Chọn xong thì đóng menu
    saveState();
  };

  // Thay đổi âm lượng
  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    if (val > 0) setLatestVolume(val);
    saveState();
  };

  const toggleMute = () => {
    const v = volume === 0 ? latestVolume : 0;
    videoRef.current.volume = v;
    setVolume(v);
    saveState();
  };

  // Loop Function
  const toggleLoop = () => {
    if (!videoRef.current) return;
    const next = !isLoop;
    videoRef.current.loop = next; // HTML5 Video API
    setIsLoop(next);
    saveState();
  };

  /*
  Browser cung cấp API để đưa bất  kỳ element nào vào fullscreen, không chỉ <video>
  Browser cũng tự cho phép bấm Esc để thoát Fullscreen, không cần implement
  Chỉ cần implement UseEffect bấm F toggleFullscreen thôi
  */
  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current; // ref trỏ đến .player-wrapper

    if (!document.fullscreenElement) {
      // Vào fullscreen
      if (wrapper.requestFullscreen) {
        await wrapper.requestFullscreen();
      } else if (wrapper.webkitRequestFullscreen) {
        /* Safari */
        await wrapper.webkitRequestFullscreen();
      } else if (wrapper.msRequestFullscreen) {
        /* IE11 */
        await wrapper.msRequestFullscreen();
      }
    } else {
      // Thoát fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    }
  };

  /* 
    Lưu trữ current state vào localStorage dùng cho lần bật sau
    State có dạng như sau:
    {
      "currentVideo": videoObject,     // Có dạng {filename: "", mtime: "", size: "", width: "", height: "" ...}
      "filename": "ten-file.mp4",      
      "currentTime": 125.5,            // Dùng để tua (giây)
      "playbackRate": 1.25,
      "volume": 0.8,                   // Âm lượng 0.0 -> 1.0
      "muted": false,                  // Có đang tắt tiếng không
      "loop": false,                   // Có bật loop không
      "lastUpdated": 1716393600000     // Timestamp (dùng để debug)
    }
    Không ghi liên tục, chỉ ghi khi pause, speed change, volume change, end, before unload
  */
  const saveState = () => {
    if (!videoRef.current || !currentVideo) return;

    const state = {
      currentVideo: currentVideo,
      filename: currentVideo.filename,
      playbackRate: speed,
      volume: volume,
      loop: isLoop,
      lastUpdated: Date.now(),
    };
    localStorage.setItem("folvid_player_state", JSON.stringify(state));
  };

  // Ghi state khi pause, tua, đổi tốc độ, đổi volume, tắt tab
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // TODO: Thêm event loop, mute, bỏ bớt seeked
    const events = ["pause", "seeked", "ratechange", "volumechange"];
    events.forEach((e) => video.addEventListener(e, saveState));

    const handleBeforeUnload = () => saveState();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      events.forEach((e) => video.removeEventListener(e, saveState));
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentVideo, saveState]);

  useEffect(() => {
    if (videos.length === 0) return; // Chờ API trả về danh sách trước

    const params = new URLSearchParams(window.location.search);
    const requestedFileName = params.get("v");

    // Case 1: Có ?v=... trong URL (tab mới được chỉ định mở video cụ thể)

    const requestedVideo = videos.find((e) => e.filename === requestedFileName);
    if (requestedVideo) {
      setCurrentVideo(requestedVideo);

      // Kiểm tra xem localStorage có đang lưu chính video này không
      // Nếu có thì restore luôn state
      const raw = localStorage.getItem("folvid_player_state");
      if (raw) {
        const state = JSON.parse(raw);
        setPendingRestore(state);
      }
      return;
    }

    // // Case 2: URL trắng - Restore thông tin từ localStorage
    const raw = localStorage.getItem("folvid_player_state");
    if (!raw) return;

    const state = JSON.parse(raw);
    // Kiểm tra xem file có còn trong danh sách không

    if (
      state.currentVideo &&
      videos.some((e) => e.filename && e.filename === state.filename)
    ) {
      setCurrentVideo(state.currentVideo);
      // Lưu state tạm vào ref hoặc state để gán sau khi video load
      setPendingRestore(state);
    }
  }, [videos]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !pendingRestore) return;

    const handleLoaded = () => {
      video.playbackRate = pendingRestore.playbackRate;
      setSpeed(pendingRestore.playbackRate);
      video.volume = pendingRestore.volume;
      setVolume(pendingRestore.volume);
      video.loop = pendingRestore.loop;
      setIsLoop(pendingRestore.loop);
      // Nếu muốn auto-play lại thì: video.play();
      setPendingRestore(null); // Xóa tạm
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, [currentVideo, pendingRestore]);

  const openDetailsModal = (v) => {
    setDetailsModal({
      open: true,
      filename: v.filename,
      details: {
        height: v.height,
        width: v.width,
        size: formatSize(v.size),
        duration: formatTime(v.duration),
        artist: v.custom.artist,
        author: v.custom.author,
        genre: v.custom.genre,
      },
    });
  };

  useEffect(() => {
    const handleKey = (e) => {
      const active = document.activeElement;
      const tag = active?.tagName;
      const isEditable = active?.isContentEditable;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        isEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === "ArrowLeft" || e.code === "Numpad4") {
        videoRef.current.currentTime -= 5;
        setFx({ type: "backward", trigger: Date.now() });
      }
      if (e.code === "ArrowRight" || e.code === "Numpad6") {
        videoRef.current.currentTime += 5;
        setFx({ type: "forward", trigger: Date.now() });
      }
      if (e.code === "KeyM") {
        toggleMute();
      }
      if (e.code === "KeyL") {
        toggleLoop();
      }
      if (e.code === "KeyF") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, toggleMute, toggleLoop]); // Dependency để togglePlay đọc đúng trạng thái

  return (
    <div className="app-container">
      {/* Overlay để đóng sidebar khi bấm ra ngoài */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <SideBar sidebarOpen={sidebarOpen}>
        <VideoList
          videos={videos}
          currentVideo={currentVideo}
          setCurrentVideo={setCurrentVideo}
          fetchVideoList={fetchVideoList}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          setSidebarOpen={setSidebarOpen}
          openDetailsModal={openDetailsModal}
        />
      </SideBar>

      {/* Main Area */}
      <main className="main-area">
        {/* Nút hamburger chỉ hiện trên mobile */}
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Mở/đóng danh sách video"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>

        {currentVideo ? (
          <>
            <div
              ref={wrapperRef}
              className={`player-wrapper`}
              onMouseMove={() => {
                setShowControls(true);
                clearTimeout(controlsTimeoutRef.current);
                controlsTimeoutRef.current = setTimeout(
                  () => setShowControls(false),
                  3000,
                );
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  type: "player",
                  target: currentVideo,
                });
              }}
            >
              <video
                ref={videoRef}
                src={`${API_BASE_URL}/videos/${encodeURIComponent(currentVideo.filename)}`} // encodeURI: phòng khi file có dấu cách/ký tự đặc biệt
                autoPlay
                onClick={togglePlay} // Toggle play/pause
                onPlay={() => {
                  setIsPlaying(true); // Trình duyệt báo để hiện nút Play/Pause cho đúng
                  setFx({
                    type: "play",
                    trigger: Date.now(),
                  });
                }}
                onPause={() => {
                  setIsPlaying(false); // Trình duyệt báo dừng để hiện nút Play/Pause cho đúng
                  saveState();
                  setFx({
                    type: "pause",
                    trigger: Date.now(),
                  });
                }}
                onTimeUpdate={handleTimeUpdate} // Cập nhật liên tục khi video chạy
                onLoadedMetadata={handleLoadedMeta} // Khi video load xong, lấy duration
                className={`video-player`}
              />

              {isAudioOnly && (
                <div className="audio-visualizer">
                  <div className="marquee-track">
                    {/* Hiển thị đơn giản cho file mp3 */}
                    <span className="marquee-text">
                      🎵 {currentVideo.filename}
                    </span>
                  </div>
                </div>
              )}

              {/* Overlay controls */}
              <div
                className={`controls-bar ${showControls ? "visible" : "hidden"}`}
              >
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
                    <div
                      className="timeline-progress"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {/* Thumb tròn nhỏ nằm trên đầu progress */}
                  <div
                    className="timeline-thumb"
                    style={{ left: `${progress}%` }}
                  />
                </div>

                {/* Hàng nút bên dưới */}
                <div className="controls-row">
                  {/* Play/Pause */}
                  <button
                    className="control-btn"
                    onClick={togglePlay}
                    aria-label={!isPlaying ? "Play" : "Pause"}
                    aria-pressed={isPlaying}
                  >
                    {isPlaying ? "⏸" : "▶"}
                    {/*videoRef.current && !videoRef.current.paused ? "⏸" : "▶"*/}
                  </button>

                  {/* Thời gian */}
                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  {/* Volume */}
                  <div className="volume-box">
                    <button
                      className="control-btn"
                      onClick={toggleMute}
                      aria-label="volume"
                    >
                      {volume === 0 ? "🔇" : "🔊"}
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
                      aria-label="Playback Speed"
                    >
                      {speed}x
                    </button>

                    {showSpeedMenu && (
                      <div className="speed-menu">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <div
                            key={rate}
                            className={`speed-item ${speed === rate ? "selected" : ""}`}
                            onClick={() => changeSpeed(rate)}
                          >
                            {rate === 1 ? "Normal" : `${rate}x`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Loop Button*/}
                  <button
                    className={`control-btn loop-btn ${isLoop ? "active" : ""}`}
                    onClick={toggleLoop}
                    title="Lặp lại"
                  >
                    🔄
                  </button>
                  <button
                    className={`control-btn full-screen-btn`}
                    onClick={toggleFullscreen}
                    aria-label="Fullscreen"
                    title="Fullscreen"
                  >
                    {isFullscreen ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {(fx.type === "forward" || fx.type === "backward") && (
                <div key={fx.trigger} className="flash-layer"></div>
              )}

              <div className="fx-overlay">
                {fx.type && (
                  <div
                    key={fx.trigger} //Mỗi lần key đổi, React coi đó là phần tử mới → animation CSS sẽ chạy lại từ đầu.
                    className={`fx-icon ${
                      fx.type === "play" || fx.type === "pause"
                        ? "fx-pop"
                        : fx.type === "forward"
                          ? "fx-forward"
                          : fx.type === "backward"
                            ? "fx-backward"
                            : ""
                    } `}
                  >
                    {fx.type === "play" && "▶"}
                    {fx.type === "pause" && "⏸"}
                    {fx.type === "forward" && "+5s"}
                    {fx.type === "backward" && "-5s"}
                  </div>
                )}
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
      <VideoPlayerContextMenu
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        toggleLoop={toggleLoop}
        openDetailsModal={openDetailsModal}
      />

      <VideoDetailsModal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal((prev) => ({ ...prev, open: false }))}
        filename={detailsModal.filename}
        details={detailsModal.details || {}}
      />
    </div>
  );
}

export default App;
