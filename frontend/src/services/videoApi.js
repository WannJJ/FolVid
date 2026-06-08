import { API_BASE_URL } from "../config/api.js";
const validExts = [".mp4", ".mp3", ".webm", ".ogg", ".mov"];

export const videoApi = {
  getList: async () => {
    const res = await fetch(`${API_BASE_URL}/api/videos`);
    if (!res.ok) throw new Error("Không tải được danh sách");
    return res.json(); // Chỉ trả data, không setState
  },

  rename: async (oldName, newName) => {
    const res = await fetch(
      `${API_BASE_URL}/api/videos/${encodeURIComponent(oldName)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: newName }),
      },
    );
    if (!res.ok) {
      throw new Error("Lỗi không rename được video");
    }
    return res;
  },
  upload: async (file) => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExts.includes(ext)) {
      alert("Chỉ chấp nhận file .mp4, .webm, .ogg, .mov");
      return;
    }

    const formData = new FormData();
    formData.append("video", file); // 'video' phải khớp với upload.single('video')

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData, // Không set Content-Type, browser tự set kèm boundary
    });
    if (!res.ok) throw new Error("Lỗi upload file");
    const data = await res.json();
    return data;
  },
};
