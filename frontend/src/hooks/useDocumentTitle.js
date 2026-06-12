import { useEffect } from "react";

export function useDocumentTitle(title, deps = []) {
  useEffect(() => {
    const original = document.title;
    if (title) document.title = title;
    return () => {
      document.title = original;
    };
  }, deps);
}
