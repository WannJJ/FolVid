import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../test/mocks/server";
import { videoApi } from "./videoApi";

// Mock API_BASE_URL để test deterministic
vi.mock("../config/api.js", () => ({
  API_BASE_URL: "http://localhost:4000",
}));

describe("videoApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // PURE FUNCTIONS - Không gọi API
  // ============================================================

  describe("getVideoSrc", () => {
    it("returns correct video URL", () => {
      const result = videoApi.getVideoSrc("movie.mp4");
      expect(result).toBe("http://localhost:4000/videos/movie.mp4");
    });

    it("encodes special characters in filename", () => {
      const result = videoApi.getVideoSrc("phim có dấu.mp4");
      expect(result).toBe(
        "http://localhost:4000/videos/phim%20c%C3%B3%20d%E1%BA%A5u.mp4",
      );
    });

    it("encodes spaces and symbols", () => {
      const result = videoApi.getVideoSrc("file name [2024].mp4");
      expect(result).toBe(
        "http://localhost:4000/videos/file%20name%20%5B2024%5D.mp4",
      );
    });
  });

  describe("getThumbnailSrc", () => {
    it("prepends base URL to thumbnail path", () => {
      const result = videoApi.getThumbnailSrc("/thumbs/preview.jpg");
      expect(result).toBe("http://localhost:4000/thumbs/preview.jpg");
    });

    it("handles empty path", () => {
      const result = videoApi.getThumbnailSrc("");
      expect(result).toBe("http://localhost:4000");
    });
  });

  describe("getHlsSrc", () => {
    it("returns HLS manifest URL without extension", () => {
      const result = videoApi.getHlsSrc("movie.mp4");
      expect(result).toBe("http://localhost:4000/hls/movie/index.m3u8");
    });

    it("handles files with multiple dots", () => {
      const result = videoApi.getHlsSrc("my.movie.2024.webm");
      expect(result).toBe("http://localhost:4000/hls/my.movie.2024/index.m3u8");
    });

    it("handles no extension", () => {
      const result = videoApi.getHlsSrc("movie");
      expect(result).toBe("http://localhost:4000/hls/movie/index.m3u8");
    });
  });

  describe("getStoryboardSpriteSrc", () => {
    it("prepends base URL to sprite link", () => {
      const result = videoApi.getStoryboardSpriteSrc("/sprites/sprite1.jpg");
      expect(result).toBe("http://localhost:4000/sprites/sprite1.jpg");
    });
  });

  // ============================================================
  // ASYNC FUNCTIONS - Gọi API (dùng MSW)
  // ============================================================

  describe("getList", () => {
    it("returns array of video filenames", async () => {
      const videos = await videoApi.getList();
      expect(videos).toEqual(["video1.mp4", "video2.webm", "clip.mov"]);
    });

    it("throws error when server returns 500", async () => {
      server.use(
        http.get("http://localhost:4000/api/videos", () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(videoApi.getList()).rejects.toThrow(
        "Không tải được danh sách",
      );
    });

    it("throws error when network fails", async () => {
      server.use(
        http.get("http://localhost:4000/api/videos", () => {
          return HttpResponse.error();
        }),
      );

      await expect(videoApi.getList()).rejects.toThrow();
    });
  });

  describe("rename", () => {
    it("renames video successfully", async () => {
      const result = await videoApi.rename("old.mp4", "new.mp4");
      expect(result.ok).toBe(true);
    });

    it("throws error when new name already exists", async () => {
      await expect(videoApi.rename("old.mp4", "existing.mp4")).rejects.toThrow(
        "File đã tồn tại",
      );
    });

    it("encodes oldName in URL", async () => {
      // MSW sẽ bắt request này, ta chỉ cần đảm bảo không throw
      await expect(
        videoApi.rename("phim cũ.mp4", "phim mới.mp4"),
      ).resolves.toBeDefined();
    });

    it("throws generic error for unknown status", async () => {
      server.use(
        http.put("http://localhost:4000/api/videos/:name", () => {
          return new HttpResponse("Internal Server Error", { status: 500 });
        }),
      );

      await expect(videoApi.rename("old.mp4", "new.mp4")).rejects.toThrow(
        "Internal Server Error",
      );
    });

    it("throws statusText when response body is empty", async () => {
      server.use(
        http.put("http://localhost:4000/api/videos/:name", () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: "Server Error",
          });
        }),
      );

      await expect(videoApi.rename("old.mp4", "new.mp4")).rejects.toThrow(
        "Server Error",
      );
    });
  });

  describe("upload", () => {
    it("uploads valid video file", async () => {
      const file = new File(["video content"], "test.mp4", {
        type: "video/mp4",
      });

      const result = await videoApi.upload(file);

      expect(result.filename).toBe("test.mp4");
      expect(result.message).toBe("Upload thành công");
    });

    it("rejects invalid file extension", async () => {
      const file = new File(["content"], "virus.exe", {
        type: "application/x-msdownload",
      });

      // Hàm sẽ alert và return undefined (không throw)
      const result = await videoApi.upload(file);
      expect(result).toBeUndefined();
    });

    it("rejects .mkv extension", async () => {
      const file = new File(["content"], "movie.mkv", {
        type: "video/x-matroska",
      });

      const result = await videoApi.upload(file);
      expect(result).toBeUndefined();
    });

    it("accepts .mp3 (theo validExts)", async () => {
      const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });

      const result = await videoApi.upload(file);
      expect(result.filename).toBe("song.mp3");
    });

    it("throws when server returns 400", async () => {
      server.use(
        http.post("http://localhost:4000/api/upload", () => {
          return new HttpResponse(JSON.stringify({ error: "File quá lớn" }), {
            status: 400,
          });
        }),
      );

      const file = new File(["content"], "test.mp4", { type: "video/mp4" });

      await expect(videoApi.upload(file)).rejects.toThrow("File quá lớn");
    });
  });

  describe("createMetadata", () => {
    it("creates metadata successfully", async () => {
      const metadata = {
        title: "Phim hay",
        description: "Mô tả phim",
        duration: 120,
      };

      await expect(videoApi.createMetadata(metadata)).resolves.toBeUndefined();
    });

    it("throws when server returns error", async () => {
      server.use(
        http.post("http://localhost:4000/api/metadata", () => {
          return new HttpResponse(JSON.stringify({ error: "Database error" }), {
            status: 500,
          });
        }),
      );

      const metadata = { title: "Test" };

      await expect(videoApi.createMetadata(metadata)).rejects.toThrow(
        "Lưu metadata thất bại",
      );
    });
  });

  describe("getStorboardData", () => {
    it("returns storyboard data", async () => {
      const data = await videoApi.getStorboardData("movie.mp4");

      expect(data.duration).toBe(120);
      expect(data.sprites).toHaveLength(2);
      expect(data.sprites[0]).toEqual({ time: 0, x: 0, y: 0 });
    });

    it("removes extension from filename", async () => {
      // movie.mp4 -> movie.storyboard.json
      const data = await videoApi.getStorboardData("my.video.2024.mp4");
      expect(data).toBeDefined(); // MSW bắt được là đúng
    });

    it("throws when storyboard not found", async () => {
      await expect(
        videoApi.getStorboardData("nonexistent.mp4"),
      ).rejects.toThrow("Không tải được Storyboard");
    });
  });
});
