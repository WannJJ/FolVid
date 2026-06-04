import styles from "./VideoList.module.css";
export default function VideoList({ children }) {
  return <ul className={styles.videoList}>{children}</ul>;
}
