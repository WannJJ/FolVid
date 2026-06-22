const path = require("path");

// Thư mục gốc của backend (đảm bảo dùng __dirname đúng)
const BASE_DIR = __dirname;

const VIDEO_DIR = path.join(BASE_DIR, "videos");
const CACHE_DIR = path.join(BASE_DIR, "cache");
const THUMB_DIR = path.join(CACHE_DIR, "thumbs");
const INFO_DIR = path.join(CACHE_DIR, "info");
const STORYBOARD_DIR = path.join(CACHE_DIR, "storyboard");
const HLS_DIR = path.join(BASE_DIR, "hls");

const VIDEO_EXTS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".mp3",
  ".wav",
  ".aac",
  ".flac",
  ".m4a",
];

module.exports = {
  BASE_DIR,
  VIDEO_DIR,
  CACHE_DIR,
  THUMB_DIR,
  INFO_DIR,
  STORYBOARD_DIR,
  HLS_DIR,
  VIDEO_EXTS,
};
