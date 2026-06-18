import { useEffect } from "react";
import { AppLayout } from "././components/layout";
import "./App.css";
import ResponsiveHandler from "./components/responsive-handler/ResponsiveHandler";
import { PlaylistToggle } from "./features/play-list";
import { FileUpload } from "./features/upload";
import { VideoList } from "./features/video-list/";
import { VideoPlayer } from "./features/video-player";
import { PlayerProvider } from "./features/video-player/contexts/PlayerContext";
import usePlaylistStore from "./stores/usePlaylistStore";
import { useUIStore } from "./stores/useUIStore";
import { useVideoStore } from "./stores/useVideoStore";

function App() {
  const { initialize } = useVideoStore();
  const { playlist } = usePlaylistStore();
  const isMobile = useUIStore((state) => state.isMobile);

  //TODO: Re-hydrate playlist từ localStorage, DÙNG useEffect

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <ResponsiveHandler />
      <AppLayout
        sidebarContent={
          <>
            <VideoList /> <FileUpload /> <PlaylistToggle />
          </>
        }
        mainContent={
          <>
            {/* Mobile: nút toggle playlist nổi */}
            {isMobile && playlist !== null && <MobilePlaylistToggle />}
            <PlayerProvider>
              <VideoPlayer />
            </PlayerProvider>
          </>
        }
      />
    </>
  );
}

// Nút toggle playlist cho mobile (nổi trên video)
function MobilePlaylistToggle() {
  const togglePlaylist = useUIStore((state) => state.togglePlaylist);
  const playlistLength = usePlaylistStore(
    (state) => state.playlist?.length ?? 0,
  );

  return (
    <button className="mobile-playlist-toggle" onClick={togglePlaylist}>
      📋 {playlistLength}
    </button>
  );
}

export default App;
