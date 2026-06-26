import { videoApi } from "@/services/videoApi";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStoryboard } from "./useStoryboard";

// Mock module API để không gọi thật ra server
vi.mock("@/services/videoApi", () => ({
  videoApi: {
    getStorboardData: vi.fn(),
  },
}));

describe("useStoryboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Guard clauses ───────────────────────────────────────────
  it("returns null and does not call API when video is null", () => {
    const { result } = renderHook(() => useStoryboard(null));
    expect(result.current).toBeNull();
    expect(videoApi.getStorboardData).not.toHaveBeenCalled();
  });

  it("returns null and does not call API when video lacks 'type'", () => {
    const video = { filename: "a.mp4", storyboard: true };
    const { result } = renderHook(() => useStoryboard(video));
    expect(result.current).toBeNull();
    expect(videoApi.getStorboardData).not.toHaveBeenCalled();
  });

  it("returns null and does not call API when video lacks 'storyboard'", () => {
    const video = { filename: "a.mp4", type: "video/mp4" };
    const { result } = renderHook(() => useStoryboard(video));
    expect(result.current).toBeNull();
    expect(videoApi.getStorboardData).not.toHaveBeenCalled();
  });

  // ─── Happy path ──────────────────────────────────────────────
  it("fetches and returns storyboard data for a valid video", async () => {
    const mockData = {
      url: "http://localhost/storyboards/test.jpg",
      frames: 50,
      interval: 10,
    };
    videoApi.getStorboardData.mockResolvedValue(mockData);

    const video = { filename: "test.mp4", type: "video/mp4", storyboard: true };
    const { result } = renderHook(() => useStoryboard(video));

    // Ban đầu chưa có data
    expect(result.current).toBeNull();

    // Chờ effect chạy xong và state update
    await waitFor(() => {
      expect(result.current).toEqual(mockData);
    });

    expect(videoApi.getStorboardData).toHaveBeenCalledExactlyOnceWith(
      "test.mp4",
    );
  });

  // ─── Error handling ──────────────────────────────────────────
  it("keeps data as null and logs error when API fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    videoApi.getStorboardData.mockRejectedValue(new Error("Network error"));

    const video = { filename: "test.mp4", type: "video/mp4", storyboard: true };
    const { result } = renderHook(() => useStoryboard(video));

    // Chờ effect chạy (bất đồng bộ)
    await waitFor(() => {
      expect(videoApi.getStorboardData).toHaveBeenCalled();
    });

    // Trong catch bạn không setState nên data vẫn null
    expect(result.current).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Storyboard load error:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  // ─── Re-fetch on dependency change ───────────────────────────
  it("refetches when video filename changes", async () => {
    const mockDataA = { frames: 10 };
    const mockDataB = { frames: 20 };

    videoApi.getStorboardData
      .mockResolvedValueOnce(mockDataA)
      .mockResolvedValueOnce(mockDataB);

    const videoA = { filename: "a.mp4", type: "video/mp4", storyboard: true };
    const { result, rerender } = renderHook(
      ({ video }) => useStoryboard(video),
      { initialProps: { video: videoA } },
    );

    // Lần 1
    await waitFor(() => expect(result.current).toEqual(mockDataA));
    expect(videoApi.getStorboardData).toHaveBeenCalledWith("a.mp4");

    // Đổi sang video khác
    const videoB = { filename: "b.mp4", type: "video/mp4", storyboard: true };
    rerender({ video: videoB });

    // Lần 2
    await waitFor(() => expect(result.current).toEqual(mockDataB));
    expect(videoApi.getStorboardData).toHaveBeenCalledWith("b.mp4");
    expect(videoApi.getStorboardData).toHaveBeenCalledTimes(2);
  });
});
