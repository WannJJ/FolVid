import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [latestVolume, setLatestVolume] = useState(1);
  const [isLoop, setIsLoop] = useState(false);

  // ─── Actions ───
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const v = volume === 0 ? latestVolume : 0;
    videoRef.current.volume = v;
    setVolume(v);
  }, [volume, latestVolume]);

  const toggleLoop = useCallback(() => {
    if (!videoRef.current) return;
    const next = !isLoop;
    videoRef.current.loop = next; // HTML5 Video API
    setIsLoop(next);
  }, [isLoop]);

  const setVolumeLevel = useCallback((val) => {
    if (!videoRef.current) return;
    videoRef.current.volume = val;
    setVolume(val);
  }, []);

  // ─── Value object ───
  const value = {
    videoRef,
    isPlaying,
    volume,
    isLoop,
    setIsPlaying,
    togglePlay,
    toggleMute,
    setLatestVolume,
    toggleLoop,
    setVolumeLevel,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
