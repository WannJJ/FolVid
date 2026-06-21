import { VideoListContextMenu } from "@/features/video-actions/";
import { useVideoStore } from "@/stores/useVideoStore";
import { useMemo, useState } from "react";
import { FilterPanel } from "./FilterPanel";
import { SearchBar } from "./SearchBar";
import styles from "./VideoList.module.css";
import { VideoListItem } from "./VideoListItem";

export function VideoList() {
  const { videos, useHLS, setUseHLS } = useVideoStore();
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
      <p className={styles.count}>
        {filteredVideos.length} / {videos.length} video trong thư mục
      </p>

      {/* ===== TOGGLE HLS VỚI CSS MODULE ===== */}
      <div className={styles.toggleWrapper}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={useHLS}
            onChange={(e) => setUseHLS(e.target.checked)}
          />
          <span>
            {useHLS ? "🔴 Đang dùng HLS Streaming" : "⭕ Phát file trực tiếp"}
          </span>
        </label>

        <div className={styles.tooltip}>
          {useHLS
            ? "Video được cắt thành đoạn nhỏ (10s). Trình duyệt chỉ tải đoạn đang xem, tua nhanh, tiết kiệm băng thông. Nên dùng cho video dài."
            : "Tải toàn bộ file video về trình duyệt. Phù hợp video ngắn (< 2 phút) vì khởi động nhanh, không cần xử lý đoạn nhỏ."}
        </div>
      </div>

      <SearchBar search={search} setSearch={setSearch} />

      {/* ===== FILTER PANEL (Accordion) ===== */}
      <FilterPanel
        setFilters={setFilters}
        filters={filters}
        setSearch={setSearch}
      />

      {/* ===== DANH SÁCH VIDEO ===== */}
      <ul className={styles.videoList}>
        {filteredVideos.map((v) => (
          <VideoListItem
            key={v.filename}
            v={v}
            editingName={editingName}
            setEditingName={setEditingName}
            tempName={tempName}
            setTempName={setTempName}
          />
        ))}
      </ul>

      {/* ===== CONTEXT MENU ===== */}
      <VideoListContextMenu startRename={startRename} />
    </>
  );
}
