import { formatSize } from "@/utils/formatSize";
import { formatTime } from "@/utils/formatTime";
import { create } from "zustand";

export const useUIStore = create((set) => ({
  // ── State ban đầu ──
  sidebarOpen: true,
  isPlaylistOpen: true,
  isMobile: false,

  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    type: null, // 'listItem' | 'player'
    target: null, // tên file video hoặc null
  },

  detailsModal: {
    open: false,
    filename: "",
    details: null,
  },

  isDraggingFile: false,

  // ── Actions ──

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Context Menu
  openContextMenu: ({ x, y, type, target }) =>
    set({
      contextMenu: { visible: true, x, y, type, target },
    }),

  closeContextMenu: () =>
    set((state) => ({
      contextMenu: { ...state.contextMenu, visible: false },
    })),

  // Details Modal
  openDetailsModal: (v) =>
    set({
      detailsModal: {
        open: true,
        filename: v.filename,
        details: {
          height: v.height,
          width: v.width,
          size: formatSize(v.size),
          duration: formatTime(v.duration),
          artist: v.custom.artist,
          author: v.custom.author,
          genre: v.custom.genre,
        },
      },
    }),

  closeDetailsModal: () =>
    set({
      detailsModal: { open: false, filename: "", details: null },
    }),

  // Drag & Drop
  setDraggingFile: (isDragging) => set({ isDraggingFile: isDragging }),

  // === PLAYLIST PANEL ===
  togglePlaylist: () =>
    set((state) => ({ isPlaylistOpen: !state.isPlaylistOpen })),
  setPlaylistOpen: (open) => set({ isPlaylistOpen: open }),

  // === MOBILE ===
  setIsMobile: (mobile) => set({ isMobile: mobile }),

  // ── Action tiện lợi: reset toàn bộ UI về mặc định ──
  resetUI: () =>
    set({
      sidebarOpen: true,
      contextMenu: { visible: false, x: 0, y: 0, type: null, target: null },
      detailsModal: { open: false, filename: "", details: null },
      isDraggingFile: false,
      isMobile: false,
    }),
}));
