const request = require("supertest");
const mockFs = require("mock-fs");
const path = require("path");
const fs = require("fs");

// --- 1. Mock config TRƯỚC KHI require app ---
// Để app.js dùng đường dẫn ảo thay vì đường dẫn thật trên máy
const mockTestRoot = path.join(__dirname, "..", "test-temp");

jest.mock("../config", () => {
  const p = require("path");
  return {
    VIDEO_DIR: p.join(mockTestRoot, "videos"),
    CACHE_DIR: p.join(mockTestRoot, "cache"),
    THUMB_DIR: p.join(mockTestRoot, "cache", "thumbs"),
    INFO_DIR: p.join(mockTestRoot, "cache", "info"),
    STORYBOARD_DIR: p.join(mockTestRoot, "cache", "storyboard"),
    HLS_DIR: p.join(mockTestRoot, "hls"),
    VIDEO_EXTS: [".mp4", ".webm", ".ogg", ".mov"],
  };
});

const app = require("../app");

// Helper tạo buffer giả lập file MP4 (để multer nhận diện qua magic bytes)
function fakeMp4Buffer(size = 1024) {
  const buf = Buffer.alloc(size);
  // ftyp box signature giúp một số tool nhận diện, nhưng với test này
  // chỉ cần buffer bất kỳ vì multer của ta lọc theo extname
  buf.write("ftyp", 4);
  return buf;
}

describe("FolVid Backend API", () => {
  afterEach(() => {
    mockFs.restore();
  });

  // ==========================================
  // GET /api/videos
  // ==========================================
  describe("GET /api/videos", () => {
    test("trả về mảng rỗng nếu INFO_DIR không tồn tại", async () => {
      mockFs({
        [path.join(mockTestRoot, "videos")]: {
          "clip.mp4": fakeMp4Buffer(),
        },
        // Không tạo INFO_DIR
      });

      const res = await request(app).get("/api/videos");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("trả về danh sách từ cache nếu JSON hợp lệ và khớp filename", async () => {
      const cachedData = {
        filename: "movie.mp4",
        url: "/videos/movie.mp4",
        thumb: "/cache/thumbs/movie.jpg",
        width: 1920,
        height: 1080,
        duration: 120,
        size: 5000000,
        bitrate: 5000,
        custom: { artist: "A", author: "B", genre: "C" },
      };

      mockFs({
        [path.join(mockTestRoot, "videos")]: {
          "movie.mp4": fakeMp4Buffer(5000),
          "readme.txt": "abc",
        },
        [path.join(mockTestRoot, "cache", "info")]: {
          "movie.mp4.json": JSON.stringify(cachedData),
        },
      });

      const res = await request(app).get("/api/videos");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject(cachedData);
    });

    test("trả về fallback nếu cache filename không khớp (đổi tên ngoài ý muốn)", async () => {
      mockFs({
        [path.join(mockTestRoot, "videos")]: {
          "new-name.mp4": fakeMp4Buffer(2048),
        },
        [path.join(mockTestRoot, "cache", "info")]: {
          "new-name.mp4.json": JSON.stringify({ filename: "old-name.mp4" }),
        },
      });

      const res = await request(app).get("/api/videos");
      expect(res.status).toBe(200);
      expect(res.body[0].filename).toBe("new-name.mp4");
      expect(res.body[0].duration).toBe(0);
      expect(res.body[0].size).toBe(2048);
    });

    test("trả về fallback nếu file JSON bị hỏng (catch parse error)", async () => {
      mockFs({
        [path.join(mockTestRoot, "videos")]: {
          "corrupt.mp4": fakeMp4Buffer(1000),
        },
        [path.join(mockTestRoot, "cache", "info")]: {
          "corrupt.mp4.json": "this is not json {",
        },
      });

      const res = await request(app).get("/api/videos");
      expect(res.status).toBe(200);
      expect(res.body[0].filename).toBe("corrupt.mp4");
      expect(res.body[0].size).toBe(1000);
    });

    test("chỉ lọc file có đuôi video, bỏ qua ảnh và txt", async () => {
      mockFs({
        [path.join(mockTestRoot, "videos")]: {
          "a.mp4": fakeMp4Buffer(100),
          "b.webm": fakeMp4Buffer(200),
          "photo.jpg": "fake-image",
          "note.txt": "hello",
        },
        [path.join(mockTestRoot, "cache", "info")]: {},
      });

      const res = await request(app).get("/api/videos");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const names = res.body.map((v) => v.filename);
      expect(names).toContain("a.mp4");
      expect(names).toContain("b.webm");
      expect(names).not.toContain("photo.jpg");
    });
  });

  // ==========================================
  // GET /api/videos/hls
  // ==========================================
  describe("GET /api/videos/hls", () => {
    test("trả về danh sách thư mục có index.m3u8", async () => {
      mockFs({
        [path.join(mockTestRoot, "hls")]: {
          vid1: {
            "index.m3u8": "#EXTM3U\n",
            "seg1.ts": "binary",
          },
          vid2: {
            "index.m3u8": "#EXTM3U\n",
          },
          vid3: {
            // không có index.m3u8
            "seg1.ts": "binary",
          },
        },
      });

      const res = await request(app).get("/api/videos/hls");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(["vid1", "vid2"]);
    });

    test("trả về 500 nếu thư mục HLS không đọc được", async () => {
      mockFs({
        [path.join(mockTestRoot, "hls")]: mockFs.directory({ mode: 0 }), // không có quyền đọc
      });

      const res = await request(app).get("/api/videos/hls");
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  });
});
