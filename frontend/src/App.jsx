import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { API_BASE_URL } from "./config/api.js";
import ContextMenu, { MenuItem } from "./ContextMenu.jsx";
import VideoList from "./features/video-list/components/VideoList";
import VideoListItem from "./features/video-list/components/VideoListItem";
import { formatSize } from "./utils/formatSize";
import { formatTime } from "./utils/formatTime.js";
import VideoDetailsModal from "./VideoDetailsModal.jsx";

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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    genre: "",
    artist: "",
    minDuration: "",
    maxDuration: "",
    resolution: "",
  });
  const [showFilters, setShowFilters] = useState(false); // đóng/mở panel
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [editingName, setEditingName] = useState(null); // Tên file đang được sửa
  const [tempName, setTempName] = useState(""); // Giá trị tạm trong input
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

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/videos`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data);
        if (data.length > 0) setCurrentVideo(data[0]);
      })
      .catch((err) => console.error("Lỗi tải danh sách video:", err));
  }, []);

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
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    }
  };

  const handleSelectVideo = (v) => {
    if (editingName) return; // handleSelectVideo sẽ không hoạt động nếu đang editing name
    setCurrentVideo(v);
    setSidebarOpen(false); // Đóng sidebar sau khi chọn (trên mobile)
  };

  // Tạo list filtered Videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      // 1. Search theo tên, title, artist
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        v.filename.toLowerCase().includes(q) ||
        (v.filename && v.filename.toLowerCase().includes(q)) ||
        (v.custom.artist && v.custom.artist.toLowerCase().includes(q));

      // 2. Filter dropdown
      const matchGenre = !filters.genre || v.custom.genre === filters.genre;
      const matchArtist = !filters.artist || v.custom.artist === filters.artist;
      const matchRes =
        !filters.resolution || `${v.width}x${v.height}` === filters.resolution;

      // 3. Filter duration (đổi phút -> giây để so sánh)
      const min = filters.minDuration ? parseInt(filters.minDuration) * 60 : 0;
      const max = filters.maxDuration
        ? parseInt(filters.maxDuration) * 60
        : Infinity;
      const dur = v.duration || 0;
      const matchDuration = dur >= min && dur <= max;

      return (
        matchSearch && matchGenre && matchArtist && matchRes && matchDuration
      );
    });
  }, [videos, search, filters]);

  const genres = useMemo(() => {
    const set = new Set(videos.map((v) => v.custom.genre).filter(Boolean));
    return ["", ...Array.from(set).sort()];
  }, [videos]);

  const artists = useMemo(() => {
    const set = new Set(videos.map((v) => v.custom.artist).filter(Boolean));
    return ["", ...Array.from(set).sort()];
  }, [videos]);

  const resolutions = useMemo(() => {
    const set = new Set(
      videos
        .map((v) => (v.width && v.height ? `${v.width}x${v.height}` : null))
        .filter(Boolean),
    );
    return ["", ...Array.from(set).sort()];
  }, [videos]);

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
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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

  // Ghi khi pause, tua, đổi tốc độ, đổi volume, tắt tab
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
    const validExts = [".mp4", ".mp3", ".webm", ".ogg", ".mov"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExts.includes(ext)) {
      alert("Chỉ chấp nhận file .mp4, .webm, .ogg, .mov");
      return;
    }

    const formData = new FormData();
    formData.append("video", file); // 'video' phải khớp với upload.single('video')

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData, // Không set Content-Type, browser tự set kèm boundary
      });
      const data = await res.json();
      if (res.ok) {
        alert("Upload thành công: " + data.filename);

        await fetchVideoList();
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Thay đổi file name
  const startRename = (filename) => {
    setEditingName(filename);
    setTempName(filename);
  };

  const cancelRename = () => {
    setEditingName(null);
    setTempName("");
  };

  const confirmRename = async (oldName) => {
    if (!tempName || tempName === oldName) {
      cancelRename();
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/videos/${encodeURIComponent(oldName)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newName: tempName }),
        },
      );

      if (res.ok) {
        // Cập nhật lại danh sách
        await fetchVideoList();
        // Nếu video đang phát bị đổi tên, cập nhật lại currentVideo
        if (currentVideo.filename === oldName) setCurrentVideo(tempName);
      } else {
        const err = await res.json();
        alert("Lỗi đổi tên: " + err.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingName(null);
    }
  };

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
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>📁 FolVid</h2>
        <p className="count">{videos.length} video trong thư mục</p>

        {/* ===== SEARCH BAR ===== */}
        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="🔍 Tìm theo tên, nghệ sĩ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #444",
              background: "#2a2a2a",
              color: "#fff",
              fontSize: "0.9rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* ===== FILTER PANEL (Accordion) ===== */}
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "4px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>⚙️ Bộ lọc nâng cao</span>
            <span>{showFilters ? "▲" : "▼"}</span>
          </button>

          {showFilters && (
            <div
              style={{
                marginTop: "8px",
                padding: "12px",
                background: "#252525",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Genre */}
              <div>
                <label style={{ color: "#888", fontSize: "0.8rem" }}>
                  Thể loại
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, genre: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "6px",
                    background: "#1e1e1e",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: "4px",
                  }}
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g || "— Tất cả —"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Artist */}
              <div>
                <label style={{ color: "#888", fontSize: "0.8rem" }}>
                  Nghệ sĩ
                </label>
                <select
                  value={filters.artist}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, artist: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "6px",
                    background: "#1e1e1e",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: "4px",
                  }}
                >
                  {artists.map((a) => (
                    <option key={a} value={a}>
                      {a || "— Tất cả —"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Range */}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "#888", fontSize: "0.8rem" }}>
                    Min (phút)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.minDuration}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, minDuration: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "6px",
                      background: "#1e1e1e",
                      color: "#fff",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "#888", fontSize: "0.8rem" }}>
                    Max (phút)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.maxDuration}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, maxDuration: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "6px",
                      background: "#1e1e1e",
                      color: "#fff",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label style={{ color: "#888", fontSize: "0.8rem" }}>
                  Độ phân giải
                </label>
                <select
                  value={filters.resolution}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, resolution: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "6px",
                    background: "#1e1e1e",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: "4px",
                  }}
                >
                  {resolutions.map((r) => (
                    <option key={r} value={r}>
                      {r || "— Tất cả —"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút xóa filter */}
              <button
                onClick={() => {
                  setSearch("");
                  setFilters({
                    genre: "",
                    artist: "",
                    minDuration: "",
                    maxDuration: "",
                    resolution: "",
                  });
                }}
                style={{
                  marginTop: "4px",
                  padding: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                ✕ Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* ===== DANH SÁCH VIDEO ===== */}
        <p style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "12px" }}>
          {filteredVideos.length} / {videos.length} video
        </p>
        <VideoList>
          {filteredVideos.map((v) => (
            <VideoListItem
              key={v.filename}
              v={v}
              isActive={currentVideo === v}
              onClick={() => handleSelectVideo(v)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  type: "listItem",
                  target: v,
                });
              }}
              isEditingName={editingName === v.filename}
              tempName={tempName}
              setTempName={setTempName}
              confirmRename={confirmRename}
              cancelRename={cancelRename}
            />
          ))}
        </VideoList>

        {/* ===== DRAG & DROP ===== */}
        <div
          onDrop={handleDropFile}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: isDraggingFile ? "2px dashed #3b82f6" : "2px dashed #555",
            padding: "20px",
            textAlign: "center",
            marginBottom: "20px",
            borderRadius: "8px",
            background: isDraggingFile ? "#1a2f4a" : "#2a2a2a",
            cursor: "pointer",
          }}
        >
          <input
            type="file"
            accept="video/*"
            style={{ display: " ne" }}
            id="fileInput"
            onChange={handleFileSelect}
          />
          <label
            htmlFor="fileInput"
            style={{ cursor: "pointer", color: "#fff" }}
          >
            {isDraggingFile
              ? "Thả file vào đây"
              : "Kéo thả video vào đây, hoặc click để chọn"}
          </label>
        </div>
      </aside>

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
      <ContextMenu
        visible={contextMenu.visible && contextMenu.type === "listItem"}
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
          icon="▶️"
          label="Play New Tab"
          onClick={() => {
            const video = contextMenu.target;
            const filename = video.filename;
            const url = `/?v=${encodeURIComponent(filename)}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        />
        <MenuItem
          icon="✏️"
          label="Rename"
          onClick={() => {
            startRename(contextMenu.target.filename);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <MenuItem
          icon="📋"
          label="Copy filename"
          onClick={() => {
            navigator.clipboard.writeText(contextMenu.target.filename);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <div style={{ borderTop: "1px solid #444", margin: "4px 0" }} />
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
        visible={contextMenu.visible && contextMenu.type === "player"}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      >
        <MenuItem
          icon="🔁"
          label="Toggle loop"
          onClick={() => {
            toggleLoop();
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <MenuItem
          icon="📋"
          label="Copy filename"
          onClick={() => {
            navigator.clipboard.writeText(contextMenu.target.filename);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
        <div style={{ borderTop: "1px solid #444", margin: "4px 0" }} />
        <MenuItem
          icon="ℹ️"
          label="Details"
          onClick={() => {
            openDetailsModal(contextMenu.target);
            setContextMenu((prev) => ({ ...prev, visible: false }));
          }}
        />
      </ContextMenu>

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
