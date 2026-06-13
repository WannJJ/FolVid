import { VideoPlayerContextMenu } from "@/features/video-actions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useVideoStore } from "@/stores/useVideoStore";
import { useEffect, useState } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import { useAutoHideControls } from "../hooks/useAutoHideControls";
import { usePlayerContextMenu } from "../hooks/usePlayerContextMenu";
import { AudioVisualizer } from "./AudioVisualizer";
import { FXAnimation } from "./FXAnimation";
import { PlayerControls } from "./PlayerControls";
import { VideoCanvas } from "./VideoCanvas";
import styles from "./VideoPlayer.module.css";

export function VideoPlayer() {
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const { videoRef, wrapperRef, setShowControls } = usePlayer();
  const { currentVideo } = useVideoStore();

  // Tự động đổi title khi chuyển video
  useDocumentTitle(
    currentVideo ? `▶ ${currentVideo.filename} | FolVid` : "FolVid",
    [currentVideo],
  );

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

  const handleMouseMove = useAutoHideControls({
    delay: 3000,
    onShow: () => setShowControls(true),
    onHide: () => setShowControls(false),
  });
  const handleContextMenu = usePlayerContextMenu();

  return (
    <>
      {currentVideo ? (
        <>
          <div
            ref={wrapperRef}
            className={styles.playerWrapper}
            onMouseMove={handleMouseMove}
            onContextMenu={handleContextMenu}
          >
            <VideoCanvas />

            {isAudioOnly && <AudioVisualizer />}

            {/* Overlay controls */}
            <PlayerControls />
            <FXAnimation />
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <p>👈 Chọn một video từ danh sách bên trái</p>
        </div>
      )}

      <VideoPlayerContextMenu />
    </>
  );
}
