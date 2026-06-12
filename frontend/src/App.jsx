import { useEffect } from "react";
import "./App.css";
import SideBar from "./components/layout/Sidebar/SideBar";
import { HamburgerButton } from "./components/ui";
import { FileUpload } from "./features/upload";
import { VideoDetailsModal } from "./features/video-actions";
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
    <div className="app-container">
      <SideBar>
        <VideoList />
        <FileUpload />
      </SideBar>

      {/* Main Area */}
      <main className="main-area">
        <HamburgerButton />
        <PlayerProvider>
          <VideoPlayer />
        </PlayerProvider>
      </main>

      <VideoDetailsModal />
    </div>
  );
}

export default App;
