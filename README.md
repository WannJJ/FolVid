# FolVid – Ứng dụng duyệt và phát video từ thư mục

## 📖 Mô tả

FolVid là một ứng dụng web cho phép người dùng **liệt kê tất cả video trong một thư mục** trên server, chọn và **phát video ngay trên trình duyệt** với đầy đủ điều khiển: play/pause, tua (seek), điều chỉnh tốc độ phát (playback speed), âm lượng.  
Không cần thao tác upload – tất cả video đã được lưu sẵn trong thư mục `videos` của backend, ứng dụng sẽ tự động quét và hiển thị danh sách động.

## ✨ Ý tưởng & Mục tiêu

- Xây dựng một media player đơn giản giống như VLC nhưng chạy trên web.
- Người dùng mở ứng dụng, thấy ngay danh sách video có sẵn, chọn video nào xem video đó.
- Mọi thao tác điều khiển video thực hiện hoàn toàn trên giao diện (client-side).
- **Không cần tạo file manifest** liệt kê video thủ công – backend tự động quét thư mục mỗi lần yêu cầu.
- Dễ dàng thêm video mới: chỉ cần copy file vào thư mục `videos` và tải lại trang là thấy.

## 🔧 Công nghệ sử dụng

- **Frontend**: ReactJS (dùng Vite hoặc CRA) – HTML5 Video API để điều khiển video.
- **Backend**: Node.js + Express – phục vụ file tĩnh (video) và API cung cấp danh sách video.
- **Giao tiếp**: REST API (JSON), CORS enabled cho development.
- **Video**: Hỗ trợ các định dạng phổ biến `.mp4`, `.webm`, `.ogg`, `.mov`.

## 🏗️ Kiến trúc hệ thống

```

Trình duyệt (React App)
│
├─ GET /api/videos ──► Backend (Express) ──► fs.readdir("videos/")
│ │
│ └─ Phục vụ file tĩnh qua /videos/:filename
│
└─ Nhận danh sách video, render giao diện.

```

- **Backend** đóng vai trò "cầu nối", cung cấp cả danh sách lẫn nội dung video.
- **Frontend** chỉ việc hiển thị và điều khiển phát, sử dụng thẻ `<video>` của HTML5 với các API `play()`, `pause()`, `currentTime`, `playbackRate`.

## 📁 Cấu trúc thư mục dự án

```

FolVid/
├── backend/
│ ├── server.js # Express server
│ ├── package.json
│ └── videos/ # Chứa tất cả video (.mp4, .webm, ...)
└── frontend/
├── src/
│ ├── App.jsx # Component chính
│ ├── components/ # Các component UI (VideoList, VideoPlayer, ...)
│ └── ...
├── package.json
└── vite.config.js # (nếu dùng Vite)

```

## 🚀 Hướng dẫn cài đặt & chạy

### 1. Backend (Node.js/Express)

```bash
cd backend
npm init -y
npm install express cors
mkdir videos          # Tạo thư mục chứa video, copy vài file .mp4 vào đây
node server.js        # Server chạy ở http://localhost:4000
```

**Code `server.js` cơ bản:**

```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 4000;
const VIDEO_DIR = path.join(__dirname, "videos");

app.use(cors());
app.use("/videos", express.static(VIDEO_DIR));

app.get("/api/videos", (req, res) => {
  fs.readdir(VIDEO_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: "Lỗi đọc thư mục" });
    const videoExts = [".mp4", ".webm", ".ogg", ".mov"];
    const videos = files.filter((f) =>
      videoExts.includes(path.extname(f).toLowerCase()),
    );
    res.json(videos);
  });
});

app.listen(PORT, () =>
  console.log(`Backend chạy tại http://localhost:${PORT}`),
);
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm run dev             # App chạy ở http://localhost:5173
```

**Code `App.jsx` cốt lõi:**

```jsx
import { useState, useEffect, useRef } from "react";
const API = "http://localhost:4000";

