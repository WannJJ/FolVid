import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Playlist Store - Quản lý playlist optional
 *
 * Logic:
 * - playlist: null | string[]  (null = chưa tạo playlist, [] = đã tạo nhưng trống)
 * - currentIndex: index video đang phát trong playlist
 * - isRepeat, isShuffle: cấu hình phát
 *
 * Khi playlist === null: feature playlist ẩn hoàn toàn, user click video bất kỳ để phát
 * Khi playlist !== null: feature playlist hiện, video phải nằm trong playlist
 */

const usePlaylistStore = create(
  persist(
    (set, get) => ({
      // === STATE ===
      playlist: null, // null = chưa tạo | string[] = đã tạo
      currentIndex: -1, // index trong playlist đang phát
      isRepeat: false,
      isShuffle: false,

      // === ACTIONS ===

      /**
       * Tạo playlist mới (từ trống hoặc từ video hiện tại)
       */
      createPlaylist: (initialVideos = []) => {
        set({
          playlist: initialVideos,
          currentIndex: initialVideos.length > 0 ? 0 : -1,
        });
      },

      /**
       * Xóa playlist hoàn toàn (về null)
       */
      deletePlaylist: () => {
        set({
          playlist: null,
          currentIndex: -1,
          isRepeat: false,
          isShuffle: false,
        });
      },

      /**
       * Thêm video vào playlist (nếu chưa có)
       */
      addToPlaylist: (videoName) => {
        const { playlist } = get();
        if (playlist === null) return; // Không có playlist thì không thêm được
        if (playlist.includes(videoName)) return;

        const newPlaylist = [...playlist, videoName];
        set({
          playlist: newPlaylist,
          // Nếu playlist trống trước đó, tự động phát video đầu tiên
          currentIndex: playlist.length === 0 ? 0 : get().currentIndex,
        });
      },

      /**
       * Xóa video khỏi playlist
       */
      removeFromPlaylist: (index) => {
        const { playlist, currentIndex } = get();
        if (playlist === null) return;

        const newPlaylist = playlist.filter((_, i) => i !== index);
        let newIndex = currentIndex;

        if (newPlaylist.length === 0) {
          newIndex = -1;
        } else if (index < currentIndex) {
          newIndex = currentIndex - 1;
        } else if (index === currentIndex) {
          // Đang xóa video đang phát
          newIndex =
            currentIndex >= newPlaylist.length
              ? newPlaylist.length - 1
              : currentIndex;
        }

        set({ playlist: newPlaylist, currentIndex: newIndex });
      },

      /**
       * Đổi chỗ 2 video (drag & drop)
       */
      reorderPlaylist: (fromIndex, toIndex) => {
        const { playlist, currentIndex } = get();
        if (playlist === null) return;

        const newPlaylist = [...playlist];
        const [removed] = newPlaylist.splice(fromIndex, 1);
        newPlaylist.splice(toIndex, 0, removed);

        // Cập nhật currentIndex nếu bị ảnh hưởng
        let newCurrentIndex = currentIndex;
        if (fromIndex === currentIndex) {
          newCurrentIndex = toIndex;
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
          newCurrentIndex = currentIndex - 1;
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
          newCurrentIndex = currentIndex + 1;
        }

        set({ playlist: newPlaylist, currentIndex: newCurrentIndex });
      },

      /**
       * Chuyển đến video ở index cụ thể
       */
      playAtIndex: (index) => {
        const { playlist } = get();
        if (playlist === null) return;
        if (index >= 0 && index < playlist.length) {
          set({ currentIndex: index });
        }
      },

      /**
       * Phát video tiếp theo
       */
      playNext: () => {
        const { playlist, currentIndex, isShuffle, isRepeat } = get();
        if (playlist === null || playlist.length === 0) return;

        if (isShuffle) {
          const randomIndex = Math.floor(Math.random() * playlist.length);
          set({ currentIndex: randomIndex });
          return;
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < playlist.length) {
          set({ currentIndex: nextIndex });
        } else if (isRepeat) {
          set({ currentIndex: 0 });
        }
        // Nếu hết playlist và không repeat → dừng (không đổi index)
      },

      /**
       * Phát video trước đó
       */
      playPrevious: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 });
        }
      },

      /**
       * Toggle repeat/shuffle
       */
      toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),
      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

      /**
       * Kiểm tra video có trong playlist không
       */
      isInPlaylist: (videoName) => {
        const { playlist } = get();
        return playlist !== null && playlist.includes(videoName);
      },

      /**
       * Lấy video đang phát trong playlist
       */
      getCurrentVideo: () => {
        const { playlist, currentIndex } = get();
        if (playlist === null || currentIndex < 0) return null;
        return playlist[currentIndex] ?? null;
      },
    }),
    {
      name: "folvid-playlist", // localStorage key
      partialize: (state) => ({
        playlist: state.playlist,
        isRepeat: state.isRepeat,
        isShuffle: state.isShuffle,
        // KHÔNG lưu currentIndex (reset về 0 khi reload cho đơn giản)
      }),
    },
  ),
);

export default usePlaylistStore;
