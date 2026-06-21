// src/stores/useVideoStore.js
import { videoApi } from "@/services/videoApi";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import usePlaylistStore from "./usePlaylistStore";

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
      useHLS: true, //boolean - hỗ trợ play video bằng hls
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
      setCurrentVideo: (videoObj) => {
        set({ currentVideo: videoObj }, false, "player/setCurrentVideo");
      },

      /** Setter cho pendingRestore */
      setPendingRestore: (state) => {
        set({ pendingRestore: state }, false, "player/setPendingRestore");
      },

      /** Setter cho useHLS */
      setUseHLS: (useHLS = true) => {
        set({ useHLS: useHLS }, false, "player/setUseHLS");
      },

      /**
       * Phát một video (entry point chính)
       *
       * - Nếu KHÔNG có playlist: phát trực tiếp video đó
       * - Nếu CÓ playlist: thêm video vào playlist rồi phát từ playlist
       */
      playVideo: (videoObj) => {
        const playlist = usePlaylistStore.getState().playlist;

        if (playlist === null) {
          // Không có playlist → phát trực tiếp
          set({ currentVideo: videoObj });
        } else {
          // Có playlist → thêm vào playlist rồi phát
          const { addToPlaylist, playAtIndex } = usePlaylistStore.getState();
          addToPlaylist(videoObj);

          // Lấy playlist sau khi thêm (zustand đã update)
          const updatedPlaylist = usePlaylistStore.getState().playlist;
          const index = updatedPlaylist.findIndex(
            (v) => v.filename === videoObj.filename,
          );
          if (index !== -1) {
            playAtIndex(index);
          }
        }
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

      /** Re-hydrate playlist từ localStorage
       *  Nhờ Zustand persist đã lưu filename[], cần map lại thành video objects */
      rehydratePlaylist: () => {
        const videos = get().videos;
        if (videos.length === 0) return;

        const stored = localStorage.getItem("folvid-playlist");
        if (!stored) return;

        try {
          const parsed = JSON.parse(stored);
          if (!parsed.state?.playlist || !Array.isArray(parsed.state.playlist))
            return;

          const hydratedPlaylist = parsed.state.playlist
            .map((filename) => videos.find((v) => v.filename === filename))
            .filter(Boolean);

          if (hydratedPlaylist.length > 0) {
            usePlaylistStore.setState({
              playlist: hydratedPlaylist,
              currentIndex: 0,
              isRepeat: parsed.state.isRepeat ?? false,
              isShuffle: parsed.state.isShuffle ?? false,
            });
          }
        } catch (e) {
          console.error("Re-hydrate playlist failed:", e);
        }
      },

      /** Clear */
      clearCurrentVideo: () => set({ currentVideo: null }),
    }),
    { name: "VideoStore" }, // tên hiển thị trên Redux DevTools
  ),
);
