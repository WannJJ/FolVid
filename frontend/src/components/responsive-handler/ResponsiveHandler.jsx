// src/components/ResponsiveHandler.jsx
import useMediaQuery from "@/hooks/useMediaQuery";
import { useUIStore } from "@/stores/useUIStore";
import { useEffect } from "react";

export default function ResponsiveHandler() {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const isTablet = useMediaQuery("(max-width: 1280px)");
  const setIsMobile = useUIStore((state) => state.setIsMobile);
  const setPlaylistOpen = useUIStore((state) => state.setPlaylistOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  useEffect(() => {
    setIsMobile(isMobile);

    if (isMobile) {
      // Mobile: đóng cả sidebar và playlist mặc định
      setPlaylistOpen(false);
      setSidebarOpen(false);
    } else if (isTablet) {
      // Tablet: sidebar mở, playlist đóng
      setSidebarOpen(true);
      setPlaylistOpen(false);
    } else {
      // Desktop: mở cả hai
      setSidebarOpen(true);
      setPlaylistOpen(true);
    }
  }, [isMobile, isTablet, setIsMobile, setPlaylistOpen, setSidebarOpen]);

  return null; // Không render gì
}
