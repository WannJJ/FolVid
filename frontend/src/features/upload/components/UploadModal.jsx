import { videoApi } from "@/services/videoApi";
import { useUIStore } from "@/stores/useUIStore";
import { useVideoStore } from "@/stores/useVideoStore";
import { formatSize } from "@/utils/formatSize";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./UploadModal.module.css";

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
  const { t } = useTranslation();

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
  }, [setShowUploadModal]);

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
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
    >
      <form className={styles.modal} ref={modalRef} onSubmit={handleSubmit}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>📤 Upload Video</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleCloseModal}
            disabled={uploading}
          >
            ✕
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : {}} ${file ? styles.dropZoneHasFile : {}}`}
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
            <div className={styles.filePreview}>
              <div className={styles.fileIcon}>🎬</div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                className={styles.removeFileBtn}
                onClick={clearFile}
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className={styles.uploadIcon}>📁</div>
              <p className={styles.dropText}>
                {isDragging ? t("upload.dropHint") : t("upload.dragDropLabel")}
              </p>
              <p className={styles.orText}>hoặc</p>
              <button
                type="button"
                className={styles.browseBtn}
                onClick={handleBrowseClick}
              >
                {t("upload.chooseFile")}
              </button>
              <p className={styles.hint}>{t("upload.supportedFormats")}</p>
            </>
          )}
        </div>

        {/* Metadata Section */}
        <div className={styles.metadataSection}>
          <h3 className={styles.sectionTitle}>{t("upload.metadataTitle")}</h3>

          {/* Artist */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>{t("upload.artist")}</label>
            <div className={styles.autocompleteWrapper}>
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
                placeholder={t("upload.artistPlaceholder")}
                className={styles.input}
                disabled={uploading}
              />
              {showArtistSuggestions && filteredArtists.length > 0 && (
                <ul className={styles.suggestions}>
                  {filteredArtists.map((a, i) => (
                    <li
                      key={i}
                      className={styles.suggestionItem}
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
          <div className={styles.inputGroup}>
            <label className={styles.label}>{t("upload.creator")}</label>
            <div className={styles.autocompleteWrapper}>
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
                placeholder={t("upload.creatorPlaceholder")}
                className={styles.input}
                disabled={uploading}
              />
              {showAuthorSuggestions && filteredAuthors.length > 0 && (
                <ul className={styles.suggestions}>
                  {filteredAuthors.map((a, i) => (
                    <li
                      key={i}
                      className={styles.suggestionItem}
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
          <div className={styles.inputGroup}>
            <label className={styles.label}>{t("upload.genre")}</label>
            <div className={styles.autocompleteWrapper}>
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
                placeholder={t("upload.genrePlaceholder")}
                className={styles.input}
                disabled={uploading}
              />
              {showGenreSuggestions && filteredGenres.length > 0 && (
                <ul className={styles.suggestions}>
                  {filteredGenres.map((g, i) => (
                    <li
                      key={i}
                      className={styles.suggestionItem}
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
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className={styles.progressText}>
              {t("upload.uploading")} {uploadProgress}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCloseModal}
            disabled={uploading}
          >
            {t("upload.cancel")}
          </button>
          <button
            type="submit"
            className={`${styles.submitBtn} ${!file || uploading ? styles.submitBtnDisabled : {}}`}
            disabled={!file || uploading}
          >
            {uploading ? t("upload.uploading") : t("upload.upload")}
          </button>
        </div>
      </form>
    </div>
  );
}
