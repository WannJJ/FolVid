import { beforeEach, describe, expect, test } from "vitest";
import { loadState, saveState } from "../utils/playerState";

describe("playerState", () => {
  // Dọn localStorage trước mỗi test để không bị ảnh hưởng
  beforeEach(() => {
    localStorage.clear();
  });

  test("lưu và đọc state đúng", () => {
    const state = { filename: "test.mp4", currentTime: 120, playbackRate: 1.5 };
    saveState(state);
    const loaded = loadState();
    expect(loaded).toEqual(state);
  });

  test("trả về null nếu chưa có gì", () => {
    expect(loadState()).toBeNull();
  });
});
