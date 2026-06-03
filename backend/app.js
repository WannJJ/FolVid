const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
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

module.exports = app;
