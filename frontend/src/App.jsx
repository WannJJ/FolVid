import { useEffect, useRef, useState } from "react";
import "./App.css";
import SideBar from "./components/layout/Sidebar/SideBar";
import { API_BASE_URL } from "./config/api.js";
import { FileUpload } from "./features/upload";
import {
  VideoDetailsModal,
  VideoPlayerContextMenu,
} from "./features/video-actions";
import { VideoList } from "./features/video-list/";
import { VideoPlayer } from "./features/video-player";
import { useUIStore } from "./stores/useUIStore";
function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [progress, setProgress] = useState(0); // % của timeline (0-100)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [latestVolume, setLatestVolume] = useState(1);
  const [fx, setFx] = useState({ type: null, trigger: 0 });
  const [isLoop, setIsLoop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const { sidebarOpen, toggleSidebar } = useUIStore();

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
    fetchVideoList()
      .then((data) => {
        if (data.length > 0) {
          setCurrentVideo(data[0]);
        }
      })
      .catch((err) => console.error("Lỗi tải danh sách video:", err));
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
      {/* Sidebar */}
      <SideBar>
        <VideoList
          videos={videos}
          currentVideo={currentVideo}
          setCurrentVideo={setCurrentVideo}
          fetchVideoList={fetchVideoList}
        />
        <FileUpload fetchVideoList={fetchVideoList} />
      </SideBar>

      {/* Main Area */}
      <main className="main-area">
        {/* Nút hamburger chỉ hiện trên mobile */}
        <button
          className="menu-toggle"
          onClick={toggleSidebar}
          aria-label="Mở/đóng danh sách video"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>

        <VideoPlayer
          currentVideo={currentVideo}
          wrapperRef={wrapperRef}
          controlsTimeoutRef={controlsTimeoutRef}
          videoRef={videoRef}
          togglePlay={togglePlay}
          setIsPlaying={setIsPlaying}
          setFx={setFx}
          saveState={saveState}
          handleTimeUpdate={handleTimeUpdate}
          handleLoadedMeta={handleLoadedMeta}
          isAudioOnly={isAudioOnly}
          timelineRef={timelineRef}
          handleSeek={handleSeek}
          setIsDragging={setIsDragging}
          handleMouseMove={handleMouseMove}
          progress={progress}
          isPlaying={isPlaying}
          currentTime={currentTime}
          toggleMute={toggleMute}
          volume={volume}
          handleVolume={handleVolume}
          speed={speed}
          setSpeed={setSpeed}
          isLoop={isLoop}
          toggleLoop={toggleLoop}
          toggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          fx={fx}
          duration={duration}
        />
      </main>

      {/* Custom Context Menu */}
      <VideoPlayerContextMenu toggleLoop={toggleLoop} />

      <VideoDetailsModal />
    </div>
  );
}

export default App;
