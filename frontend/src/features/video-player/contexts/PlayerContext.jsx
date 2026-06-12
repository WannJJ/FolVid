import { createContext, useContext } from "react";
import { useVideoPlayer } from "../hooks/useVideoPlayer";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  // Gọi brain ở đây, 1 lần duy nhất
  // Chứa tất cả states, refs, actions, getters
  const player = useVideoPlayer();

  return (
    <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
