import { ContextMenu, MenuItem } from "@/components/ui/context-menu";

export default function VideoPlayerContextMenu({
  contextMenu,
  setContextMenu,
  toggleLoop,
  openDetailsModal,
}) {
  const hideContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };
  return (
    <ContextMenu
      visible={contextMenu.visible && contextMenu.type === "player"}
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={hideContextMenu}
    >
      <MenuItem
        icon="🔁"
        label="Toggle loop"
        onClick={() => {
          toggleLoop();
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
