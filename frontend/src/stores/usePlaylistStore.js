// src/stores/usePlaylistStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Playlist Store - Quản lý playlist optional (chứa VideoObjects)
 */

// Helper: kiểm tra đã có trong playlist chưa
const isInPlaylistByFilename = (playlist, filename) => {
  return playlist.some((v) => v.filename === filename);
};

const usePlaylistStore = create(
  persist(
    (set, get) => ({
      // === STATE ===
      playlist: null, // null | VideoObject[]
      currentIndex: -1,
      isRepeat: false,
      isShuffle: false,

      // === ACTIONS ===

      createPlaylist: (initialVideos = []) => {
        set({
          playlist: initialVideos,
          currentIndex: initialVideos.length > 0 ? 0 : -1,
        });
      },

      deletePlaylist: () => {
        set({
          playlist: null,
          currentIndex: -1,
          isRepeat: false,
          isShuffle: false,
        });
      },

      addToPlaylist: (videoObj) => {
        const { playlist } = get();
        if (playlist === null) return;
        if (isInPlaylistByFilename(playlist, videoObj.filename)) return;

        const newPlaylist = [...playlist, videoObj];
        set({
          playlist: newPlaylist,
          currentIndex: playlist.length === 0 ? 0 : get().currentIndex,
        });
      },

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
          newIndex =
            currentIndex >= newPlaylist.length
              ? newPlaylist.length - 1
              : currentIndex;
        }

        set({ playlist: newPlaylist, currentIndex: newIndex });
      },

      reorderPlaylist: (fromIndex, toIndex) => {
        const { playlist, currentIndex } = get();
        if (playlist === null) return;

        const newPlaylist = [...playlist];
        const [removed] = newPlaylist.splice(fromIndex, 1);
        newPlaylist.splice(toIndex, 0, removed);

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

      playAtIndex: (index) => {
        const { playlist } = get();
        if (playlist === null) return;
        if (index >= 0 && index < playlist.length) {
          set({ currentIndex: index });
        }
      },

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
      },

      playPrevious: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 });
        }
      },

      toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),
      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

      isInPlaylist: (filename) => {
        const { playlist } = get();
        return playlist !== null && isInPlaylistByFilename(playlist, filename);
      },

      getCurrentVideo: () => {
        const { playlist, currentIndex } = get();
        if (playlist === null || currentIndex < 0) return null;
        return playlist[currentIndex] ?? null;
      },
    }),
    {
      name: "folvid-playlist",
      partialize: (state) => ({
        // Persist chỉ filename để tránh lưu object quá lớn (thumb, storyboard)
        // Khi reload, cần re-hydrate từ allVideos
        playlist: state.playlist ? state.playlist.map((v) => v.filename) : null,
        isRepeat: state.isRepeat,
        isShuffle: state.isShuffle,
      }),
    },
  ),
);

export default usePlaylistStore;
