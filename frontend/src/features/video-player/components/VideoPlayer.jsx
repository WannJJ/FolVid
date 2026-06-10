import { API_BASE_URL } from "@/config/api";
import { useUIStore } from "@/stores/useUIStore";
import { formatTime } from "@/utils/formatTime";
import { useEffect, useState } from "react";
import styles from "./VideoPlayer.module.css";

export function VideoPlayer({
  currentVideo,
  wrapperRef,
  controlsTimeoutRef,
  videoRef,
  togglePlay,
  setIsPlaying,
  setFx,
  saveState,
  handleTimeUpdate,
  handleLoadedMeta,
  isAudioOnly,
  timelineRef,
  handleSeek,
  setIsDragging,
  handleMouseMove,
  progress,
  isPlaying,
  currentTime,
  toggleMute,
  volume,
  handleVolume,
  speed,
  setSpeed,
  isLoop,
  toggleLoop,
  toggleFullscreen,
  isFullscreen,
  fx,
  duration,
}) {
  const { openContextMenu } = useUIStore();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
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
  }, []);

  // Adjust playback speed
  const changeSpeed = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate; // HTML5 Video API
    setSpeed(rate);
    setShowSpeedMenu(false); // Chọn xong thì đóng menu
    saveState();
  };
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
              className={styles.videoPlayer}
            />

            {isAudioOnly && (
              <div className={styles.audioVisualizer}>
                <div className={styles.marqueeTrack}>
                  {/* Hiển thị đơn giản cho file mp3 */}
                  <span className={styles.marqueeText}>
                    🎵 {currentVideo.filename}
                  </span>
                </div>
              </div>
            )}

            {/* Overlay controls */}
            <div
              className={`${styles.controlsBar} ${showControls ? styles.visible : styles.hidden}`}
            >
              {/* Thanh timeline */}
              <div
                className={styles.timelineContainer}
                ref={timelineRef}
                onClick={handleSeek}
                onMouseDown={() => setIsDragging(true)}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <div className={styles.timelineTrack}>
                  <div
                    className={styles.timelineProgress}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Thumb tròn nhỏ nằm trên đầu progress */}
                <div
                  className={styles.timelineThumb}
                  style={{ left: `${progress}%` }}
                />
              </div>

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
    </>
  );
}
