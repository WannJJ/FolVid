import { useEffect, useRef } from "react";

export default function ContextMenu({ visible, x, y, onClose, children }) {
  const menuRef = useRef(null);
  const { x: finalX, y: finalY } = adjustPosition(x, y);

  // Đóng khi click ra ngoài
  useEffect(() => {
    if (!visible) return;

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Dùng capture để ăn trước các click khác
    document.addEventListener("mousedown", handleClick, true);
    // Đóng luôn khi scroll để tránh menu trôi lệch
    document.addEventListener("scroll", onClose, true);

    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("scroll", onClose, true);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        top: finalY,
        left: finalX,
      }}
    >
      {children}
    </div>
  );
}

export function MenuItem({ onClick, label, icon }) {
  return (
    <div
      className="menu-item"
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// Hàm helper để xử lý vị trí menu không tràn màn hình
function adjustPosition(x, y, menuWidth = 180, menuHeight = 150) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  let adjustedX = x;
  let adjustedY = y;

  if (x + menuWidth > w) adjustedX = w - menuWidth - 10;
  if (y + menuHeight > h) adjustedY = h - menuHeight - 10;

  return { x: adjustedX, y: adjustedY };
}
