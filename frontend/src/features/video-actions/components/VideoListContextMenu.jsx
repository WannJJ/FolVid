import { ContextMenu, MenuItem } from "@/components/ui/context-menu";

export default function VideoListContextMenu({
  contextMenu,
  setContextMenu,
  setCurrentVideo,
  startRename,
  openDetailsModal,
}) {
  const hideContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };
  return (
    <ContextMenu
      visible={contextMenu.visible && contextMenu.type === "listItem"}
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={hideContextMenu}
    >
      <MenuItem
        icon="▶️"
        label="Play"
        onClick={() => {
          setCurrentVideo(contextMenu.target);
          hideContextMenu();
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
          hideContextMenu();
        }}
      />
      <MenuItem
        icon="✏️"
        label="Rename"
        onClick={() => {
          startRename(contextMenu.target.filename);
          hideContextMenu();
        }}
      />
      <MenuItem
        icon="📋"
        label="Copy filename"
        onClick={() => {
          navigator.clipboard.writeText(contextMenu.target.filename);
          hideContextMenu();
        }}
      />
      <div style={{ borderTop: "1px solid #444", margin: "4px 0" }} />
      <MenuItem
        icon="ℹ️"
        label="Details"
        onClick={() => {
          openDetailsModal(contextMenu.target);
          hideContextMenu();
        }}
      />
    </ContextMenu>
  );
}
