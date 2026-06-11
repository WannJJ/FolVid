import { formatTime } from "@/utils/formatTime";
import { useEffect, useState } from "react";
import styles from "./PlayerControls.module.css";
import { Timeline } from "./Timeline";

export function PlayerControls({
  showControls,
  videoRef,
  currentTime,
  progress,
  setProgress,
  togglePlay,
  isPlaying,
  toggleMute,
  volume,
  setVolume,
  setLatestVolume,
  duration,
  speed,
  setSpeed,
  saveState,
  isLoop,
  toggleLoop,
  toggleFullscreen,
}) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Thay đổi âm lượng
  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    if (val > 0) setLatestVolume(val);
    saveState();
  };

  // Adjust playback speed
  const changeSpeed = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate; // HTML5 Video API
    setSpeed(rate);
    setShowSpeedMenu(false); // Chọn xong thì đóng menu
    saveState();
  };
  // Đóng Speed Menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.speedBox}`)) {
        //if (!e.target.closest(".speed-box")) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setShowSpeedMenu]);

  return (
    <div
      className={`${styles.controlsBar} ${showControls ? styles.visible : styles.hidden}`}
    >
      <Timeline
        videoRef={videoRef}
        progress={progress}
        setProgress={setProgress}
      />

      {/* Hàng nút bên dưới */}
      <div className={styles.controlsRow}>
        {/* Play/Pause */}
        <button
          className={styles.controlBtn}
          onClick={togglePlay}
          aria-label={!isPlaying ? "Play" : "Pause"}
          aria-pressed={isPlaying}
        >
          {isPlaying ? "⏸" : "▶"}
          {/*videoRef.current && !videoRef.current.paused ? "⏸" : "▶"*/}
        </button>

        {/* Thời gian */}
        <span className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Volume */}
        <div className={styles.volumeBox}>
          <button
            className={styles.controlBtn}
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
            className={styles.volumeSlider}
          />
        </div>

        <div className={styles.speedBox}>
          <button
            className={`${styles.controlBtn} ${styles.speedToggle}`}
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            title="Tốc độ phát"
            aria-label="Playback Speed"
          >
            {speed}x
          </button>

          {showSpeedMenu && (
            <div className={styles.speedMenu}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <div
                  key={rate}
                  className={`${styles.speedItem} ${speed === rate ? styles.selected : ""}`}
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
          className={`${styles.controlBtn} ${styles.loopBtn} ${isLoop ? styles.active : ""}`}
          onClick={toggleLoop}
          title="Lặp lại"
        >
          🔄
        </button>
        <button
          className={`${styles.controlBtn}`}
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
  );
}
