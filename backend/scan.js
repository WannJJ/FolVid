const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const VIDEO_DIR = path.join(__dirname, 'videos');
const CACHE_DIR = path.join(__dirname, 'cache');
const THUMB_DIR = path.join(CACHE_DIR, 'thumbs');
const INFO_DIR = path.join(CACHE_DIR, 'info');

// Đảm bảo thư mục cache tồn tại
[THUMB_DIR, INFO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {    
    fs.mkdirSync(dir, { recursive: true });
  }
});

const VIDEO_EXTS = ['.mp3', '.mp4', '.webm', '.ogg', '.mov'];

// Hàm 1: Lấy metadata bằng ffprobe
function getVideoMeta(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        width: videoStream ? videoStream.width : null,
        height: videoStream ? videoStream.height : null,
        duration: metadata.format.duration ? Math.floor(metadata.format.duration) : 0,
        size: metadata.format.size,
        bitrate: metadata.format.bitrate,
        hasVideo: !!videoStream,
      });
    });
  });
}

// Hàm 2: Tạo thumbnail (chụp ở 10% thời lượng, resize rộng 320px)
function generateThumb(videoPath, outPath, duration) {
  return new Promise((resolve, reject) => {
    // Tính thời điểm chụp: 10% tổng thời lượng, tối thiểu 1 giây
    const seconds = Math.max(1, Math.floor(duration * 0.1));
    const ts = new Date(seconds * 1000).toISOString().substr(11, 8); // format HH:MM:SS
    
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [ts],
        filename: path.basename(outPath),
        folder: path.dirname(outPath),
        size: '320x?'
      })
      .on('end', resolve)
      .on('error', reject);
  });
}

// Hàm 3: Đọc file .meta.json do bạn tự nhập (artist, author, genre)
function getCustomMeta(videoPath) {
  const metaPath = videoPath + '.meta.json';
  if (!fs.existsSync(metaPath)) {
    return { artist: '', author: '', genre: '' };
  }
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    return { artist: '', author: '', genre: '' };
  }
}

// Hàm 4: Dọn rác cache mồ côi (video đã bị xóa hoặc đổi tên)
function cleanOrphanCache() {
  if (!fs.existsSync(INFO_DIR)) return { removed: 0 };
  
  let removed = 0;
  const cacheFiles = fs.readdirSync(INFO_DIR).filter(f => f.endsWith('.json'));
  
  for (const cacheFile of cacheFiles) {
    const videoName = cacheFile.slice(0, -5); // bỏ .json
    const videoPath = path.join(VIDEO_DIR, videoName);
    
    if (!fs.existsSync(videoPath)) {
      // Xóa file info
      fs.unlinkSync(path.join(INFO_DIR, cacheFile));
      // Xóa thumbnail nếu có
      const thumbPath = path.join(THUMB_DIR, videoName + '.jpg');
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
      console.log(`🗑️  Đã xóa cache mồ côi: ${videoName}`);
      removed++;
    }
  }
  
  return { removed };
}

// Hàm 5: Quét và xây dựng cache
async function buildCache() {
  const videoFiles = fs.readdirSync(VIDEO_DIR).filter(file => {
    return VIDEO_EXTS.includes(path.extname(file).toLowerCase());
  });
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const file of videoFiles) {
    const videoPath = path.join(VIDEO_DIR, file);
    const infoPath = path.join(INFO_DIR, file + '.json');
    const thumbPath = path.join(THUMB_DIR, file + '.jpg');
    
    const stat = fs.statSync(videoPath);
    const currentMtime = stat.mtimeMs; // thời gian sửa file (millisecond)
    const currentSize = stat.size;
    
    let needsUpdate = true;
    
    // Kiểm tra xem cache hiện tại còn hợp lệ không
    if (fs.existsSync(infoPath)) {
      try {
        const oldCache = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        if (oldCache.mtime === currentMtime && oldCache.size === currentSize) {
          needsUpdate = false;
        }
      } catch {
        needsUpdate = true;
      }
    }
    
    if (!needsUpdate) {
      skipped++;
      continue;
    }
    
    console.log(`🔍 Đang xử lý: ${file}`);
    
    try {
      // Lấy metadata
      const meta = await getVideoMeta(videoPath);
      
      // Tạo thumbnail
     let thumbUrl = null;

    // Chỉ tạo thumbnail nếu file có video stream
    if (meta.hasVideo) {
      const thumbPath = path.join(THUMB_DIR, file + '.jpg');
      await generateThumb(videoPath, thumbPath, meta.duration);
      thumbUrl = `/cache/thumbs/${file}.jpg`;
    }

      // Đọc custom metadata
      const custom = getCustomMeta(videoPath);
      
      // Gộp lại và lưu cache
      const cacheData = {
        filename: file,
        mtime: currentMtime,
        size: currentSize,
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
        bitrate: meta.bitrate,
        thumb: thumbUrl,   // sẽ là null nếu là mp3
        custom
      };
      
      fs.writeFileSync(infoPath, JSON.stringify(cacheData, null, 2));
      
      if (fs.existsSync(infoPath) && !needsUpdate) {
        // Trường hợp này không xảy ra vì đã check ở trên, nhưng để rõ logic
      } else if (fs.existsSync(infoPath)) {
        updated++;
      } else {
        created++;
      }
    } catch (err) {
      console.error(`❌ Lỗi xử lý ${file}:`, err.message);
      errors++;
    }
  }
  
  return { created, updated, skipped, errors };
}

// Chạy chính
(async () => {
  console.log('🚀 FolVid Scanner bắt đầu...\n');
  
  const { removed } = cleanOrphanCache();
  const { created, updated, skipped, errors } = await buildCache();
  
  console.log('\n📊 Kết quả:');
  console.log(`   Tạo mới: ${created}`);
  console.log(`   Cập nhật: ${updated}`);
  console.log(`   Giữ nguyên: ${skipped}`);
  console.log(`   Xóa mồ côi: ${removed}`);
  console.log(`   Lỗi: ${errors}`);
  console.log('\n✅ Hoàn tất!');
})();