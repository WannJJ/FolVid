import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UploadModal } from "./UploadModal";

// ─── Mocks ─────────────────────────────────────────────

// Mock stores
const mockFetchVideoList = vi.fn();
const mockSetShowUploadModal = vi.fn();

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({
    showUploadModal: true,
    setShowUploadModal: mockSetShowUploadModal,
  }),
}));

vi.mock("@/stores/useVideoStore", () => ({
  useVideoStore: () => ({
    videos: [
      { custom: { artist: "Sơn Tùng", author: "Nguyễn Văn A", genre: "Pop" } },
      { custom: { artist: "Sơn Tùng", author: "Trần B", genre: "Rock" } },
      { custom: { artist: "Mỹ Tâm", author: "Nguyễn Văn A", genre: "Pop" } },
    ],
    fetchVideoList: mockFetchVideoList,
  }),
}));

// Mock API
const mockUpload = vi.fn();
const mockCreateMetadata = vi.fn();

vi.mock("@/services/videoApi", () => ({
  videoApi: {
    upload: mockUpload,
    createMetadata: mockCreateMetadata,
  },
}));

// Mock formatSize
vi.mock("@/utils/formatSize", () => ({
  formatSize: (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`,
}));

// ─── Helpers ───────────────────────────────────────────

const createFile = (name, type = "video/mp4", size = 1024 * 1024 * 10) => {
  return new File(["dummy"], name, { type, size });
};

const createDragEvent = (files) => ({
  dataTransfer: { files },
  preventDefault: vi.fn(),
});

const renderModal = () => render(<UploadModal />);

// ─── Tests ─────────────────────────────────────────────

describe("UploadModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = "unset";
  });

  afterEach(() => {
    document.body.style.overflow = "unset";
  });

  // ═══════════════════════════════════════════════════
  // 1. RENDER & VISIBILITY
  // ═══════════════════════════════════════════════════

  describe("rendering", () => {
    it("does not render when showUploadModal is false", () => {
      vi.doMock("@/stores/useUIStore", () => ({
        useUIStore: () => ({
          showUploadModal: false,
          setShowUploadModal: mockSetShowUploadModal,
        }),
      }));
      const { container } = render(<UploadModal />);
      expect(container.firstChild).toBeNull();
      vi.doUnmock("@/stores/useUIStore");
    });

    it("renders modal with all sections when visible", () => {
      renderModal();
      expect(screen.getByText("📤 Upload Video")).toBeInTheDocument();
      expect(screen.getByText("Kéo & thả video vào đây")).toBeInTheDocument();
      expect(
        screen.getByText("📝 Thông tin bổ sung (tùy chọn)"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /hủy/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /upload video/i }),
      ).toBeDisabled();
    });

    it("prevents body scroll when open", () => {
      renderModal();
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  // ═══════════════════════════════════════════════════
  // 2. FILE SELECTION
  // ═══════════════════════════════════════════════════

  describe("file selection", () => {
    it("shows file info after selecting valid video", async () => {
      const user = userEvent.setup();
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      const file = createFile("my-video.mp4");

      await user.upload(input, file);

      expect(screen.getByText("my-video.mp4")).toBeInTheDocument();
      expect(screen.getByText("10.0 MB")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /upload video/i }),
      ).toBeEnabled();
    });

    it("shows alert for invalid file type", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const user = userEvent.setup();
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      const invalidFile = createFile("document.pdf", "application/pdf");

      await user.upload(input, invalidFile);

      expect(alertSpy).toHaveBeenCalledWith("Vui lòng chọn file video hợp lệ!");
      expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
      alertSpy.mockRestore();
    });

    it("handles drag and drop", () => {
      renderModal();
      const dropZone = screen
        .getByText("Kéo & thả video vào đây")
        .closest("div");

      // Drag over
      fireEvent.dragOver(dropZone, createDragEvent([]));
      expect(screen.getByText("Thả file vào đây...")).toBeInTheDocument();

      // Drop file
      const file = createFile("dropped.mp4");
      fireEvent.drop(dropZone, createDragEvent([file]));

      expect(screen.getByText("dropped.mp4")).toBeInTheDocument();
    });

    it("clears selected file when clicking remove", async () => {
      const user = userEvent.setup();
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("temp.mp4"));

      const removeBtn = screen.getByRole("button", { name: "✕" });
      await user.click(removeBtn);

      expect(screen.queryByText("temp.mp4")).not.toBeInTheDocument();
      expect(screen.getByText("Kéo & thả video vào đây")).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════
  // 3. AUTOCOMPLETE METADATA
  // ═══════════════════════════════════════════════════

  describe("metadata autocomplete", () => {
    it("shows artist suggestions on focus", async () => {
      const user = userEvent.setup();
      renderModal();

      const artistInput = screen.getByPlaceholderText("Nhập tên nghệ sĩ...");
      await user.click(artistInput);

      expect(screen.getByText("🎤 Sơn Tùng")).toBeInTheDocument();
      expect(screen.getByText("🎤 Mỹ Tâm")).toBeInTheDocument();
    });

    it("filters suggestions based on input", async () => {
      const user = userEvent.setup();
      renderModal();

      const artistInput = screen.getByPlaceholderText("Nhập tên nghệ sĩ...");
      await user.type(artistInput, "Mỹ");

      await waitFor(() => {
        expect(screen.queryByText("🎤 Sơn Tùng")).not.toBeInTheDocument();
        expect(screen.getByText("🎤 Mỹ Tâm")).toBeInTheDocument();
      });
    });

    it("selects suggestion on click", async () => {
      const user = userEvent.setup();
      renderModal();

      const artistInput = screen.getByPlaceholderText("Nhập tên nghệ sĩ...");
      await user.click(artistInput);

      const suggestion = screen.getByText("🎤 Sơn Tùng");
      await user.click(suggestion);

      expect(artistInput).toHaveValue("Sơn Tùng");
    });

    it("deduplicates suggestion values from video list", () => {
      renderModal();
      // "Sơn Tùng" xuất hiện 2 lần trong mock data nhưng chỉ hiện 1 lần
      const sonTungItems = screen.getAllByText(/Sơn Tùng/);
      expect(sonTungItems.length).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════
  // 4. MODAL CLOSING
  // ═══════════════════════════════════════════════════

  describe("closing modal", () => {
    it("closes on X button click", async () => {
      const user = userEvent.setup();
      renderModal();

      const closeBtn = screen.getByRole("button", { name: "✕" });
      await user.click(closeBtn);

      expect(mockSetShowUploadModal).toHaveBeenCalledWith(false);
    });

    it("closes on overlay click", async () => {
      const user = userEvent.setup();
      renderModal();

      const overlay = screen
        .getByText("📤 Upload Video")
        .closest("form").parentElement;
      await user.click(overlay);

      expect(mockSetShowUploadModal).toHaveBeenCalledWith(false);
    });

    it("closes on Escape key", () => {
      renderModal();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(mockSetShowUploadModal).toHaveBeenCalledWith(false);
    });

    it("does not close on overlay click when uploading", async () => {
      const user = userEvent.setup();
      mockUpload.mockImplementation(() => new Promise(() => {})); // never resolves

      renderModal();
      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("uploading.mp4"));

      // Start upload
      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      // Try to close
      const overlay = screen
        .getByText("📤 Upload Video")
        .closest("form").parentElement;
      await user.click(overlay);

      // Should not close while uploading
      expect(mockSetShowUploadModal).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // 5. SUBMIT & UPLOAD FLOW
  // ═══════════════════════════════════════════════════

  describe("upload submission", () => {
    it("shows alert when submitting without file", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const user = userEvent.setup();
      renderModal();

      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      expect(alertSpy).toHaveBeenCalledWith("Vui lòng chọn file video!");
      alertSpy.mockRestore();
    });

    it("uploads video without metadata when no metadata filled", async () => {
      const user = userEvent.setup();
      mockUpload.mockResolvedValueOnce({});
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("plain.mp4"));

      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(expect.any(File));
        expect(mockCreateMetadata).not.toHaveBeenCalled();
        expect(mockFetchVideoList).toHaveBeenCalled();
        expect(mockSetShowUploadModal).toHaveBeenCalledWith(false);
      });
    });

    it("uploads video with metadata when fields are filled", async () => {
      const user = userEvent.setup();
      mockUpload.mockResolvedValueOnce({});
      mockCreateMetadata.mockResolvedValueOnce({});
      renderModal();

      // Fill file
      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("with-meta.mp4"));

      // Fill metadata
      await user.type(
        screen.getByPlaceholderText("Nhập tên nghệ sĩ..."),
        "Sơn Tùng",
      );
      await user.type(
        screen.getByPlaceholderText("Nhập tên tác giả..."),
        "Nguyễn Văn A",
      );
      await user.type(screen.getByPlaceholderText("Nhập thể loại..."), "Pop");

      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(expect.any(File));
        expect(mockCreateMetadata).toHaveBeenCalledWith({
          filename: "with-meta.mp4",
          artist: "Sơn Tùng",
          author: "Nguyễn Văn A",
          genre: "Pop",
          uploadedAt: expect.any(String),
        });
      });
    });

    it("shows loading state during upload", async () => {
      const user = userEvent.setup();
      let resolveUpload;
      mockUpload.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpload = resolve;
          }),
      );
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("slow.mp4"));

      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      expect(screen.getByText("⏳ Uploading...")).toBeInTheDocument();
      expect(screen.getByText(/đang upload/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /hủy/i })).toBeDisabled();

      // Resolve upload
      resolveUpload({});
      await waitFor(() => {
        expect(mockFetchVideoList).toHaveBeenCalled();
      });
    });

    it("handles upload error gracefully", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const user = userEvent.setup();
      mockUpload.mockRejectedValueOnce(new Error("Network error"));
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("fail.mp4"));

      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Có lỗi xảy ra: Network error");
      });

      // Should reset uploading state so user can retry
      expect(
        screen.getByRole("button", { name: /upload video/i }),
      ).toBeEnabled();
      alertSpy.mockRestore();
    });

    it("trims whitespace from metadata before sending", async () => {
      const user = userEvent.setup();
      mockUpload.mockResolvedValueOnce({});
      mockCreateMetadata.mockResolvedValueOnce({});
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("trim.mp4"));

      // Type with extra spaces
      await user.type(
        screen.getByPlaceholderText("Nhập tên nghệ sĩ..."),
        "  Sơn Tùng  ",
      );

      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateMetadata).toHaveBeenCalledWith(
          expect.objectContaining({ artist: "Sơn Tùng" }),
        );
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // 6. ACCESSIBILITY
  // ═══════════════════════════════════════════════════

  describe("accessibility", () => {
    it("has correct form structure", () => {
      renderModal();
      expect(screen.getByRole("form")).toBeInTheDocument();
    });

    it("disables inputs while uploading", async () => {
      const user = userEvent.setup();
      mockUpload.mockImplementation(() => new Promise(() => {}));
      renderModal();

      const input = screen.getByLabelText(/chọn file/i, { selector: "input" });
      await user.upload(input, createFile("uploading.mp4"));

      const submitBtn = screen.getByRole("button", { name: /upload video/i });
      await user.click(submitBtn);

      expect(screen.getByPlaceholderText("Nhập tên nghệ sĩ...")).toBeDisabled();
      expect(screen.getByPlaceholderText("Nhập tên tác giả...")).toBeDisabled();
      expect(screen.getByPlaceholderText("Nhập thể loại...")).toBeDisabled();
    });
  });
});
