import { usePlayer } from "../contexts/PlayerContext";
import styles from "./FXAnimation.module.css";

export function FXAnimation() {
  const { fx } = usePlayer();

  return (
    <>
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
    </>
  );
}
