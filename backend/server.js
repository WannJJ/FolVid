const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // middleware để express nhận file từ form-data


const app = express();
const PORT = 4000;
const VIDEO_DIR = path.join(__dirname, 'videos');
const CACHE_DIR = path.join(__dirname, 'cache');
const INFO_DIR = path.join(CACHE_DIR, 'info');
const THUMB_DIR = path.join(CACHE_DIR, 'thumbs');
const videoExts = ['.mp4', '.mp3', '.webm', '.ogg', '.mov'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_DIR); // Luôn lưu vào thư mục videos/
  },
  filename: (req, file, cb) => {
    // Giữ nguyên tên file gốc, nhưng nên xử lý trùng tên ở bước sau
    cb(null, file.originalname);
  }
});


const upload = multer({
  storage: storage, // storage bạn đã cấu hình trước đó
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (videoExts.includes(ext)) {
      cb(null, true); // Chấp nhận
    } else {
      cb(new Error('Định dạng file không được hỗ trợ: ' + ext), false); // Từ chối
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024  // 500MB, đổi thành số bạn muốn
  }
});

// Cho phép frontend (chạy ở port khác) gọi API đến backend
app.use(cors());

// Phục vụ file video tĩnh qua URL: http://localhost:4000/videos/ten-file.mp4
app.use('/videos', express.static(VIDEO_DIR));

// Phục vụ ảnh thumbnail tĩnh
app.use('/cache/thumbs', express.static(THUMB_DIR));

// API trả về danh sách video trong thư mục videos/
app.get('/api/videos', (req, res) => {
  if (!fs.existsSync(INFO_DIR)) {
    return res.json([]);
  }

  const files = fs.readdirSync(INFO_DIR).filter(f => f.endsWith('.json'));
  
  const videos = files.map(file => {
    const infoPath = path.join(INFO_DIR, file);
    try {
      return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    } catch {
      return null;
    }
  }).filter(Boolean); // Lọc bỏ null nếu file JSON bị hỏng

  res.json(videos);
});

// Nhận file
app.post('/api/upload', (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File quá lớn. Giới hạn 500MB.' });
      }
      return res.status(400).json({ error: 'Lỗi upload: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được gửi lên' });
    }

    res.json({ message: 'Upload thành công', filename: req.file.filename });
  });
});

// Sửa file name
app.put('/api/videos/:filename', express.json(), (req, res) => {
  const oldName = req.params.filename;
  const { newName } = req.body;

  if (!newName || newName.includes('/') || newName.includes('\\')) {
    return res.status(400).json({ error: 'Tên file không hợp lệ' });
  }

  const oldPath = path.join(VIDEO_DIR, oldName);
  const newPath = path.join(VIDEO_DIR, newName);

  // Kiểm tra file cũ có tồn tại không
  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ error: 'File không tồn tại' });
  }

  // Kiểm tra file mới đã tồn tại chưa (tránh ghi đè)
  if (fs.existsSync(newPath)) {
    return res.status(409).json({ error: 'Tên file mới đã tồn tại' });
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ error: 'Không đổi được tên' });
    res.json({ message: 'Đổi tên thành công', newName });
  });
});


app.listen(PORT, () => {
  console.log(`✅ Backend chạy tại http://localhost:${PORT}`);
  console.log(`📁 Video: ${VIDEO_DIR}`);
  console.log(`💡 Nhớ chạy "node scan.js" nếu vừa thêm/xóa/sửa video`);
});


