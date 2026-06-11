import { useEffect, useRef, useState } from "react";
import "./App.css";
import SideBar from "./components/layout/Sidebar/SideBar";
import { API_BASE_URL } from "./config/api.js";
import { FileUpload } from "./features/upload";
import { VideoDetailsModal } from "./features/video-actions";
import { VideoList } from "./features/video-list/";
import { VideoPlayer } from "./features/video-player";
import { useUIStore } from "./stores/useUIStore";
function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [pendingRestore, setPendingRestore] = useState(null);
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const videoRef = useRef(null);

  // Tự động đổi title khi chuyển video
  useEffect(() => {
    if (currentVideo) {
      document.title = `▶ ${currentVideo.filename} | FolVid`;
    } else {
      document.title = "FolVid";
    }
  }, [currentVideo]);

  const fetchVideoList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos`);
      const data = await res.json();
      setVideos(data);

      return data;
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    }
  };
  useEffect(() => {
    fetchVideoList()
      .then((data) => {
        if (data.length > 0) {
          setCurrentVideo(data[0]);
        }
      })
      .catch((err) => console.error("Lỗi tải danh sách video:", err));
  }, []);

  useEffect(() => {
    if (videos.length === 0) return; // Chờ API trả về danh sách trước

    const params = new URLSearchParams(window.location.search);
    const requestedFileName = params.get("v");

    // Case 1: Có ?v=... trong URL (tab mới được chỉ định mở video cụ thể)

    const requestedVideo = videos.find((e) => e.filename === requestedFileName);
    if (requestedVideo) {
      setCurrentVideo(requestedVideo);

      // Kiểm tra xem localStorage có đang lưu chính video này không
      // Nếu có thì restore luôn state
      const raw = localStorage.getItem("folvid_player_state");
      if (raw) {
        const state = JSON.parse(raw);
        setPendingRestore(state);
      }
      return;
    }

    // // Case 2: URL trắng - Restore thông tin từ localStorage
    const raw = localStorage.getItem("folvid_player_state");
    if (!raw) return;

    const state = JSON.parse(raw);
    // Kiểm tra xem file có còn trong danh sách không

    if (
      state.currentVideo &&
      videos.some((e) => e.filename && e.filename === state.filename)
    ) {
      setCurrentVideo(state.currentVideo);
      // Lưu state tạm vào ref hoặc state để gán sau khi video load
      setPendingRestore(state);
    }
  }, [videos]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <SideBar>
        <VideoList
          videos={videos}
          currentVideo={currentVideo}
          setCurrentVideo={setCurrentVideo}
          fetchVideoList={fetchVideoList}
        />
        <FileUpload fetchVideoList={fetchVideoList} />
      </SideBar>

      {/* Main Area */}
      <main className="main-area">
        {/* Nút hamburger chỉ hiện trên mobile */}
        <button
          className="menu-toggle"
          onClick={toggleSidebar}
          aria-label="Mở/đóng danh sách video"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>

        <VideoPlayer
          currentVideo={currentVideo}
          videoRef={videoRef}
          pendingRestore={pendingRestore}
          setPendingRestore={setPendingRestore}
        />
      </main>

      <VideoDetailsModal />
    </div>
  );
}

export default App;