function App() {
  const [videos, setVideos] = useState([]);
  const [src, setSrc] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/videos`)
      .then((r) => r.json())
      .then(setVideos);
  }, []);

  return (
    <div style={{ display: "flex" }}>
      {/* Cột danh sách video */}
      <aside style={{ width: "250px", background: "#eee", padding: "10px" }}>
        <h3>📂 Video trong thư mục</h3>
        {videos.map((v) => (
          <div
            key={v}
            style={{ cursor: "pointer", margin: "5px 0" }}
            onClick={() => setSrc(`${API}/videos/${v}`)}
          >
            🎬 {v}
          </div>
        ))}
      </aside>

      {/* Khu vực phát video */}
      <main style={{ flex: 1, padding: "20px" }}>
        {src ? (
          <>
            <video
              ref={videoRef}
              src={src}
              controls
              style={{ width: "100%", maxHeight: "70vh" }}
            />
            <div style={{ marginTop: 10 }}>
              Tốc độ:{" "}
              {[0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => (videoRef.current.playbackRate = rate)}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>👈 Chọn video bên trái để xem</p>
        )}
      </main>
    </div>
  );
}
export default App;
```

Trình duyệt mở `http://localhost:5173` sẽ thấy danh sách video từ backend.

## 🎮 Các tính năng hiện tại (phiên bản 1.0)

- ✅ Liệt kê tự động tất cả video trong thư mục `backend/videos/`.
- ✅ Chọn video để phát ngay lập tức.
- ✅ Điều khiển: Play, Pause, Seek (tua), Volume (thanh controls mặc định của trình duyệt).
- ✅ Tùy chỉnh tốc độ phát: 0.5x, 1x, 1.5x, 2x.
- ✅ Giao diện tối giản, dễ sử dụng.

## 🔮 Hướng mở rộng / Nâng cấp (Roadmap)

### Ngắn hạn

- **Custom video controls**: Ẩn controls mặc định, tự tạo thanh timeline, nút play/pause đẹp hơn.
- **Thanh seek thông minh**: Hiển thị thumbnail khi rê chuột.
- **Phím tắt**: Space (play/pause), ←/→ (tua 5s), M (tắt tiếng).
- **Hiển thị thời lượng, thời gian hiện tại** của video.
- **User upload video:** người dùng có thể upload bằng cách browse hoặc drag&drop.

### Trung hạn

- **Giao diện danh sách video đẹp hơn**: thumbnail tự động chụp từ video (dùng canvas hoặc thư viện).
- **Xem thông tin video**: độ phân giải, kích thước file, codec.
- **Hỗ trợ phụ đề** (WebVTT) nếu có file `.vtt` cùng tên.
- **Cho phép tạo playlist**, phát liên tiếp.

### Dài hạn

- **Tìm kiếm & lọc video** theo tên, ngày thêm, định dạng.
- **Xác thực người dùng** (nếu cần bảo mật truy cập video).
- **Giao diện responsive** tốt trên mobile.
- **Chuyển đổi luồng phát** HLS/DASH cho video lớn (tránh tải toàn bộ file).
- **Triển khai production**: Build frontend, cho backend phục vụ luôn file tĩnh (mọi thứ trên 1 port).

## ❓ Câu hỏi thường gặp

**1. Tại sao không dùng React thuần để liệt kê file thư mục?**  
Trình duyệt không có quyền truy cập hệ thống file của server. Phải có backend (hoặc build-time manifest) để cung cấp danh sách.

**2. Có cần tạo file `manifest.json` chứa danh sách video không?**  
Không cần. Backend Node.js dùng `fs.readdir()` mỗi lần gọi API `/api/videos`, nên danh sách luôn là mới nhất (dynamic). Thêm/xóa video chỉ cần refresh trang.

**3. Làm sao để thêm video mới?**  
Chỉ cần copy file video vào thư mục `backend/videos/`, reload trang web. Video sẽ xuất hiện ngay.

**4. Có hỗ trợ video định dạng `.mkv` không?**  
Trình duyệt không hỗ trợ native `.mkv`. Bạn nên chuyển sang `.mp4` (H.264) hoặc `.webm` để chơi được mượt nhất.

## 📌 Ghi chú cho lần sau đọc lại

- Mấu chốt của dự án là **backend quét thư mục + phục vụ tĩnh**, không cần manifest.
- Mọi thao tác phát video dựa trên **HTML5 Video API** (`videoRef` trong React).
- Có thể bắt đầu từ phiên bản đơn giản nhất rồi dần cải tiến UI/UX.
