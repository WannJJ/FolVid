import { VideoPlayerContextMenu } from "@/features/video-actions";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import { AudioVisualizer } from "./AudioVisualizer";
import { FXAnimation } from "./FXAnimation";
import { PlayerControls } from "./PlayerControls";
import { VideoCanvas } from "./VideoCanvas";
import styles from "./VideoPlayer.module.css";

export function VideoPlayer() {
  const controlsTimeoutRef = useRef(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const { videoRef, wrapperRef, setShowControls } = usePlayer();
  const { currentVideo } = useVideoStore();
  const { openContextMenu } = useUIStore();

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

      {/* Custom Context Menu */}
      <VideoPlayerContextMenu />
    </>
  );
}
