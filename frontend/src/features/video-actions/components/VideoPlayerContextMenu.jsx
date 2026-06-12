import { ContextMenu, MenuItem } from "@/components/ui/context-menu";
import { usePlayer } from "@/features/video-player/contexts/PlayerContext";
import { useUIStore } from "@/stores/useUIStore";

export function VideoPlayerContextMenu() {
  const { contextMenu, closeContextMenu, openDetailsModal } = useUIStore();
  const { toggleLoop } = usePlayer();

  return (
    <ContextMenu
      visible={contextMenu.visible && contextMenu.type === "player"}
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={closeContextMenu}
    >
      <MenuItem
        icon="🔁"
        label="Toggle loop"
        onClick={() => {
          toggleLoop();
          closeContextMenu();
        }}
      />
      <MenuItem
        icon="📋"
        label="Copy filename"
        onClick={() => {
          navigator.clipboard.writeText(contextMenu.target.filename);
          closeContextMenu();
        }}
      />
      <div style={{ borderTop: "1px solid #444", margin: "4px 0" }} />
      <MenuItem
        icon="ℹ️"
        label="Details"
        onClick={() => {
          openDetailsModal(contextMenu.target);
          closeContextMenu();
        }}
      />
    </ContextMenu>
  );
}
