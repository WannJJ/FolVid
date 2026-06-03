// src/stores/useVideoStore.js
import { API_BASE_URL } from "@/config/api";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * @typedef {Object} VideoFilters
 * @property {string} genre
 * @property {string} artist
 * @property {string} minDuration
 * @property {string} maxDuration
 * @property {string} resolution
 */

const defaultFilters = {
  genre: "",
  artist: "",
  minDuration: "",
  maxDuration: "",
  resolution: "",
};

export const useVideoStore = create(
  devtools(
    (set, get) => ({
      /* =========================================
         STATE
         ========================================= */
      videos: [], // string[] — danh sách tên file
      currentVideo: null, // string | null — tên file đang phát
      search: "", // string — từ khóa tìm kiếm
      filters: { ...defaultFilters },
      isLoading: false, // boolean — đang fetch danh sách
      error: null, // string | null — lỗi nếu có

      /* =========================================
         COMPUTED (gọi trực tiếp, không phải state)
         ========================================= */
      getFilteredVideos: () => {
        const { videos, search, filters } = get();

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
          const matchArtist =
            !filters.artist || v.custom.artist === filters.artist;
          const matchRes =
            !filters.resolution ||
            `${v.width}x${v.height}` === filters.resolution;

          // 3. Filter duration (đổi phút -> giây để so sánh)
          const min = filters.minDuration
            ? parseInt(filters.minDuration) * 60
            : 0;
          const max = filters.maxDuration
            ? parseInt(filters.maxDuration) * 60
            : Infinity;
          const dur = v.duration || 0;
          const matchDuration = dur >= min && dur <= max;

          return (
            matchSearch &&
            matchGenre &&
            matchArtist &&
            matchRes &&
            matchDuration
          );
        });
      },

      /* =========================================
         ACTIONS
         ========================================= */

      /** Lấy danh sách video từ backend */
      fetchVideos: async () => {
        set({ isLoading: true, error: null }, false, "videos/fetchStart");

        try {
          const res = await fetch(`${API_BASE_URL}/api/videos`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json(); // string[]

          set({ videos: data, isLoading: false }, false, "videos/fetchSuccess");

          // Tự động chọn video đầu tiên nếu chưa có video nào đang phát
          const { currentVideo } = get();
          if (!currentVideo && data.length > 0) {
            set({ currentVideo: data[0] }, false, "videos/autoSelect");
          }
        } catch (err) {
          set(
            { error: err.message, isLoading: false },
            false,
            "videos/fetchError",
          );
        }
      },

      /** Chọn video để phát */
      setCurrentVideo: (filename) => {
        set({ currentVideo: filename }, false, "player/setCurrentVideo");
      },

      /** Cập nhật ô tìm kiếm */
      setSearch: (query) => {
        set({ search: query }, false, "filters/setSearch");
      },

      /** Cập nhật 1 hoặc nhiều filter (merge, không replace toàn bộ) */
      setFilters: (partialFilters) => {
        set(
          (state) => ({
            filters: { ...state.filters, ...partialFilters },
          }),
          false,
          "filters/setFilters",
        );
      },

      /** Xóa search */
      clearSearch: () => {
        set({ search: "" }, false, "filters/clearSearch");
      },

      /** Reset toàn bộ filter về mặc định */
      resetFilters: () => {
        set({ filters: { ...defaultFilters } }, false, "filters/reset");
      },

      /** Đổi tên file — đồng bộ cả videos[] và currentVideo */
      renameVideo: async (oldName, newName) => {
        // Optimistic update: cập nhật UI ngay trước khi API phản hồi
        const prevVideos = get().videos;
        const prevCurrent = get().currentVideo;

        const updatedVideos = prevVideos.map((v) =>
          v === oldName ? newName : v,
        );

        set(
          {
            videos: updatedVideos,
            currentVideo: prevCurrent === oldName ? newName : prevCurrent,
          },
          false,
          "videos/renameOptimistic",
        );

        try {
          const res = await fetch(`${API_BASE_URL}/api/videos/rename`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldName, newName }),
          });

          if (!res.ok) throw new Error("Rename failed");

          // Thành công — giữ nguyên state optimistic
          set({ error: null }, false, "videos/renameSuccess");
        } catch (err) {
          // Rollback nếu lỗi
          set(
            {
              videos: prevVideos,
              currentVideo: prevCurrent,
              error: err.message,
            },
            false,
            "videos/renameRollback",
          );
        }
      },

      /** Xóa video — nếu đang phát video này thì chuyển sang video khác */
      deleteVideo: async (filename) => {
        const { videos, currentVideo } = get();

        try {
          const res = await fetch(
            `${API_BASE_URL}/api/videos/${encodeURIComponent(filename)}`,
            { method: "DELETE" },
          );
          if (!res.ok) throw new Error("Delete failed");

          const nextVideos = videos.filter((v) => v !== filename);

          let nextCurrent = currentVideo;
          if (currentVideo === filename) {
            const idx = videos.indexOf(filename);
            nextCurrent = nextVideos[idx] ?? nextVideos[idx - 1] ?? null;
          }

          set(
            { videos: nextVideos, currentVideo: nextCurrent, error: null },
            false,
            "videos/deleteSuccess",
          );
        } catch (err) {
          set({ error: err.message }, false, "videos/deleteError");
        }
      },
    }),
    { name: "VideoStore" }, // tên hiển thị trên Redux DevTools
  ),
);
