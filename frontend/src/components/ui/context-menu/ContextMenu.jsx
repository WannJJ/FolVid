import { memo, useEffect, useMemo, useRef } from "react";
import styles from "./ContextMenu.module.css";

function ContextMenu({ visible, x, y, onClose, children }) {
  const menuRef = useRef(null);
  //const { x: finalX, y: finalY } = adjustPosition(x, y, children.length - 1);

  // Đếm số MenuItem thực sự (loại bỏ null, undefined, boolean)
  const itemCount = useMemo(() => {
    let count = 0;
    // children có thể là: element | array | null | undefined
    if (!children) return count;

    const arr = Array.isArray(children) ? children : [children];
    arr.forEach((child) => {
      // Chỉ đếm element thực sự (không phải null, false, string rỗng...)
      if (child && typeof child === "object" && child.type) {
        count++;
      }
    });
    return count;
  }, [children]);

  // Tính vị trí - chỉ recalculate khi x, y, hoặc itemCount thay đổi
  const { finalX, finalY } = useMemo(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const menuWidth = 180;
    const menuHeight = 42 * (itemCount - 1);

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > w) adjustedX = w - menuWidth - 10;
    if (y + menuHeight > h) adjustedY = h - menuHeight - 10;

    return { finalX: adjustedX, finalY: adjustedY };
  }, [x, y, itemCount]);

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
      className={styles.contextMenu}
      style={{
        top: finalY,
        left: finalX,
      }}
    >
      {children}
    </div>
  );
}

//function adjustPosition(x, y, menuWidth = 180, menuHeight = 150) {
function adjustPosition(x, y, menuItemCount) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const menuWidth = 180;
  const menuHeight = 42 * menuItemCount;

  let adjustedX = x;
  let adjustedY = y;

  if (x + menuWidth > w) adjustedX = w - menuWidth - 10;
  if (y + menuHeight > h) adjustedY = h - menuHeight - 10;

  return { x: adjustedX, y: adjustedY };
}

// Chỉ re-render khi props thực sự thay đổi (shallow compare)
export default memo(ContextMenu, (prev, next) => {
  return (
    prev.visible === next.visible &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.onClose === next.onClose &&
    prev.children === next.children // So sánh reference
  );
});
