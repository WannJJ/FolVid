const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;
const VIDEO_DIR = path.join(__dirname, 'videos');

// Cho phép frontend (chạy ở port khác) gọi API đến backend
app.use(cors());

// Phục vụ file video tĩnh qua URL: http://localhost:4000/videos/ten-file.mp4
app.use('/videos', express.static(VIDEO_DIR));

// API trả về danh sách video trong thư mục videos/
app.get('/api/videos', (req, res) => {
  fs.readdir(VIDEO_DIR, (err, files) => {
    if (err) {
      console.error('Lỗi đọc thư mục:', err);
      return res.status(500).json({ error: 'Không đọc được thư mục video' });
    }

    const videoExts = ['.mp4', '.mp3'];
    const videos = files.filter((f) =>
      videoExts.includes(path.extname(f).toLowerCase())
    );

    res.json(videos);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend đang chạy tại http://localhost:${PORT}`);
  console.log(`📁 Thư mục video: ${VIDEO_DIR}`);
});
