import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDocumentTitle } from "./useDocumentTitle";

describe("useDocumentTitle", () => {
  const ORIGINAL_TITLE = "Original Test Page Title";

  beforeEach(() => {
    // Đảm bảo title gốc trước mỗi test
    document.title = ORIGINAL_TITLE;
  });

  afterEach(() => {
    // Dọn dẹp: đảm bảo title được restore sau test
    document.title = ORIGINAL_TITLE;
  });

  it("sets document title on mount when title is provided", () => {
    renderHook(() => useDocumentTitle("My Video Player"));
    expect(document.title).toBe("My Video Player");
  });

  it("restores original title on unmount", () => {
    const { unmount } = renderHook(() => useDocumentTitle("Temp Title"));
    expect(document.title).toBe("Temp Title");

    unmount();
    expect(document.title).toBe(ORIGINAL_TITLE);
  });

  it("restores original title when deps change, then sets new title", () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title, [title]),
      { initialProps: { title: "First Title" } },
    );

    expect(document.title).toBe("First Title");

    // Khi deps đổi, cleanup của effect cũ chạy trước (restore original)
    // rồi effect mới chạy (set title mới)
    rerender({ title: "Second Title" });
    expect(document.title).toBe("Second Title");

    // Unmount cuối cùng phải restore về original
    const { unmount } = renderHook(
      ({ title }) => useDocumentTitle(title, [title]),
      { initialProps: { title: "Second Title" } },
    );
    unmount();
    expect(document.title).toBe(ORIGINAL_TITLE);
  });

  it("does not modify title if title is empty string", () => {
    renderHook(() => useDocumentTitle(""));
    expect(document.title).toBe(ORIGINAL_TITLE);
  });

  it("does not modify title if title is null or undefined", () => {
    const { unmount } = renderHook(() => useDocumentTitle(null));
    expect(document.title).toBe(ORIGINAL_TITLE);
    unmount();
    expect(document.title).toBe(ORIGINAL_TITLE);
  });

  it("uses deps array correctly (only re-runs when deps change)", () => {
    let externalCounter = 0;

    const { rerender, unmount } = renderHook(
      () => useDocumentTitle("Static Title", [externalCounter]),
      { initialProps: {} },
    );

    expect(document.title).toBe("Static Title");

    // Không đổi deps, title vẫn giữ nguyên
    rerender();
    expect(document.title).toBe("Static Title");

    unmount();
    expect(document.title).toBe(ORIGINAL_TITLE);
  });
});
