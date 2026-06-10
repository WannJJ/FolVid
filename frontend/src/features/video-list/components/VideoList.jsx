import { VideoListContextMenu } from "@/features/video-actions/";
import { useUIStore } from "@/stores/useUIStore";
import { useMemo, useState } from "react";
import { FilterPanel } from "./FilterPanel";
import { SearchBar } from "./SearchBar";
import styles from "./VideoList.module.css";
import { VideoListItem } from "./VideoListItem";

export function VideoList({
  videos,
  currentVideo,
  setCurrentVideo,
  fetchVideoList,
}) {
  const { openDetailsModal, setSidebarOpen } = useUIStore();
  const [editingName, setEditingName] = useState(null); // Tên file đang được sửa
  const [tempName, setTempName] = useState(""); // Giá trị tạm trong input
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    genre: "",
    artist: "",
    minDuration: "",
    maxDuration: "",
    resolution: "",
  });
  // Tạo list filtered Videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      // 1. Search theo tên, title, artist
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        v.filename.toLowerCase().includes(q) ||
        (v.filename && v.filename.toLowerCase().includes(q)) ||
        (v.custom.artist && v.custom.artist.toLowerCase().includes(q));

      // 2. Filter dropdown
      const matchGenre = !filters.genre || v.custom.genre === filters.genre;
      const matchArtist = !filters.artist || v.custom.artist === filters.artist;
      const matchRes =
        !filters.resolution || `${v.width}x${v.height}` === filters.resolution;

      // 3. Filter duration (đổi phút -> giây để so sánh)
      const min = filters.minDuration ? parseInt(filters.minDuration) * 60 : 0;
      const max = filters.maxDuration
        ? parseInt(filters.maxDuration) * 60
        : Infinity;
      const dur = v.duration || 0;
      const matchDuration = dur >= min && dur <= max;

      return (
        matchSearch && matchGenre && matchArtist && matchRes && matchDuration
      );
    });
  }, [videos, search, filters]);

  // Thay đổi file name
  const startRename = (filename) => {
    setEditingName(filename);
    setTempName(filename);
  };

  return (
    <>
      <h2>📁 FolVid</h2>
      <p className={styles.count}>{videos.length} video trong thư mục</p>

      <SearchBar search={search} setSearch={setSearch} />

      {/* ===== FILTER PANEL (Accordion) ===== */}
      <FilterPanel
        videos={videos}
        setFilters={setFilters}
        filters={filters}
        setSearch={setSearch}
      />

      {/* ===== DANH SÁCH VIDEO ===== */}
      <p style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "12px" }}>
        {filteredVideos.length} / {videos.length} video
      </p>
      <ul className={styles.videoList}>
        {filteredVideos.map((v) => (
          <VideoListItem
            key={v.filename}
            v={v}
            currentVideo={currentVideo}
            setCurrentVideo={setCurrentVideo}
            editingName={editingName}
            setEditingName={setEditingName}
            tempName={tempName}
            setTempName={setTempName}
            fetchVideoList={fetchVideoList}
            setSidebarOpen={setSidebarOpen}
          />
        ))}
      </ul>

      {/* ===== CONTEXT MENU ===== */}
      <VideoListContextMenu
        setCurrentVideo={setCurrentVideo}
        startRename={startRename}
        openDetailsModal={openDetailsModal}
      />
    </>
  );
}
