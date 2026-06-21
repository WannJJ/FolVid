const { execSync } = require("child_process");

/**
 * Lấy duration của video bằng ffprobe
 * @param {string} videoPath - đường dẫn tuyệt đối đến file video
 * @returns {number} - duration tính bằng giây, hoặc 0 nếu lỗi
 */
function getDuration(videoPath) {
  try {
    // escape dấu " trong path để tránh lỗi command injection
    const safePath = videoPath.replace(/"/g, '\\"');
    const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "${safePath}"`;
    const out = execSync(cmd, { encoding: "utf8", timeout: 10000 }).trim();
    const duration = parseFloat(out);
    return isFinite(duration) ? duration : 0;
  } catch (err) {
    console.error(`[getDuration] Lỗi với file: ${videoPath}`, err.message);
    return 0;
  }
}

module.exports = { getDuration };
