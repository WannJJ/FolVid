import { useVideoStore } from "@/stores/useVideoStore";
import { AudioLines, Music } from "lucide-react";
import { useMemo } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import styles from "./AudioVisualizer.module.css";

export function AudioVisualizer() {
  const { isPlaying, videoRef } = usePlayer();
  const { currentVideo } = useVideoStore();
  const frequencyData = useAudioAnalyzer(videoRef);

  // Tính mức độ âm lượng trung bình để điều chỉnh độ sáng nền
  const avgVolume = useMemo(() => {
    if (!frequencyData.length) return 0;
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) sum += frequencyData[i];
    return sum / frequencyData.length / 255; // 0.0 -> 1.0
  }, [frequencyData]);

  if (!currentVideo) return null;

  const barCount = 64;

  return (
    <div className={styles.container}>
      {/* Nền glow phản ứng theo nhạc */}
      <div
        className={styles.bgGlow}
        style={{ opacity: 0.3 + avgVolume * 0.7 }}
      />
      <div className={styles.bgRing} />

      {/* Đĩa nhạc xoay */}
      <div className={styles.discArea}>
        <div className={styles.disc} data-playing={isPlaying}>
          <div className={styles.discGrooves} />
          <div className={styles.discCenter}>
            <Music size={20} className={styles.discIcon} />
          </div>
          <div className={styles.discShine} />
        </div>
      </div>

      {/* Equalizer thực - 64 thanh nhảy theo beat */}
      <div className={styles.equalizer}>
        {Array.from({ length: barCount }).map((_, i) => {
          const value = frequencyData[i] || 0;
          const heightPercent = Math.max((value / 255) * 100, 3);

          // Màu sắc: bass (trái) = xanh tím -> treble (phải) = hồng cam
          const hue = 240 + (i / barCount) * 80;
          const saturation = 70 + (value / 255) * 30;
          const lightness = 50 + (value / 255) * 20;
          const glow =
            value > 180 ? `0 0 10px hsla(${hue}, 95%, 65%, 0.7)` : "none";

          return (
            <div
              key={i}
              className={styles.barTrack}
              style={{
                ["--bar-hue"]: hue,
                ["--bar-sat"]: `${saturation}%`,
                ["--bar-light"]: `${lightness}%`,
                ["--bar-height"]: `${heightPercent}%`,
                ["--bar-glow"]: glow,
              }}
            >
              <div className={styles.bar} />
            </div>
          );
        })}
      </div>

      {/* Thông tin bài nhạc + marquee */}
      <div className={styles.trackInfo}>
        <div className={styles.badge}>
          <AudioLines size={14} />
          <span>{"AUDIO"}</span>
        </div>

        <div className={styles.marqueeMask}>
          <div className={styles.marqueeTrack}>
            <span className={styles.marqueeText} data-playing={isPlaying}>
              🎵 {currentVideo.filename} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
              🎵 {currentVideo.filename} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
