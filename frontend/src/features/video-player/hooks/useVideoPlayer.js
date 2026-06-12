import { useVideoStore } from "@/stores/useVideoStore";
import { useCallback, useEffect, useRef, useState } from "react";

export function useVideoPlayer() {
  // ===== Refs (không trigger render) =====
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);

  // ===== State =====
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0); // % của timeline (0-100)
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [latestVolume, setLatestVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [isLoop, setIsLoop] = useState(false);
  const [fx, setFx] = useState({ type: null, trigger: 0 });

  const { currentVideo, pendingRestore, setPendingRestore } = useVideoStore();

  // ... các hàm và useEffect ở dưới
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
  const saveState = useCallback(() => {
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
  }, [currentVideo, speed, volume, isLoop]);

  // Play / Pause toggle method
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const v = volume === 0 ? latestVolume : 0;
    videoRef.current.volume = v;
    setVolume(v);
    saveState();
  }, [latestVolume, videoRef, setVolume, volume, saveState]);

  // Loop Function
  const toggleLoop = useCallback(() => {
    if (!videoRef.current) return;
    const next = !isLoop;
    videoRef.current.loop = next; // HTML5 Video API
    setIsLoop(next);
    saveState();
  }, [isLoop, saveState]);

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

  // Keyboard shortcut
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
  }, [isPlaying, toggleMute, toggleLoop, togglePlay, videoRef]); // Dependency để togglePlay đọc đúng trạng thái

  // Ghi state khi pause, tua, đổi tốc độ, đổi volume, tắt tab
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const events = ["pause", "seeked", "ratechange", "volumechange"];
    events.forEach((e) => video.addEventListener(e, saveState));

    const handleBeforeUnload = () => saveState();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      events.forEach((e) => video.removeEventListener(e, saveState));
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentVideo, saveState, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !pendingRestore) return;

    const handleLoaded = () => {
      const { playbackRate, volume, loop } = pendingRestore;
      video.playbackRate = playbackRate;
      setSpeed(playbackRate);
      video.volume = volume;
      setVolume(volume);
      video.loop = loop;
      setIsLoop(loop);
      // Nếu muốn auto-play lại thì: video.play();
      setPendingRestore(null); // Xóa tạm
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, [currentVideo, pendingRestore]);

  return {
    // Refs (cho component gắn vào DOM)
    videoRef,
    wrapperRef,

    // State (cho component render UI)
    isPlaying,
    currentTime,
    progress,
    duration,
    showControls,
    volume,
    latestVolume,
    speed,
    isLoop,
    fx,

    // Actions (cho component gọi)
    setIsPlaying,
    setCurrentTime,
    setProgress,
    setDuration,
    setShowControls,
    setVolume,
    setLatestVolume,
    setSpeed,
    setIsLoop,
    setFx,

    togglePlay,
    toggleMute,
    toggleLoop,
    toggleFullscreen,
    saveState,
    handleTimeUpdate,
    handleLoadedMeta,

    /*
    play,
    pause,
    seek,
    */

    // Getter (nếu component cần giá trị chính xác tức thì, không qua state)
    //getCurrentTime: () => currentTimeRef.current,
  };
}
