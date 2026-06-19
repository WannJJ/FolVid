import { useCallback, useEffect, useRef, useState } from "react";
import { AudioVisualizer } from "./AudioVisualizer";

function ThumbnailPreview({
  videoRef,
  videoSrc,
  isHovered,
  isAudio,
  width = 160,
  height = 90,
}) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const indexRef = useRef(0);

  // Bước nhảy: cứ mỗi 3 giây nội dung gốc = 1 frame preview
  // Video 10 phút → ~200 frame → hiện hết trong ~20 giây (nếu đổi mỗi 100ms)
  // Ta điều chỉnh: mỗi 400ms hiện 1 frame, mỗi frame cách nhau 4 giây nội dung
  // Tự động điều chỉnh để mọi video đều preview trong khoảng 10-15 giây
  const JUMP_SECONDS = duration > 600 ? 8 : duration > 60 ? 4 : 2;
  const FRAME_INTERVAL = duration > 600 ? 250 : 350;

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    // 1. XÓA HẾT: Xóa canvas về nền đen (padding)
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, width, height);

    // 2. THÊM: Kiểm tra nếu là audio-only (MP3)
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Vẽ waveform giả hoặc icon audio
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#3b82f6";
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔊 AUDIO", width / 2, height / 2);
      return;
    }

    // 3. SỬA: object-fit: contain logic
    const videoRatio = video.videoWidth / video.videoHeight;
    const canvasRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (videoRatio > canvasRatio) {
      // Video RỘNG hơn canvas (tỷ lệ ngang) → giới hạn theo chiều rộng
      // Có khoảng đen ở TRÊN và DƯỚI
      drawWidth = width;
      drawHeight = width / videoRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2; // Căn giữa theo chiều cao
    } else {
      // Video CAO hơn canvas (tỷ lệ dọc hoặc vuông) → giới hạn theo chiều cao
      // Có khoảng đen ở TRÁI và PHẢI
      drawHeight = height;
      drawWidth = height * videoRatio;
      offsetX = (width - drawWidth) / 2; // Căn giữa theo chiều rộng
      offsetY = 0;
    }

    // 4. GIỮ NGUYÊN: Vẽ hình vào vị trí đã tính
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
  }, [width, height]);

  const startPreview = useCallback(() => {
    const video = videoRef.current;
    if (!video || !duration) return;

    indexRef.current = 0;

    // Hàm seek và vẽ
    const seekAndDraw = () => {
      const nextTime = (indexRef.current * JUMP_SECONDS) % duration;

      const handleSeeked = () => {
        drawFrame();
        video.removeEventListener("seeked", handleSeeked);
      };

      video.addEventListener("seeked", handleSeeked);
      video.currentTime = nextTime;

      indexRef.current += 1;
    };

    // Vẽ frame đầu tiên ngay lập tức
    seekAndDraw();

    // Sau đó lặp lại theo interval
    intervalRef.current = setInterval(seekAndDraw, FRAME_INTERVAL);
  }, [duration, drawFrame]);

  const stopPreview = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    indexRef.current = 0;

    // Reset canvas về trạng thái ban đầu (icon hoặc màu đen)
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#555";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎬", width / 2, height / 2);
    }
  }, [width, height]);

  // Load metadata để biết duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      setDuration(video.duration);
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    // Nếu đã load sẵn
    if (video.readyState >= 1) {
      handleLoaded();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
    };
  }, [videoSrc]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      onMouseEnter={() => {
        startPreview();
      }}
      onMouseLeave={() => {
        stopPreview();
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#1a1a1a",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
        border: isHovered ? "2px solid #3b82f6" : "2px solid transparent",
        opacity: isHovered ? 1 : 0, // Hiện khi hover
        transition: "border 0.2s",
        zIndex: 2,
      }}
    >
      {/* Video ẩn để extract frame */}
      <video
        ref={videoRef}
        src={videoSrc}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: "none" }}
        muted
      />

      {isAudio ? (
        <AudioVisualizer width={width} height={height} />
      ) : (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      )}

      {/* Badge nhỏ hiện "PREVIEW" khi hover */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontSize: "9px",
            padding: "2px 6px",
            borderRadius: "4px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          PREVIEW
        </div>
      )}
    </div>
  );
}

export default ThumbnailPreview;
