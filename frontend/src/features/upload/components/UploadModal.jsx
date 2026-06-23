import { videoApi } from "@/services/videoApi";
import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { formatSize } from "@/utils/formatSize";
import { useCallback, useEffect, useRef, useState } from "react";

export function UploadModal() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Metadata states
  const [artist, setArtist] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");

  // Autocomplete suggestions
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [showGenreSuggestions, setShowGenreSuggestions] = useState(false);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const { fetchVideoList, videos } = useVideoStore();
  const { showUploadModal, setShowUploadModal } = useUIStore();

  // Extract uniqued values from existing metadata
  const artists = [
    ...new Set(videos.map((v) => v.custom?.artist).filter(Boolean)),
  ];
  const authors = [
    ...new Set(videos.map((v) => v.custom?.author).filter(Boolean)),
  ];
  const genres = [
    ...new Set(videos.map((v) => v.custom?.genre).filter(Boolean)),
  ];

  const handleCloseModal = useCallback(() => {
    setShowUploadModal(false);
    // Reset form
    setFile(null);
    setArtist("");
    setAuthor("");
    setGenre("");
    setUploading(false);
    setUploadProgress(0);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showUploadModal) handleCloseModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showUploadModal, handleCloseModal]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (showUploadModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showUploadModal]);

  const handleFileSelect = useCallback((selectedFile) => {
    if (
      selectedFile &&
      (selectedFile.type.startsWith("video/") ||
        selectedFile.type.startsWith("audio/"))
    ) {
      setFile(selectedFile);
    } else if (selectedFile) {
      alert("Vui lòng chọn file video hợp lệ!");
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    },
    [handleFileSelect],
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // tránh reload trang
    if (!file) {
      alert("Vui lòng chọn file video!");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload video file
      await videoApi.upload(file);

      // 2. Upload metadata if any field is filled
      if (artist.trim() || author.trim() || genre.trim()) {
        const metadata = {
          filename: file.name,
          artist: artist.trim() || null,
          author: author.trim() || null,
          genre: genre.trim() || null,
          uploadedAt: new Date().toISOString(),
        };

        await videoApi.createMetadata(metadata);
      }

      // Success
      setUploadProgress(100);
      setTimeout(() => {
        fetchVideoList();
        handleCloseModal();
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Có lỗi xảy ra: " + err.message);
      setUploading(false);
    }
  };

  // Filter suggestions based on input
  const filteredArtists = artists.filter(
    (a) => a.toLowerCase().includes(artist.toLowerCase()) && a !== artist,
  );
  const filteredAuthors = authors.filter(
    (a) => a.toLowerCase().includes(author.toLowerCase()) && a !== author,
  );
  const filteredGenres = genres.filter(
    (g) => g.toLowerCase().includes(genre.toLowerCase()) && g !== genre,
  );

  if (!showUploadModal) return null;

  return (
    <div
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
    >
      <form style={styles.modal} ref={modalRef} onSubmit={handleSubmit}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>📤 Upload Video</h2>
          <button
            type="button"
            style={styles.closeBtn}
            onClick={handleCloseModal}
            disabled={uploading}
          >
            ✕
          </button>
        </div>

        {/* Drop Zone */}
        <div
          style={{
            ...styles.dropZone,
            ...(isDragging ? styles.dropZoneActive : {}),
            ...(file ? styles.dropZoneHasFile : {}),
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="video/*"
            style={{ display: "none" }}
          />

          {file ? (
            <div style={styles.filePreview}>
              <div style={styles.fileIcon}>🎬</div>
              <div style={styles.fileInfo}>
                <p style={styles.fileName}>{file.name}</p>
                <p style={styles.fileSize}>{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                style={styles.removeFileBtn}
                onClick={clearFile}
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div style={styles.uploadIcon}>📁</div>
              <p style={styles.dropText}>
                {isDragging ? "Thả file vào đây..." : "Kéo & thả video vào đây"}
              </p>
              <p style={styles.orText}>hoặc</p>
              <button
                type="button"
                style={styles.browseBtn}
                onClick={handleBrowseClick}
              >
                📂 Chọn file từ máy
              </button>
              <p style={styles.hint}>Hỗ trợ: MP4, WebM, OGG, MOV</p>
            </>
          )}
        </div>

        {/* Metadata Section */}
        <div style={styles.metadataSection}>
          <h3 style={styles.sectionTitle}>📝 Thông tin bổ sung (tùy chọn)</h3>

          {/* Artist */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nghệ sĩ / Ca sĩ</label>
            <div style={styles.autocompleteWrapper}>
              <input
                type="text"
                value={artist}
                onChange={(e) => {
                  setArtist(e.target.value);
                  setShowArtistSuggestions(true);
                }}
                onFocus={() => setShowArtistSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowArtistSuggestions(false), 200)
                }
                placeholder="Nhập tên nghệ sĩ..."
                style={styles.input}
                disabled={uploading}
              />
              {showArtistSuggestions && filteredArtists.length > 0 && (
                <ul style={styles.suggestions}>
                  {filteredArtists.map((a, i) => (
                    <li
                      key={i}
                      style={styles.suggestionItem}
                      onMouseDown={(e) => {
                        e.preventDefault(); // ← giữ focus, tránh blur trước khi click
                        setArtist(a);
                        setShowArtistSuggestions(false);
                      }}
                    >
                      🎤 {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Author */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tác giả / Creator</label>
            <div style={styles.autocompleteWrapper}>
              <input
                type="text"
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setShowAuthorSuggestions(true);
                }}
                onFocus={() => setShowAuthorSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowAuthorSuggestions(false), 200)
                }
                placeholder="Nhập tên tác giả..."
                style={styles.input}
                disabled={uploading}
              />
              {showAuthorSuggestions && filteredAuthors.length > 0 && (
                <ul style={styles.suggestions}>
                  {filteredAuthors.map((a, i) => (
                    <li
                      key={i}
                      style={styles.suggestionItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setAuthor(a);
                        setShowAuthorSuggestions(false);
                      }}
                    >
                      ✍️ {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Genre */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Thể loại</label>
            <div style={styles.autocompleteWrapper}>
              <input
                type="text"
                value={genre}
                onChange={(e) => {
                  setGenre(e.target.value);
                  setShowGenreSuggestions(true);
                }}
                onFocus={() => setShowGenreSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowGenreSuggestions(false), 200)
                }
                placeholder="Nhập thể loại..."
                style={styles.input}
                disabled={uploading}
              />
              {showGenreSuggestions && filteredGenres.length > 0 && (
                <ul style={styles.suggestions}>
                  {filteredGenres.map((g, i) => (
                    <li
                      key={i}
                      style={styles.suggestionItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setGenre(g);
                        setShowGenreSuggestions(false);
                      }}
                    >
                      🏷️ {g}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{ ...styles.progressFill, width: `${uploadProgress}%` }}
              />
            </div>
            <p style={styles.progressText}>Đang upload... {uploadProgress}%</p>
          </div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <button
            type="button"
            style={styles.cancelBtn}
            onClick={handleCloseModal}
            disabled={uploading}
          >
            Hủy
          </button>
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(!file || uploading ? styles.submitBtnDisabled : {}),
            }}
            disabled={!file || uploading}
          >
            {uploading ? "⏳ Đang upload..." : "🚀 Upload Video"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Styles
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
    animation: "fadeIn 0.2s ease",
  },
  modal: {
    background: "#1a1a2e",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "520px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    animation: "slideUp 0.3s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "all 0.2s",
    lineHeight: 1,
  },
  dropZone: {
    margin: "20px 24px",
    padding: "32px 24px",
    border: "2px dashed rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    textAlign: "center",
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.02)",
  },
  dropZoneActive: {
    borderColor: "#3b82f6",
    background: "rgba(59, 130, 246, 0.1)",
    transform: "scale(1.02)",
  },
  dropZoneHasFile: {
    borderColor: "#10b981",
    background: "rgba(16, 185, 129, 0.08)",
    borderStyle: "solid",
  },
  uploadIcon: {
    fontSize: "3rem",
    marginBottom: "12px",
    opacity: 0.7,
  },
  dropText: {
    color: "#e2e8f0",
    fontSize: "1rem",
    margin: "0 0 8px 0",
    fontWeight: "500",
  },
  orText: {
    color: "#64748b",
    margin: "8px 0",
    fontSize: "0.875rem",
  },
  browseBtn: {
    marginTop: "8px",
    padding: "10px 24px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  hint: {
    color: "#475569",
    fontSize: "0.75rem",
    marginTop: "12px",
    marginBottom: 0,
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
  },
  fileIcon: {
    fontSize: "2rem",
  },
  fileInfo: {
    flex: 1,
    textAlign: "left",
  },
  fileName: {
    color: "#e2e8f0",
    fontWeight: "500",
    margin: "0 0 4px 0",
    wordBreak: "break-all",
    fontSize: "0.9rem",
  },
  fileSize: {
    color: "#64748b",
    margin: 0,
    fontSize: "0.8rem",
  },
  removeFileBtn: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },
  metadataSection: {
    padding: "0 24px 20px",
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    fontWeight: "600",
    margin: "0 0 16px 0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "0.875rem",
    marginBottom: "6px",
    fontWeight: "500",
  },
  autocompleteWrapper: {
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  suggestions: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    marginTop: "4px",
    maxHeight: "160px",
    overflowY: "auto",
    listStyle: "none",
    padding: "4px",
    zIndex: 10,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
  },
  suggestionItem: {
    padding: "8px 12px",
    color: "#cbd5e1",
    cursor: "pointer",
    borderRadius: "6px",
    fontSize: "0.9rem",
    transition: "background 0.15s",
  },
  progressContainer: {
    padding: "0 24px 16px",
  },
  progressBar: {
    height: "6px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #10b981)",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  progressText: {
    color: "#64748b",
    fontSize: "0.8rem",
    margin: "8px 0 0 0",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    gap: "12px",
    padding: "0 24px 24px",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#94a3b8",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  submitBtn: {
    flex: 2,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
