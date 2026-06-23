import { videoApi } from "@/services/videoApi";
import { useVideoStore } from "@/stores/useVideoStore";
import { useState } from "react";
import styles from "./FileUpload.module.css";
export function FileUpload() {
  const { fetchVideoList } = useVideoStore();
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleDropFile = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };
  const handleDragOver = (e) => {
    e.preventDefault(); // Quan trọng: nếu không có dòng này, trình duyệt sẽ mở file thay vì drop
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };
  // Hàm gọi API upload
  const uploadFile = async (file) => {
    // Kiểm tra đuôi file có hợp lệ không
    const validExts = [".mp4", ".mp3", ".webm", ".ogg", ".mov"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExts.includes(ext)) {
      alert("Chỉ chấp nhận file .mp4, .webm, .ogg, .mov");
      return;
    }

    try {
      const data = await videoApi.upload(file);
      alert("Upload thành công: " + data.filename);

      await fetchVideoList();
    } catch (err) {
      alert("Lỗi! Upload thất bại");
      console.error(err);
    }
  };
  // Xử lý khi chọn file qua input
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      onDrop={handleDropFile}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`${styles.dropZone} ${isDraggingFile ? styles.dropZoneDragging : ""}`}
    >
      <input
        type="file"
        accept="video/*"
        style={{ display: " ne" }}
        id="fileInput"
        onChange={handleFileSelect}
        className={styles.fileInput}
      />
      <label htmlFor="fileInput" className={styles.dropZoneLabel}>
        {isDraggingFile
          ? "Thả file vào đây"
          : "Kéo thả video vào đây, hoặc click để chọn"}
      </label>
    </div>
  );
}
