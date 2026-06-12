import { API_BASE_URL } from "@/config/api";
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

    const formData = new FormData();
    formData.append("video", file); // 'video' phải khớp với upload.single('video')

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData, // Không set Content-Type, browser tự set kèm boundary
      });
      const data = await res.json();
      if (res.ok) {
        alert("Upload thành công: " + data.filename);

        await fetchVideoList();
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch (err) {
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
      />
      <label htmlFor="fileInput" className={styles.dropZoneLabel}>
        {isDraggingFile
          ? "Thả file vào đây"
          : "Kéo thả video vào đây, hoặc click để chọn"}
      </label>
    </div>
  );
}
