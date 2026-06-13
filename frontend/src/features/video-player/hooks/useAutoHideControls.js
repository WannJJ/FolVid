import { useCallback, useEffect, useRef } from "react";

export function useAutoHideControls({ delay = 3000, onShow, onHide }) {
  const timeoutRef = useRef(null);
  const isVisibleRef = useRef(true); // guard để tránh setState thừa

  const handleMouseMove = useCallback(() => {
    clearTimeout(timeoutRef.current);

    if (!isVisibleRef.current) {
      isVisibleRef.current = true;
      onShow?.();
    }

    timeoutRef.current = setTimeout(() => {
      isVisibleRef.current = false;
      onHide?.();
    }, delay);
  }, [delay, onShow, onHide]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return handleMouseMove;
}
