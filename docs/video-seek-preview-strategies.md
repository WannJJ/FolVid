# Video Seek Preview (Hover Thumbnail) – Hướng dẫn triển khai cho FolVid

> **Loại tài liệu:** Architecture Decision Record (ADR) + Implementation Guide  
> **Dự án:** FolVid  
> **Mục đích:** So sánh 3 phương pháp tạo thumbnail preview khi hover trên thanh progress, hướng dẫn code chi tiết và khuyến nghị lựa chọn.

---

## 📌 Vấn đề cần giải quyết

Người dùng di chuột trên thanh tiến trình (progress bar) và muốn **xem trước hình ảnh** tại thời điểm đó để biết đang seek đến đâu. Tính năng này trên YouTube/Netflix gọi là **Scrubbing Preview**, **Hover Thumbnail**, hoặc **Seek Preview**.

**Thách thức:**
- Video có thể ngắn (clip vài giây) hoặc dài (phim 2 tiếng, 4GB).
- Không được gây lag CPU/ổ cứng khi hover liên tục.
- Preview phải chính xác và mượt.

---

## 🔍 Tổng quan 3 phương pháp

| Tiêu chí | **Option A**<br>Video ẩn + Canvas | **Option B**<br>Storyboard (ffmpeg) | **Option C**<br>Hybrid |
|---|---|---|---|
| **Tên tiếng Anh** | Hidden Video Element | Sprite Sheet / WebVTT Storyboard | Conditional Strategy |
| **Server xử lý** | Không cần | Cần ffmpeg | Cần ffmpeg (một phần) |
| **Độ chính xác** | Cao (đến từng ms) | Trung bình (theo khoảng 5-10s) | Cao với ngắn, ổn với dài |
| **Hiệu năng** | Ổn với video ngắn, lag với video dài | Tốt nhất, chỉ load ảnh tĩnh | Tối ưu |
| **Độ phức tạp code** | Thấp | Trung bình | Trung bình |
| **Phù hợp khi** | Prototype, video < 15 phút | Production, video dài | FolVid lâu dài |

---

## Option A: Video ẩn + Canvas (Quick & Dirty)

### Nguyên lý
Dùng một thẻ `<video>` thứ hai (không hiển thị) cùng `src` với video chính. Khi hover thanh progress, tính `hoverTime`, gán cho video ẩn, đợi sự kiện `seeked`, rồi vẽ frame đó lên `<canvas>` hiển thị.

### Yêu cầu
- Trình duyệt hỗ trợ HTML5 Video + Canvas API.
- Không cần thêm thư viện hay công cụ server.

### Code triển khai (React)

#### 1. JSX – Thêm video ẩn và canvas

```jsx
import { useRef, useState, useEffect } from 'react';

const API = 'http://localhost:4000';

function VideoPlayer({ currentVideo }) {
  const videoRef = useRef(null);      // Video chính đang phát
  const previewRef = useRef(null);    // Video ẩn để lấy frame
  const canvasRef = useRef(null);     // Canvas hiển thị thumbnail
  const progressRef = useRef(null);   // Thanh progress bar

  const [duration, setDuration] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);

  // Đồng bộ src khi đổi video
  useEffect(() => {
    if (currentVideo && previewRef.current) {
      previewRef.current.src = `${API}/videos/${encodeURIComponent(currentVideo)}`;
      previewRef.current.load();
    }
  }, [currentVideo]);

  // Vẽ canvas khi video ẩn đã seek xong
  useEffect(() => {
    const preview = previewRef.current;
    const canvas = canvasRef.current;
    if (!preview || !canvas) return;

    const drawFrame = () => {
      const ctx = canvas.getContext('2d');
      canvas.width = 160;   // 16:9 thumbnail
      canvas.height = 90;
      ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
    };

    preview.addEventListener('seeked', drawFrame);
    return () => preview.removeEventListener('seeked', drawFrame);
  }, []);
```

#### 2. Xử lý hover với Throttle

