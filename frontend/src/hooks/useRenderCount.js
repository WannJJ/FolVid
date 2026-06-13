import { useEffect, useRef } from "react";

export function useRenderCount(componentName) {
  const count = useRef(0);
  count.current++;

  useEffect(() => {
    console.log(`[${componentName}] render lần thứ:`, count.current);
  });

  return count.current;
}
