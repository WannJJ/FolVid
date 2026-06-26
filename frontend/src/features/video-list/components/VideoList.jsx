import { VideoListContextMenu } from "@/features/video-actions/";
import { useVideoStore } from "@/stores/useVideoStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useVideoFilters } from "../hooks/useVideoFilters";
import { FilterPanel } from "./FilterPanel";
import { HLSToggle } from "./HLSToggle";
import { SearchBar } from "./SearchBar";
import styles from "./VideoList.module.css";
import { VideoListItem } from "./VideoListItem";

export function VideoList() {
  const { t } = useTranslation();
  const { videos } = useVideoStore();
  const { search, setSearch, filters, setFilters, filteredVideos } =
    useVideoFilters(videos);

  const [editingName, setEditingName] = useState(null); // Tên file đang được sửa
  const [tempName, setTempName] = useState(""); // Giá trị tạm trong input

  // Thay đổi file name
  const startRename = (filename) => {
    setEditingName(filename);
    setTempName(filename);
  };

  return (
    <>
      <h2> {t("videoList.header")}</h2>
      <p className={styles.count}>
        {filteredVideos.length} /{" "}
        {t("app.videoCount", { count: videos.length })}
      </p>

      <HLSToggle />

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