```jsx
  // Throttle: chỉ cập nhật mỗi 150ms
  const throttleRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
    const time = percent * duration;

    setHoverTime(time);
    setIsHovering(true);

    // Di chuyển canvas theo chuột
    if (canvasRef.current) {
      const canvasWidth = 160;
      const leftPos = offsetX - (canvasWidth / 2);
      canvasRef.current.style.left = `${Math.max(0, leftPos)}px`;
    }

    // Throttle việc seek video ẩn
    if (!throttleRef.current) {
      throttleRef.current = setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.currentTime = time;
        }
        throttleRef.current = null;
      }, 150);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }
  };
```

#### 3. JSX cho thanh progress + preview

```jsx
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Video chính */}
      <video
        ref={videoRef}
        src={currentVideo ? `${API}/videos/${encodeURIComponent(currentVideo)}` : ''}
        controls={false}  // Custom controls của bạn
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        style={{ width: '100%' }}
      />

      {/* Video ẩn – preload metadata để nhẹ nhất */}
      <video
        ref={previewRef}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      {/* Thanh Progress */}
      <div
        ref={progressRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          height: '6px',
          background: '#444',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        {/* Progress fill */}
        <div style={{
          width: `${(hoverTime / duration) * 100}%`,
          height: '100%',
          background: '#3b82f6',
          opacity: isHovering ? 0.5 : 1
        }} />

        {/* Preview Container */}
        {isHovering && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: canvasRef.current?.style.left || '0px',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <canvas
              ref={canvasRef}
              width={160}
              height={90}
              style={{
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                background: '#000'
              }}
            />
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              fontSize: '12px',
              padding: '2px 6px',
              borderRadius: '2px',
              marginTop: '4px'
            }}>
              {formatTime(hoverTime)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Ưu điểm
- Triển khai cực nhanh, không cần động đến backend.
- Preview chính xác đến từng giây (thậm chí ms).
- Không tốn thêm dung lượng lưu trữ.

### Nhược điểm
- **Lag với video lớn**: mỗi lần hover là một lần seek ổ cứng. Nếu video 4GB, đầu đọc HDD phải nhảy liên tục.
- **CPU decode**: decoder phải giải nén keyframe liên tục khi hover nhanh.
- **Keyframe interval**: nếu video nén mạnh (keyframe mỗi 5 giây), preview có thể bị nhảy cóc, không mượt.
- **CORS**: nếu sau này deploy frontend/backend khác domain, `canvas.drawImage()` từ cross-origin video sẽ bị "taint", phải thêm `crossOrigin="anonymous"` và backend trả header `Access-Control-Allow-Origin`.

### Khi nào dùng
- Video ngắn (< 15 phút).
- Số lượng file ít.
- Giai đoạn prototype/MVP.

---

## Option B: Storyboard bằng ffmpeg (Chuẩn YouTube)

### Nguyên lý
Dùng **ffmpeg** để:
1. Chụp frame tại mỗi khoảng thời gian cố định (ví dụ mỗi 5 giây).
2. Ghép các frame thành **một tấm sprite sheet** duy nhất (ví dụ grid 10×10).
3. Tạo file `.vtt` (WebVTT) mô tả: *từ giây X đến Y, hiển thị ô (row, col) trong sprite*.
4. Frontend chỉ việc hiển thị đúng mảnh ảnh từ sprite bằng CSS `background-position`.

**Kết quả:** Hover thanh progress chỉ là thao tác với ảnh tĩnh, không seek video, không decode.

### Yêu cầu
- Cài đặt **ffmpeg** trên server (backend).
- Node.js có quyền chạy command line (`child_process`).
- Thêm endpoint API để frontend lấy sprite + VTT.

### Bước 1: Script ffmpeg tạo Storyboard

Giả sử video: `backend/videos/movie.mp4`

```bash
# Tạo thư mục chứa storyboard
mkdir -p backend/storyboards

# Bước 1: Chụp frame mỗi 5 giây, resize về 160x90
ffmpeg -i backend/videos/movie.mp4   -vf "fps=1/5,scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2:black"   -q:v 3   backend/storyboards/movie_frame_%03d.jpg

