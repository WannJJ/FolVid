import { ContextMenu, MenuItem } from "@/components/ui/context-menu";
import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";

export function VideoListContextMenu({ startRename }) {
  const { setCurrentVideo } = useVideoStore();
  const { contextMenu, closeContextMenu, openDetailsModal } = useUIStore();
  return (
    <ContextMenu
      visible={contextMenu.visible && contextMenu.type === "listItem"}
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={closeContextMenu}
    >
      <MenuItem
        icon="▶️"
        label="Play"
        onClick={() => {
          setCurrentVideo(contextMenu.target);
          closeContextMenu();
        }}
      />
      <MenuItem
        icon="▶️"
        label="Play New Tab"
        onClick={() => {
          const video = contextMenu.target;
          const filename = video.filename;
          const url = `/?v=${encodeURIComponent(filename)}`;
          window.open(url, "_blank", "noopener,noreferrer");
          closeContextMenu();
        }}
      />
      <MenuItem
        icon="✏️"
        label="Rename"
        onClick={() => {
          startRename(contextMenu.target.filename);
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
