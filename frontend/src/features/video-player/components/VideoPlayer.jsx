import { VideoPlayerContextMenu } from "@/features/video-actions";
import { useUIStore } from "@/stores/useUIStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioVisualizer } from "./AudioVisualizer";
import { PlayerControls } from "./PlayerControls";
import { VideoCanvas } from "./VideoCanvas";
import styles from "./VideoPlayer.module.css";

export function VideoPlayer({
  currentVideo,
  videoRef,
  pendingRestore,
  setPendingRestore,
}) {
  const { openContextMenu } = useUIStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0); // % của timeline (0-100)
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [latestVolume, setLatestVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [isLoop, setIsLoop] = useState(false);

  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [fx, setFx] = useState({ type: null, trigger: 0 });

  const wrapperRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

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

  // Play / Pause toggle method
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [videoRef]);

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
  }, []);

  const toggleMute = useCallback(() => {
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
  }, [isLoop]);

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
  }, [currentVideo, saveState, videoRef]);

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
  }, [currentVideo, pendingRestore, setPendingRestore, videoRef]);

  return (
    <>
      {currentVideo ? (
        <>
          <div
            ref={wrapperRef}
            className={styles.playerWrapper}
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
              openContextMenu({
                x: e.clientX,
                y: e.clientY,
                type: "player",
                target: currentVideo,
              });
            }}
          >
            <VideoCanvas
              videoRef={videoRef}
              currentVideo={currentVideo}
              togglePlay={togglePlay}
              setIsPlaying={setIsPlaying}
              setFx={setFx}
              saveState={saveState}
              handleTimeUpdate={handleTimeUpdate}
              handleLoadedMeta={handleLoadedMeta}
            />

            {isAudioOnly && <AudioVisualizer currentVideo={currentVideo} />}

            {/* Overlay controls */}
            <PlayerControls
              showControls={showControls}
              videoRef={videoRef}
              currentTime={currentTime}
              progress={progress}
              setProgress={setProgress}
              togglePlay={togglePlay}
              isPlaying={isPlaying}
              toggleMute={toggleMute}
              volume={volume}
              setVolume={setVolume}
              setLatestVolume={setLatestVolume}
              duration={duration}
              speed={speed}
              setSpeed={setSpeed}
              saveState={saveState}
              isLoop={isLoop}
              toggleLoop={toggleLoop}
              toggleFullscreen={toggleFullscreen}
            />

            {(fx.type === "forward" || fx.type === "backward") && (
              <div key={fx.trigger} className={styles.flashLayer}></div>
            )}

            <div className={styles.fxOverlay}>
              {fx.type && (
                <div
                  key={fx.trigger} //Mỗi lần key đổi, React coi đó là phần tử mới → animation CSS sẽ chạy lại từ đầu.
                  className={`${styles.fxIcon} ${
                    fx.type === "play" || fx.type === "pause"
                      ? styles.fxPop
                      : fx.type === "forward"
                        ? styles.fxForward
                        : fx.type === "backward"
                          ? styles.fxBackward
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
        <div className={styles.emptyState}>
          <p>👈 Chọn một video từ danh sách bên trái</p>
        </div>
      )}

      {/* Custom Context Menu */}
      <VideoPlayerContextMenu toggleLoop={toggleLoop} />
    </>
  );
}
