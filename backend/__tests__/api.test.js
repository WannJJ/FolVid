const request = require("supertest");
const app = require("../app");
const fs = require("fs");
const path = require("path");

const VIDEO_DIR = path.join(__dirname, "../videos");

// Helper: dọn dẹp thư mục videos trước mỗi test
beforeEach(() => {
  // Xóa hết file trong videos/ test (nếu cần)
  // Hoặc đơn giản hơn: tạo thư mục `videos/` nếu chưa có
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR);
  }
});

describe("GET /api/videos", () => {
  test("trả về mảng rỗng khi không có video", async () => {
    // Đảm bảo thư mục trống
    const res = await request(app).get("/api/videos");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("chỉ trả về file có đuôi video", async () => {
    // Tạo file giả lập
    fs.writeFileSync(path.join(VIDEO_DIR, "phim1.mp4"), "fake video");
    fs.writeFileSync(path.join(VIDEO_DIR, "readme.txt"), "not a video");

    const res = await request(app).get("/api/videos");
    expect(res.body).toContain("phim1.mp4");
    expect(res.body).not.toContain("readme.txt");
    expect(res.body.length).toBe(1);

    // Dọn dẹp
    fs.unlinkSync(path.join(VIDEO_DIR, "phim1.mp4"));
    fs.unlinkSync(path.join(VIDEO_DIR, "readme.txt"));
  });
});

describe("GET /videos/:filename", () => {
  test("trả về 404 nếu file không tồn tại", async () => {
    const res = await request(app).get("/videos/khong-ton-tai.mp4");
    expect(res.statusCode).toBe(404);
  });
});
