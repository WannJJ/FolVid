const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const VIDEO_DIR = path.join(__dirname, "videos");
const CACHE_DIR = path.join(__dirname, "cache");
const THUMB_DIR = path.join(CACHE_DIR, "thumbs");
const INFO_DIR = path.join(CACHE_DIR, "info");

const VIDEO_EXTS = [".mp3", ".mp4", ".webm", ".ogg", ".mov"];

// Cấu hình storyboard
const THUMB_WIDTH = 160; // Chiều rộng mỗi thumbnail
const THUMB_HEIGHT = 90; // Chiều cao mỗi thumbnail (16:9)
const INTERVAL_SECONDS = 10; // Mỗi 10 giây lấy 1 frame
const SPRITE_COLS = 10; // Số cột trong sprite grid

// Đảm bảo thư mục cache tồn tại
[THUMB_DIR, INFO_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Hàm 1: Lấy metadata bằng ffprobe
function getVideoMeta(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video",
      );
      resolve({
        width: videoStream ? videoStream.width : null,
        height: videoStream ? videoStream.height : null,
        duration: metadata.format.duration
          ? Math.floor(metadata.format.duration)
          : 0,
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
        size: "320x?",
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

// Hàm 3: Đọc file .meta.json user tự nhập (artist, author, genre)
function getCustomMeta(videoPath) {
  const metaPath = videoPath + ".meta.json";
  if (!fs.existsSync(metaPath)) {
    return { artist: "", author: "", genre: "" };
  }
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch {
    return { artist: "", author: "", genre: "" };
  }
}

// Hàm 4: Dọn rác cache mồ côi (video đã bị xóa hoặc đổi tên)
function cleanOrphanCache() {
  if (!fs.existsSync(INFO_DIR)) return { removed: 0 };

  let removed = 0;
  const cacheFiles = fs
    .readdirSync(INFO_DIR)
    .filter((f) => f.endsWith(".json"));

  for (const cacheFile of cacheFiles) {
    const videoName = cacheFile.slice(0, -5); // bỏ .json
    const videoPath = path.join(VIDEO_DIR, videoName);

    if (!fs.existsSync(videoPath)) {
      // Xóa file info
      fs.unlinkSync(path.join(INFO_DIR, cacheFile));
      // Xóa thumbnail nếu có
      const thumbPath = path.join(THUMB_DIR, videoName + ".jpg");
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
  const videoFiles = fs.readdirSync(VIDEO_DIR).filter((file) => {
    return VIDEO_EXTS.includes(path.extname(file).toLowerCase());
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of videoFiles) {
    const videoPath = path.join(VIDEO_DIR, file);
    const infoPath = path.join(INFO_DIR, file + ".json");
    const thumbPath = path.join(THUMB_DIR, file + ".jpg");
    const baseName = path.basename(file, path.extname(file));

    const stat = fs.statSync(videoPath);
    const currentMtime = stat.mtimeMs; // thời gian sửa file (millisecond)
    const currentSize = stat.size;

    let needsUpdate = true;

    // Kiểm tra xem cache hiện tại còn hợp lệ không
    if (fs.existsSync(infoPath)) {
      try {
        const oldCache = JSON.parse(fs.readFileSync(infoPath, "utf8"));
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
      let sb = null;

      // Chỉ tạo thumbnail nếu file có video stream
      if (meta.hasVideo) {
        const thumbPath = path.join(THUMB_DIR, file + ".jpg");
        await generateThumb(videoPath, thumbPath, meta.duration);
        thumbUrl = `/cache/thumbs/${file}.jpg`;

        // Tạo storyboard
        sb = generateStoryboard(videoPath, baseName);
      }

      // Đọc custom metadata
      const custom = getCustomMeta(videoPath);

      // Gộp lại và lưu cache
      const cacheData = {
        filename: file,
        mtime: currentMtime,
        size: currentSize,
        type: meta.hasVideo ? "video" : "audio",
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
        bitrate: meta.bitrate,
        thumb: thumbUrl, // sẽ là null nếu là mp3
        custom,
        storyboard: {
          vtt: `${baseName}.storyboard.vtt`,
          json: `${baseName}.storyboard.json`,
          sprite: `${baseName}.sprite.jpg`,
          frames: sb.totalFrames,
        },
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

// === TẠO STORYBOARD + VTT
function getDuration(videoPath) {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "${videoPath}"`;
  const out = execSync(cmd, { encoding: "utf8" }).trim();
  return parseFloat(out);
}

function generateStoryboard(videoPath, baseName) {
  const duration = getDuration(videoPath);
  const totalFrames = Math.ceil(duration / INTERVAL_SECONDS);
  const rows = Math.ceil(totalFrames / SPRITE_COLS);

  // Đảm bảo ít nhất 1 row
  const safeRows = Math.max(rows, 1);
  const outputSprite = path.join(VIDEO_DIR, `${baseName}.sprite.jpg`);
  const outputVtt = path.join(VIDEO_DIR, `${baseName}.storyboard.vtt`);
  const outputJson = path.join(VIDEO_DIR, `${baseName}.storyboard.json`);

  // 1. Tạo sprite sheet bằng ffmpeg
  // fps=1/10 → 1 frame mỗi 10 giây
  // scale=160:90 → resize thumbnail
  // tile=10xN → xếp grid
  const filter = `fps=1/${INTERVAL_SECONDS},scale=${THUMB_WIDTH}:${THUMB_HEIGHT},tile=${SPRITE_COLS}x${safeRows}`;
  const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -vf "${filter}" -frames:v 1 -q:v 2 "${outputSprite}"`;

  console.log(`[FFMPEG] ${baseName}: ${ffmpegCmd}`);
  execSync(ffmpegCmd);
  // 2. Viết file WebVTT
  let vttContent = "WEBVTT\n\n";
  const storyboardData = [];

  for (let i = 0; i < totalFrames; i++) {
    const startTime = i * INTERVAL_SECONDS;
    const endTime = Math.min((i + 1) * INTERVAL_SECONDS, duration);

    const col = i % SPRITE_COLS;
    const row = Math.floor(i / SPRITE_COLS);
    const x = col * THUMB_WIDTH;
    const y = row * THUMB_HEIGHT;

    const startStr = formatTime(startTime);
    const endStr = formatTime(endTime);
    const spriteUrl = `${baseName}.sprite.jpg#xywh=${x},${y},${THUMB_WIDTH},${THUMB_HEIGHT}`;

    vttContent += `${startStr} --> ${endStr}\n${spriteUrl}\n\n`;

    storyboardData.push({
      start: startTime,
      end: endTime,
      x,
      y,
      w: THUMB_WIDTH,
      h: THUMB_HEIGHT,
      sprite: `${baseName}.sprite.jpg`,
    });
  }

  // 3. Viết file JSON tiện cho frontend
  fs.writeFileSync(
    outputJson,
    JSON.stringify(
      {
        duration,
        interval: INTERVAL_SECONDS,
        thumbWidth: THUMB_WIDTH,
        thumbHeight: THUMB_HEIGHT,
        spriteColumns: SPRITE_COLS,
        frames: storyboardData,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    `✅ Storyboard done: ${baseName} (${totalFrames} frames, ${SPRITE_COLS}x${safeRows} grid)`,
  );

  return { duration, totalFrames, sprite: outputSprite };
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function scanVideos() {
  const files = fs.readdirSync(VIDEO_DIR);
  const videos = files.filter((f) =>
    VIDEO_EXTS.includes(path.extname(f).toLowerCase()),
  );

  const manifest = [];

  for (const file of videos) {
    const videoPath = path.join(VIDEO_DIR, file);
    const baseName = path.basename(file, path.extname(file));

    console.log(`\n🔍 Scanning: ${file}`);

    // Tạo info.json cơ bản (nếu chưa có)
    const infoPath = path.join(VIDEO_DIR, `${baseName}.info.json`);
    let info = {};
    if (fs.existsSync(infoPath)) {
      info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
    }

    // Tạo storyboard
    const sb = generateStoryboard(videoPath, baseName);

    info = {
      ...info,
      filename: file,
      duration: sb.duration,
      storyboard: {
        vtt: `${baseName}.storyboard.vtt`,
        json: `${baseName}.storyboard.json`,
        sprite: `${baseName}.sprite.jpg`,
        frames: sb.totalFrames,
      },
    };

    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
    manifest.push(info);
  }

  // Viết manifest tổng (nếu cần)
  fs.writeFileSync(
    path.join(VIDEO_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log(`\n🎉 Done! Scanned ${videos.length} videos.`);
}

// Chạy chính
(async () => {
  console.log("🚀 FolVid Scanner bắt đầu...\n");

  const { removed } = cleanOrphanCache();
  const { created, updated, skipped, errors } = await buildCache();

  console.log("\n📊 Kết quả:");
  console.log(`   Tạo mới: ${created}`);
  console.log(`   Cập nhật: ${updated}`);
  console.log(`   Giữ nguyên: ${skipped}`);
  console.log(`   Xóa mồ côi: ${removed}`);
  console.log(`   Lỗi: ${errors}`);
  console.log("\n✅ Hoàn tất!");
})();
