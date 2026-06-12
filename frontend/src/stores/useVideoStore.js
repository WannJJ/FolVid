// src/stores/useVideoStore.js
import { videoApi } from "@/services/videoApi";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useVideoStore = create(
  devtools(
    (set, get) => ({
      /* =========================================
         STATE
         ========================================= */
      videos: [], // string[] — danh sách tên file
      currentVideo: null, // string | null — tên file đang phát
      pendingRestore: null, // Object {playbackRate, volume, loop} | null - state đọc từ localStorage
      isLoading: false, // boolean — đang fetch danh sách
      error: null, // string | null — lỗi nếu có

      /* =========================================
         ACTIONS
         ========================================= */

      setVideos: (videos) => {
        set({ videos: videos }, false, "player/setVideos");
      },

      /** Lấy danh sách video từ backend */
      fetchVideoList: async () => {
        set({ isLoading: true, error: null }, false, "videos/fetchStart");

        try {
          const data = await videoApi.getList();

          set({ videos: data, isLoading: false }, false, "videos/fetchSuccess");
          return data;
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

      /** Setter cho pendingRestore */
      setPendingRestore: (state) => {
        set({ pendingRestore: state }, false, "player/setPendingRestore");
      },

      /** Gọi một lần lúc app mởi khởi tạo, dùng để fetchVideoList
       *  và quyết định video bật video nào đầu tiên */
      initialize: async () => {
        // Bước 1: Fetch danh sách
        const list = await get().fetchVideoList(false);

        // Bước 2: Quyết định video nào được chọn
        // Case 1: Có ?v=... trong URL (tab mới được chỉ định mở video cụ thể)
        const params = new URLSearchParams(window.location.search);
        const requestedVideoName = params.get("v");
        const requestedVideoByParam = list.find(
          (e) => e.filename === requestedVideoName,
        );
        const savedRaw = localStorage.getItem("folvid_player_state");
        const savedState = savedRaw ? JSON.parse(savedRaw) : null;
        const savedVideo =
          savedState &&
          savedState.currentVideo &&
          list.some((e) => e.filename === savedState.filename)
            ? savedState.currentVideo
            : (list[0] ?? null);

        if (requestedVideoByParam) {
          // Case 1: Có ?v=... trong URL (tab mới được chỉ định mở video cụ thể)

          // Kiểm tra xem localStorage có đang lưu chính video này không
          // Nếu có thì restore luôn state
          const pendingRestore = savedState ? savedState : null;

          set({
            currentVideo: requestedVideoByParam,
            pendingRestore: pendingRestore,
            isLoading: false,
          });
        } else {
          // // Case 2: URL trắng - Restore thông tin từ localStorage
          set({
            currentVideo: savedVideo,
            pendingRestore: savedState,
            isLoading: false,
          });
        }
      },
    }),
    { name: "VideoStore" }, // tên hiển thị trên Redux DevTools
  ),
);
