import { useState } from "react";

export function PlaylistItem({
  video,
  index,
  isPlaying,
  onPlay,
  onRemove,
  onReorder,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex !== index) {
      onReorder(fromIndex, index);
    }
  };

  return (
    <div
      className={`playlist-item ${isPlaying ? "playing" : ""} ${isDragging ? "dragging" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onPlay}
    >
      <span className="drag-handle">⋮⋮</span>
      <span className="video-name">
        {isPlaying ? "▶ " : `${index + 1}. `}
        {video}
      </span>
      <button
        className="btn-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        ✕
      </button>
    </div>
  );
}
