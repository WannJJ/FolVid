import { useEffect } from "react";
import { AppLayout } from "././components/layout";
import "./App.css";
import { FileUpload } from "./features/upload";
import { VideoList } from "./features/video-list/";
import { VideoPlayer } from "./features/video-player";
import { PlayerProvider } from "./features/video-player/contexts/PlayerContext";
import { useVideoStore } from "./stores/useVideoStore";

function App() {
  const { initialize } = useVideoStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <AppLayout
      sidebarContent={
        <>
          <VideoList /> <FileUpload />
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
