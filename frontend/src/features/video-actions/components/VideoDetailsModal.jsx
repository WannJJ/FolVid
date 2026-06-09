import { useEffect } from "react";
import styles from "./VideoDetailsModal.module.css";

export default function VideoDetailsModal({
  isOpen,
  onClose,
  details,
  filename,
}) {
  // details = { width, height, duration, size, artist, author, genre }
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Overlay
    <div className={styles.overlay}>
      {/*Card*/}
      <div
        className={styles.wrapper}
        style={{
          transform: isOpen ? "scale(1)" : "scale(0.95)",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span style={{ fontSize: "1.2rem" }}>🎬</span>
            <span className={styles.filename}>{filename}</span>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.detailsModal}>
          {/* Grid cho width, height, duration, size */}
          <div className={styles.statsGrid}>
            {/* Resolution */}
            {details.width && details.height && (
              <div className={styles.statCard}>
                <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>
                  📐
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  {details.width} × {details.height}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "2px",
                  }}
                >
                  Resolution
                </div>
              </div>
            )}

            {/* Duration */}
            {details.duration && (
              <div className={styles.statCard}>
                <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>⏱</div>
                <div style={{ fontWeight: 600 }}>{details.duration}</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "2px",
                  }}
                >
                  Duration
                </div>
              </div>
            )}

            {/* File Size – cho chiếm full width nếu chỉ có 1 hàng */}
            {details.size && (
              <div
                className={styles.statCard}
                style={{
                  gridColumn:
                    details.width || details.duration ? "span 1" : "span 2",
                }}
              >
                <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>
                  💾
                </div>
                <div style={{ fontWeight: 600 }}>{details.size} </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "2px",
                  }}
                >
                  File Size
                </div>
              </div>
            )}
          </div>
        </div>

        {(details.artist || details.author || details.genre) && (
          <>
            {/* Divider */}
            <div className={styles.divider} />

            <div className={styles.metaSection}>
              <div className={styles.metaTitle}>Metadata</div>

              {details.artist && (
                <InfoRow icon="🎤" label="Artist" value={details.artist} />
              )}
              {details.author && (
                <InfoRow icon="✍️" label="Author" value={details.author} />
              )}
              {details.genre && (
                <InfoRow icon="🎵" label="Genre" value={details.genre} />
              )}
            </div>
          </>
        )}

        {/* Trong trường hợp tất cả các field đều trống */}
        {!details.width &&
          !details.height &&
          !details.duration &&
          !details.size &&
          !details.artist &&
          !details.author &&
          !details.genre && (
            <div className={styles.emptyState}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
              <div style={{ fontSize: "0.9rem" }}>
                No details available for this video.
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className={styles.infoRow}>
      <span style={{ fontSize: "1rem", width: "20px", textAlign: "center" }}>
        {icon}
      </span>
      <span style={{ color: "#888", minWidth: "50px" }}>{label}</span>
      <span style={{ color: "#fff", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
