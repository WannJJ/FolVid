import { useEffect } from "react";
import { AppLayout } from "././components/layout";
import "./App.css";
import ResponsiveHandler from "./components/responsive-handler/ResponsiveHandler";
import { MobilePlaylistToggle, PlaylistToggle } from "./features/play-list";
import { UploadModal, UploadModalButton } from "./features/upload";
import { VideoList } from "./features/video-list/";
import { VideoPlayer } from "./features/video-player";
import { PlayerProvider } from "./features/video-player/contexts/PlayerContext";
import { useVideoStore } from "./stores/useVideoStore";

function App() {
  const { videos, initialize, rehydratePlaylist } = useVideoStore();

  useEffect(() => {
    initialize();
  }, []);

  // Re-hydrate playlist từ localStorage
  // Nhờ Zustand persist đã lưu filename[], cần map lại thành video objects
  useEffect(() => {
    rehydratePlaylist();
  }, [videos]);

  return (
    <>
      <ResponsiveHandler />
      <AppLayout
        sidebarContent={
          <>
            <VideoList /> <PlaylistToggle />
            <UploadModalButton />
          </>
        }
        mainContent={
          <>
            <MobilePlaylistToggle />

            <PlayerProvider>
              <VideoPlayer />
            </PlayerProvider>

            {/* Upload Modal */}
            <UploadModal />
          </>
        }
      />
    </>
  );
}

export default App;
