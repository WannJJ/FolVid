import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useMediaQuery from "./useMediaQuery";

describe("useMediaQuery", () => {
  // Biến lưu các listener để giả lập sự kiện "change" từ matchMedia
  let listeners = [];

  // Hàm tạo mock matchMedia instance
  const createMatchMedia = (initialMatches) => {
    return (query) => ({
      matches: initialMatches,
      media: query,
      addEventListener: vi.fn((event, callback) => {
        listeners.push(callback);
      }),
      removeEventListener: vi.fn((event, callback) => {
        listeners = listeners.filter((l) => l !== callback);
      }),
      dispatchEvent: vi.fn(),
    });
  };

  beforeEach(() => {
    listeners = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when media query matches initially", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(true);
  });

  it("returns false when media query does not match initially", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(false);
  });

  it("updates matches when media query change event fires", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(false);

    // Giả lập trình duyệt thay đổi kích thước → matchMedia phát sự kiện change
    act(() => {
      if (listeners.length > 0) {
        listeners.forEach((listener) => listener({ matches: true }));
      }
    });

    expect(result.current).toBe(true);
  });

  it("updates matches when query prop changes", () => {
    window.matchMedia = createMatchMedia(true);

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: "(min-width: 768px)" } },
    );

    expect(result.current).toBe(true);

    // Đổi sang query khác, giả lập không match
    window.matchMedia = createMatchMedia(false);
    rerender({ query: "(min-width: 1200px)" });

    expect(result.current).toBe(false);
  });

  it("removes event listener on unmount", () => {
    const removeEventListenerSpy = vi.fn();

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("registers new listener when query changes and cleans up old one", () => {
    const removeEventListenerSpy = vi.fn();
    const addEventListenerSpy = vi.fn();

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
    }));

    const { rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: "(min-width: 768px)" },
    });

    // Lần đầu mount: addEventListener được gọi 1 lần
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    // Rerender với query mới → effect chạy lại, cleanup effect cũ trước
    rerender({ query: "(max-width: 480px)" });

    // Cleanup effect cũ phải gọi removeEventListener
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    // Và addEventListener cho query mới
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  });
});
