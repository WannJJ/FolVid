import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { useCallback } from "react";

export function usePlayerContextMenu() {
  const openContextMenu = useUIStore((s) => s.openContextMenu);
  const { currentVideo } = useVideoStore();

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      openContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: "player",
        target: currentVideo,
      });
    },
    [openContextMenu, currentVideo],
  );

  return handleContextMenu;
}