# Bước 2: Ghép thành sprite sheet (montage) – cần ImageMagick hoặc ffmpeg filter
# Cách dùng ffmpeg concat (phức tạp) hoặc ImageMagick:
magick montage backend/storyboards/movie_frame_*.jpg   -tile 10x10 -geometry 160x90+0+0   backend/storyboards/movie_sprite.jpg

# Bước 3: Tạo file .vtt tương ứng
```

> **Lưu ý:** Nếu không có ImageMagick, có thể dùng Node.js library `sharp` để ghép ảnh, hoặc dùng ffmpeg `tile` filter.

### Bước 2: Tạo file WebVTT tự động (Node.js)

```javascript
const fs = require('fs');
const path = require('path');

function generateVTT(videoName, totalDuration, interval = 5, cols = 10, thumbWidth = 160, thumbHeight = 90) {
  const framesCount = Math.ceil(totalDuration / interval);
  let vtt = 'WEBVTT\n\n';

  for (let i = 0; i < framesCount; i++) {
    const start = i * interval;
    const end = Math.min((i + 1) * interval, totalDuration);
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * thumbWidth;
    const y = row * thumbHeight;

    // Format time: HH:MM:SS.mmm
    const fmt = (s) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      const ms = Math.floor((s % 1) * 1000);
      return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${ms.toString().padStart(3,'0')}`;
    };

    vtt += `${fmt(start)} --> ${fmt(end)}\n`;
    vtt += `${videoName}_sprite.jpg#xywh=${x},${y},${thumbWidth},${thumbHeight}\n\n`;
  }

  return vtt;
}

// Ví dụ sử dụng:
// const vttContent = generateVTT('movie', 7200, 5, 10);
// fs.writeFileSync('backend/storyboards/movie.vtt', vttContent);
```

### Bước 3: Backend – Tự động generate khi phát hiện video mới

Thêm vào `server.js`:

```javascript
const { execSync } = require('child_process');
const ffmpegPath = 'ffmpeg'; // hoặc đường dẫn tuyệt đối

function ensureStoryboard(videoFile) {
  const baseName = path.basename(videoFile, path.extname(videoFile));
  const spritePath = path.join(__dirname, 'storyboards', `${baseName}_sprite.jpg`);
  const vttPath = path.join(__dirname, 'storyboards', `${baseName}.vtt`);

  if (fs.existsSync(spritePath) && fs.existsSync(vttPath)) {
    return { sprite: spritePath, vtt: vttPath };
  }

  // Lấy duration bằng ffprobe
  const durationCmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoFile}"`;
  const duration = parseFloat(execSync(durationCmd).toString().trim());

  // Tạo frames
  const framesDir = path.join(__dirname, 'storyboards', `${baseName}_frames`);
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  execSync(`${ffmpegPath} -i "${videoFile}" -vf "fps=1/5,scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2:black" -q:v 3 "${framesDir}/frame_%03d.jpg"`);

  // Ghép sprite (giả sử dùng ImageMagick, nếu không có thì dùng sharp trong Node)
  const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg')).sort();
  // ... (dùng sharp để ghép nếu không có ImageMagick)

  // Tạo VTT
  const vtt = generateVTT(baseName, duration, 5, 10);
  fs.writeFileSync(vttPath, vtt);

  return { sprite: spritePath, vtt: vttPath };
}

