import { API_BASE_URL } from "../config/api.js";
const validExts = [".mp4", ".mp3", ".webm", ".ogg", ".mov"];

export const videoApi = {
  // SOURCES (Video, Thumbnail, Hls...)
  getVideoSrc: (filename) =>
    `${API_BASE_URL}/videos/${encodeURIComponent(filename)}`,
  getThumbnailSrc: (thumbLink) => `${API_BASE_URL}${thumbLink}`,
  getHlsSrc: (filename) => {
    const baseName = filename.replace(/\.[^/.]+$/, "");
    return `${API_BASE_URL}/hls/${encodeURIComponent(baseName)}/index.m3u8`;
  },
  getStoryboardSpriteSrc: (link) => `${API_BASE_URL}${link}`,

  // ACTIONS
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
      const text = await res.text();
      const message = text ? JSON.parse(text)?.error || text : res.statusText;
      throw new Error(message);
    }
    return res;
  },

  // Upload video and metadata
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
    if (!res.ok) {
      const text = await res.text();
      const message = text ? JSON.parse(text)?.error || text : res.statusText;
      throw new Error(message);
    }
    const data = await res.json();
    return data;
  },
  createMetadata: async (metadata) => {
    const metaRes = await fetch(`${API_BASE_URL}/api/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });

    if (!metaRes.ok) throw new Error("Lưu metadata thất bại");
  },

  getStorboardData: async (videoName) => {
    const baseName = videoName.replace(/\.[^/.]+$/, "");
    const res = await fetch(
      `${API_BASE_URL}/cache/storyboard/${baseName}.storyboard.json`,
    );
    if (!res.ok) throw new Error("Không tải được Storyboard");
    return res.json();
  },
};
