const app = require("./app");
const PORT = 4000;
const { VIDEO_DIR, HLS_DIR } = require("./config");

app.listen(PORT, () => {
  console.log(`✅ Backend chạy tại http://localhost:${PORT}`);
  console.log(`📁 Video gốc: ${VIDEO_DIR}`);
  console.log(`📁 HLS output: ${HLS_DIR}`);
  console.log(`💡 Nhớ chạy "node scan.js" nếu vừa thêm/xóa/sửa video`);
});