// API endpoint
app.get('/api/storyboard/:videoName', (req, res) => {
  const videoName = req.params.videoName;
  const videoPath = path.join(VIDEO_DIR, videoName);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video không tồn tại' });
  }

  try {
    const sb = ensureStoryboard(videoPath);
    res.json({
      vttUrl: `/storyboards/${path.basename(sb.vtt)}`,
      spriteUrl: `/storyboards/${path.basename(sb.sprite)}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo storyboard', detail: err.message });
  }
});

// Phục vụ file storyboard tĩnh
app.use('/storyboards', express.static(path.join(__dirname, 'storyboards')));
```

### Bước 4: Frontend – Hiển thị sprite

```jsx
import { useState, useEffect } from 'react';

function StoryboardPreview({ videoName, hoverTime, duration, isHovering }) {
  const [storyboard, setStoryboard] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/storyboard/${encodeURIComponent(videoName)}`)
      .then(r => r.json())
      .then(setStoryboard)
      .catch(console.error);
  }, [videoName]);

  if (!isHovering || !storyboard || !duration) return null;

  const interval = 5; // giây
  const cols = 10;
  const thumbW = 160;
  const thumbH = 90;

  const frameIndex = Math.floor(hoverTime / interval);
  const row = Math.floor(frameIndex / cols);
  const col = frameIndex % cols;

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      width: thumbW,
      height: thumbH,
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${API}${storyboard.spriteUrl})`,
        backgroundPosition: `-${col * thumbW}px -${row * thumbH}px`,
        backgroundSize: `${cols * thumbW}px auto`
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        fontSize: '12px',
        textAlign: 'center',
        padding: '2px 0'
      }}>
        {formatTime(hoverTime)}
      </div>
    </div>
  );
}
```

### Ưu điểm
- **Hiệu năng tốt nhất**: chỉ load ảnh tĩnh một lần, hover sau đó không tốn thêm bandwidth hay CPU.
- Không lag ổ cứng, không decode video liên tục.
- Có thể cache sprite/VTT vĩnh viễn (CDN friendly).

### Nhược điểm
- **Phải cài ffmpeg** trên server.
- **Thời gian generate**: video dài 2 tiếng có thể mất 30-60 giây để tạo storyboard lần đầu.
- **Dung lượng thêm**: sprite cho video 2 tiếng (mỗi 5s một frame) ≈ 1440 frame × ~2KB = ~3MB. Chấp nhận được.
- **Độ chính xác giới hạn**: preview chỉ hiển thị frame gần nhất trong khoảng 5 giây, không đến từng ms.
- **Phụ thuộc công cụ ngoài**: ffmpeg (và tùy chọn ImageMagick/sharp).

### Khi nào dùng
- Video dài (> 15 phút).
- Production deployment.
- Nhiều người dùng cùng truy cập (tránh quá tải I/O).

---

## Option C: Hybrid (Khuyến nghị cho FolVid)

### Nguyên lý
Kết hợp cả hai:
- **Video ngắn** (< ngưỡng, ví dụ 15 phút hoặc < 500MB): dùng **Option A** (video ẩn + canvas). Đơn giản, không cần xử lý thêm.
- **Video dài** (> ngưỡng): backend **tự động generate storyboard** (Option B) khi khởi động hoặc khi phát hiện file mới. Frontend ưu tiên dùng storyboard nếu có, fallback về Option A nếu chưa có.

### Logic quyết định ở Backend

```javascript
const MAX_SIZE_FOR_INLINE_PREVIEW = 500 * 1024 * 1024; // 500MB
const MAX_DURATION_FOR_INLINE_PREVIEW = 15 * 60;       // 15 phút

function getPreviewStrategy(videoPath) {
  const stats = fs.statSync(videoPath);

  // Ưu tiên dùng storyboard nếu đã tồn tại
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const hasStoryboard = fs.existsSync(path.join(STORYBOARD_DIR, `${baseName}.vtt`));

  if (hasStoryboard) return 'storyboard';

  // Nếu video nhỏ, cho phép inline (Option A)
  if (stats.size < MAX_SIZE_FOR_INLINE_PREVIEW) return 'inline';

  // Video lớn và chưa có storyboard -> trigger generate
  return 'storyboard_required';
}
```

### API trả về thông tin preview

```javascript
app.get('/api/video-info/:videoName', (req, res) => {
  const videoPath = path.join(VIDEO_DIR, req.params.videoName);
  if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Not found' });

  const strategy = getPreviewStrategy(videoPath);

  const response = {
    name: req.params.videoName,
    previewStrategy: strategy,
    // Nếu là storyboard, trả thêm URL
    ...(strategy === 'storyboard' && {
      storyboard: {
        vtt: `/storyboards/${path.basename(videoPath, path.extname(videoPath))}.vtt`,
        sprite: `/storyboards/${path.basename(videoPath, path.extname(videoPath))}_sprite.jpg`
      }
    })
  };

  // Nếu cần generate, chạy ngầm (không đợi)
  if (strategy === 'storyboard_required') {
    generateStoryboardAsync(videoPath); // không await
    response.previewStrategy = 'inline'; // tạm thời dùng inline trong lúc generate
  }

  res.json(response);
});
```

