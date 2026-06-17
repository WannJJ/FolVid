import { useEffect } from "react";
import { AppLayout } from "././components/layout";
import "./App.css";
import { PlaylistToggle } from "./features/play-list";
import { FileUpload } from "./features/upload";
import { VideoList } from "./features/video-list/";
import { VideoPlayer } from "./features/video-player";
import { PlayerProvider } from "./features/video-player/contexts/PlayerContext";
import { useVideoStore } from "./stores/useVideoStore";

function App() {
  const { initialize } = useVideoStore();
  // CHẾ ĐỘ PLAYLIST (optional)

  useEffect(() => {
    initialize();
  }, []);

  return (
    <AppLayout
      sidebarContent={
        <>
          <VideoList /> <FileUpload /> <PlaylistToggle />
        </>
      }
      mainContent={
        <>
          <PlayerProvider>
            <VideoPlayer />
          </PlayerProvider>
        </>
      }
    />
  );
}

export default App;
