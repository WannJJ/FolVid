import { PlaylistPanel } from "@/features/play-list";
import { VideoDetailsModal } from "@/features/video-actions";
import styles from "./AppLayout.module.css";
import { MainArea } from "./MainArea/MainArea";
import { SideBar } from "./SideBar/SideBar";

export function AppLayout({ sidebarContent, mainContent }) {
  return (
    <div className={styles.appContainer}>
      <SideBar>{sidebarContent}</SideBar>
      <MainArea>{mainContent}</MainArea>
      <PlaylistPanel />
      <VideoDetailsModal />
    </div>
  );
}
