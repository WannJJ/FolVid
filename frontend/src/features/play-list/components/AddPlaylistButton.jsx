import usePlaylistStore from "@/stores/usePlaylistStore";
import styles from "./PlaylistPanel.module.css";

export function AddPlaylistButton({ v }) {
  const { playlist, isInPlaylist } = usePlaylistStore();
  const inPlaylist = isInPlaylist(v.filename);

  return (
    <>
      {playlist !== null && (
        <button
          className={`${styles.btnAddPlaylist} ${inPlaylist ? styles.added : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!inPlaylist) {
              // addToPlaylist nhận videoObj
              usePlaylistStore.getState().addToPlaylist(v);
            }
          }}
          disabled={inPlaylist}
        >
          {inPlaylist ? "✓" : "+"}
        </button>
      )}
    </>
  );
}