### Frontend – Component thông minh

```jsx
function SmartPreview({ videoName, hoverTime, duration, isHovering, progressRef }) {
  const [videoInfo, setVideoInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/video-info/${encodeURIComponent(videoName)}`)
      .then(r => r.json())
      .then(setVideoInfo);
  }, [videoName]);

  if (!videoInfo || !isHovering) return null;

  // Nếu backend có storyboard, dùng component StoryboardPreview
  if (videoInfo.previewStrategy === 'storyboard' && videoInfo.storyboard) {
    return <StoryboardPreview 
      spriteUrl={API + videoInfo.storyboard.sprite}
      vttUrl={API + videoInfo.storyboard.vtt}
      hoverTime={hoverTime}
      duration={duration}
    />;
  }

  // Fallback: dùng video ẩn + canvas (Option A)
  return <CanvasPreview 
    videoSrc={`${API}/videos/${encodeURIComponent(videoName)}`}
    hoverTime={hoverTime}
    duration={duration}
  />;
}
```

### Quy trình chạy ngầm (Background Generation)

```javascript
const { spawn } = require('child_process');

function generateStoryboardAsync(videoPath) {
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const log = (msg) => console.log(`[Storyboard ${baseName}] ${msg}`);

  log('Bắt đầu generate...');

  // Chạy ffmpeg trong background
  const ffmpeg = spawn('ffmpeg', [
    '-i', videoPath,
    '-vf', 'fps=1/5,scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2:black',
    '-q:v', '3',
    path.join(STORYBOARD_DIR, `${baseName}_frame_%03d.jpg`)
  ]);

  ffmpeg.on('close', (code) => {
    if (code === 0) {
      log('Hoàn thành frames, ghép sprite...');
      // Gọi thêm sharp để ghép sprite và tạo VTT
      createSpriteAndVTT(baseName);
    } else {
      log(`Lỗi ffmpeg (code ${code})`);
    }
  });
}
```

### Ưu điểm
- **Tối ưu cho mọi trường hợp**: ngắn thì nhanh, dài thì mượt.
- **Không bắt buộc ffmpeg ngay lập tức**: app vẫn chạy được với Option A, storyboard được tạo dần.
- **Dễ mở rộng**: có thể điều chỉnh ngưỡng (threshold) dựa trên kích thước, độ dài, hoặc định dạng.

### Nhược điểm
- Code phức tạp hơn một chút (phải quản lý 2 code path).
- Cần logic kiểm tra "storyboard đã sẵn sàng chưa".

### Khi nào dùng
- **Đây là lựa chọn khuyến nghị cho FolVid** nếu bạn định phát triển lâu dài.
- Phù hợp khi thư mục `videos/` có cả clip ngắn lẫn phim dài.

---

## 🔧 Các vấn đề thường gặp & Cách xử lý

### 1. CORS – Canvas bị "tainted"
**Triệu chứng:** `SecurityError: The operation is insecure` khi gọi `canvas.toDataURL()` hoặc `ctx.drawImage()`.

**Giải pháp:**
- Thêm `crossOrigin="anonymous"` vào **cả 2 thẻ video** (chính + ẩn).
- Backend phải trả header: `Access-Control-Allow-Origin: *` (hoặc domain cụ thể).

```javascript
// Trong server.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
```

### 2. Video ẩn seek chậm
**Triệu chứng:** Canvas hiển thị frame cũ, không kịp cập nhật khi hover nhanh.

**Giải pháp:**
- Throttle 150-200ms là đủ. Đừng throttle quá lâu (>500ms) vì sẽ giật.
- Kiểm tra `previewRef.current.readyState >= 2` trước khi seek.

### 3. ffmpeg không có sẵn trên server
**Giải pháp:**
- Dùng package `@ffmpeg-installer/ffmpeg` trong Node.js để tự động tải binary phù hợp OS.
- Hoặc dùng Docker image có sẵn ffmpeg.

```bash
npm install @ffmpeg-installer/ffmpeg
```

```javascript
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffmpegPath = ffmpeg.path;
```

### 4. Sprite quá lớn (chiều cao khổng lồ)
**Triệu chứng:** Video 3 tiếng, mỗi 5s một frame = 2160 frame. Grid 10 cột → 216 hàng → ảnh dài 19440px. Một số trình duyệt giới hạn texture size (thường 16384px).

**Giải pháp:**
- Giảm khoảng cách frame (10 giây thay vì 5).
- Tăng số cột (20 cột thay vì 10).
- Hoặc chia thành nhiều sprite nhỏ hơn.

### 5. Storyboard chưa kịp tạo, user đã click video
**Giải pháp:**
- Trong Option C, khi `strategy === 'storyboard_required'`, trả về `inline` tạm thời.
- Frontend tự động poll hoặc re-fetch `video-info` mỗi 30 giây để kiểm tra storyboard đã sẵn sàng chưa.

---

## 📊 Quyết định chọn lựa (Decision Matrix)

| Bối cảnh | Khuyến nghị |
|---|---|
| Bạn đang prototype, muốn xem kết quả ngay trong hôm nay | **Option A** |
| Thư mục `videos/` chỉ có clip TikTok/YouTube ngắn (< 5 phút) | **Option A** |
| Bạn có phim dài, file > 1GB, muốn UX chuyên nghiệp | **Option B** |
| Thư mục có cả ngắn và dài, không biết trước | **Option C** |
| Không muốn cài ffmpeg, không muốn xử lý backend thêm | **Option A** (chấp nhận lag với video lớn) |
| Chuẩn bị deploy production cho nhiều người dùng | **Option B hoặc C** |

---

## 🚀 Lộ trình đề xuất cho FolVid

### Giai đoạn 1 (Ngay bây giờ)
Triển khai **Option A** với throttle. Đây là đủ để app hoạt động mượt với đa số video thông thường.

### Giai đoạn 2 (Sau 1-2 tuần)
Khi đã ổn định UI/UX cơ bản, thêm endpoint `/api/video-info` và logic kiểm tra kích thước video. Nếu video > 15 phút, hiển thị thông báo: *"Đang tạo preview..."* và chạy ffmpeg ngầm.

### Giai đoạn 3 (Hoàn thiện)
Chuyển sang **Option C** đầy đủ. Frontend tự động chuyển đổi giữa 2 chế độ dựa trên response từ backend. Người dùng không cần biết đằng sau đang xảy ra gì.

---

## 📝 Checklist triển khai

- [ ] Quyết định chọn Option A, B, hay C.
- [ ] Nếu chọn A: thêm `previewRef`, `canvasRef`, throttle mouse event.
- [ ] Nếu chọn B: cài ffmpeg, tạo thư mục `storyboards/`, viết hàm generateVTT.
- [ ] Nếu chọn C: viết `getPreviewStrategy()`, endpoint `/api/video-info`, component `SmartPreview`.
- [ ] Kiểm tra CORS header trên backend.
- [ ] Test với video ngắn (30 giây) và video dài (30 phút) để so sánh hiệu năng.
- [ ] (Tùy chọn) Thêm phím tắt: Space (play/pause), M (mute), ← → (seek 5s).

---

## 📚 Tài liệu tham khảo

- **HTML5 Video API:** https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
- **Canvas drawImage():** https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
- **WebVTT Spec:** https://www.w3.org/TR/webvtt1/
- **ffmpeg filters:** https://ffmpeg.org/ffmpeg-filters.html
- **YouTube Storyboard insight:** https://stackoverflow.com/questions/13204532/youtube-storyboard-scrubber-preview

---

*Ghi chú: File này là tài liệu nội bộ của project FolVid. Nên được lưu trong `docs/` và đồng bộ lên GitHub cùng codebase để team (hoặc chính bạn sau này) có thể trace lại quyết định kỹ thuật.*
