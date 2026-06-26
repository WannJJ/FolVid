import { useUIStore } from "@/stores/useUIStore";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SideBar } from "./SideBar";

// ── 1. Mock CSS Module ─────────────────────────────────────────────
// Trong test, mỗi class sẽ trả về chính tên key để dễ query
vi.mock("./SideBar.module.css", () => ({
  default: {
    sidebar: "sidebar",
    overlay: "overlay",
    open: "open",
  },
}));

// ── 2. Mock Zustand Store ────────────────────────────────────────
vi.mock("@/stores/useUIStore");

describe("SideBar", () => {
  const mockSetSidebarOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.mockReturnValue({
      sidebarOpen: false,
      setSidebarOpen: mockSetSidebarOpen,
    });
  });

  // ── Render cơ bản ──────────────────────────────────────────────
  it("renders children inside sidebar", () => {
    render(
      <SideBar>
        <nav data-testid="menu">Menu Content</nav>
      </SideBar>,
    );

    expect(screen.getByTestId("menu")).toBeInTheDocument();
  });

  // ── Kiểm tra class động theo state ─────────────────────────────
  it("does NOT have 'open' class when sidebarOpen is false", () => {
    const { container } = render(
      <SideBar>
        <div>Content</div>
      </SideBar>,
    );

    expect(container.querySelector(".overlay")).not.toHaveClass("open");
    expect(container.querySelector(".sidebar")).not.toHaveClass("open");
  });

  it("HAS 'open' class when sidebarOpen is true", () => {
    useUIStore.mockReturnValue({
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });

    const { container } = render(
      <SideBar>
        <div>Content</div>
      </SideBar>,
    );

    expect(container.querySelector(".overlay")).toHaveClass("open");
    expect(container.querySelector(".sidebar")).toHaveClass("open");
  });

  // ── Tương tác: đóng sidebar ─────────────────────────────────────
  it("calls setSidebarOpen(false) when overlay is clicked", () => {
    const { container } = render(
      <SideBar>
        <div>Content</div>
      </SideBar>,
    );

    fireEvent.click(container.querySelector(".overlay"));
    expect(mockSetSidebarOpen).toHaveBeenCalledTimes(1);
    expect(mockSetSidebarOpen).toHaveBeenCalledWith(false);
  });

  // ── Context Menu behavior ───────────────────────────────────────
  it("prevents default context menu when right-clicking INSIDE sidebar", () => {
    const { container } = render(
      <SideBar>
        <div data-testid="inside">Item</div>
      </SideBar>,
    );

    const sidebar = container.querySelector(".sidebar");
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    sidebar.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("does NOT prevent default context menu when right-clicking OUTSIDE sidebar", () => {
    render(
      <SideBar>
        <div>Content</div>
      </SideBar>,
    );

    // Tạo một element nằm ngoài sidebar, append vào body để event bubble đúng
    const outsideNode = document.createElement("div");
    document.body.appendChild(outsideNode);

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    outsideNode.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();

    // Dọn dẹp
    document.body.removeChild(outsideNode);
  });

  // ── Cleanup khi unmount ──────────────────────────────────────────
  it("removes document contextmenu listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <SideBar>
        <div>Content</div>
      </SideBar>,
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("contextmenu", expect.any(Function));

    removeSpy.mockRestore();
  });
});
