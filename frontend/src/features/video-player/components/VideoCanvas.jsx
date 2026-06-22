import { videoApi } from "@/services/videoApi";
import usePlaylistStore from "@/stores/usePlaylistStore";
import { useVideoStore } from "@/stores/useVideoStore";
import Hls from "hls.js";
import { useEffect } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import styles from "./VideoPlayer.module.css";

export function VideoCanvas() {
  const {
    videoRef,
    setIsPlaying,
    handleTimeUpdate,
    handleLoadedMeta,
    setFx,
    saveState,
    togglePlay,
  } = usePlayer();
  const { currentVideo, useHLS } = useVideoStore();
  const playlist = usePlaylistStore((state) => state.playlist);
  const playNext = usePlaylistStore((state) => state.playNext);

  // Xử lý HLS khi đổi video
  // ========== LOGIC CHỌN SOURCE: TÍNH 1 LẦN, GÁN 1 LẦN ==========
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    let hls = null;

    // Tính toán URL duy nhất 1 lần
    const normalUrl = videoApi.getVideoSrc(currentVideo.filename);

    // QUYẾT ĐỊNH: Có dùng HLS không?
    const shouldUseHLS =
      currentVideo.type === "video" && // Chỉ video mới xét HLS
      currentVideo.hasHLS === true; // Backend xác nhận đã có HLS

    if (useHLS && shouldUseHLS) {
      const hlsUrl = videoApi.getHlsSrc(currentVideo.filename);

      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS lỗi, fallback về file gốc:", data);
            hls.destroy();
            hls = null;
            video.src = normalUrl; // Fallback khi HLS lỗi
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = hlsUrl;
      } else {
        // Trình duyệt không hỗ trợ HLS
        video.src = normalUrl;
      }
    } else {
      // Audio hoặc video chưa có HLS: dùng file gốc
      video.src = normalUrl;
    }

    return () => {
      if (hls) {
        hls.destroy();
      } else {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [currentVideo, useHLS]);

  const handleEnded = () => {
    // Chỉ autoplay next nếu đang trong playlist mode
    if (playlist !== null) {
      playNext();
    }
  };

  return (
    <video
      ref={videoRef}
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
      onEnded={handleEnded}
      onTimeUpdate={handleTimeUpdate} // Cập nhật liên tục khi video chạy
      onLoadedMetadata={handleLoadedMeta} // Khi video load xong, lấy duration
      className={styles.videoPlayer}
    />
  );
}
