import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { usePlayer } from "../contexts/PlayerContext";
import styles from "./FXAnimation.module.css";

export function FXAnimation() {
  const { fx } = usePlayer();

  const isSeek = fx.type === "forward" || fx.type === "backward";
  const isCenter = fx.type === "play" || fx.type === "pause";

  return (
    <>
      {/* Flash trắng mờ khi tua */}
      {isSeek && (
        <div key={`flash-${fx.trigger}`} className={styles.flashLayer} />
      )}

      <div className={styles.fxOverlay}>
        {/* Backward: hiện bên TRÁI với mũi tên trái */}
        {fx.type === "backward" && (
          <div
            key={`fx-${fx.trigger}`}
            className={`${styles.fxSide} ${styles.fxLeft} ${styles.fxSlideInLeft}`}
          >
            <ChevronLeft size={48} strokeWidth={2.5} />
            <span>5s</span>
          </div>
        )}

        {/* Play / Pause: hiện ở GIỮA */}
        {isCenter && (
          <div
            key={`fx-${fx.trigger}`}
            className={`${styles.fxCenter} ${styles.fxPop}`}
          >
            {fx.type === "play" && <Play size={64} fill="currentColor" />}
            {fx.type === "pause" && <Pause size={64} fill="currentColor" />}
          </div>
        )}

        {/* Forward: hiện bên PHẢI với mũi tên phải */}
        {fx.type === "forward" && (
          <div
            key={`fx-${fx.trigger}`}
            className={`${styles.fxSide} ${styles.fxRight} ${styles.fxSlideInRight}`}
          >
            <span>5s</span>
            <ChevronRight size={48} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </>
  );
}
