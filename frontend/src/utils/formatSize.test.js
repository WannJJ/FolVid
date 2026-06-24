import { describe, expect, it } from "vitest";
import { formatSize } from "./formatSize";

describe("formatSize", () => {
  describe("edge cases & invalid input", () => {
    it('returns "0 B" for null', () => {
      expect(formatSize(null)).toBe("0 B");
    });

    it('returns "0 B" for undefined', () => {
      expect(formatSize(undefined)).toBe("0 B");
    });

    it('returns "0 B" for NaN', () => {
      expect(formatSize(NaN)).toBe("0 B");
    });

    it('returns "0 B" for exactly 0', () => {
      expect(formatSize(0)).toBe("0 B");
    });
  });

  describe("bytes (B)", () => {
    it("formats single byte", () => {
      expect(formatSize(1)).toBe("1.00 B");
      expect(formatSize(512)).toBe("512.00 B");
    });

    it("formats bytes below 1 KB", () => {
      expect(formatSize(1023)).toBe("1023.00 B");
    });
  });

  describe("kilobytes (KB)", () => {
    it("formats exactly 1 KB", () => {
      expect(formatSize(1024)).toBe("1.00 KB");
    });

    it("formats mixed KB values", () => {
      expect(formatSize(1536)).toBe("1.50 KB");
      expect(formatSize(2048)).toBe("2.00 KB");
      expect(formatSize(10240)).toBe("10.00 KB");
    });
  });

  describe("megabytes (MB)", () => {
    it("formats exactly 1 MB", () => {
      expect(formatSize(1024 * 1024)).toBe("1.00 MB");
    });

    it("formats typical video file sizes", () => {
      expect(formatSize(15728640)).toBe("15.00 MB"); // 15 MB
      expect(formatSize(52428800)).toBe("50.00 MB"); // 50 MB
      expect(formatSize(104857600)).toBe("100.00 MB"); // 100 MB
    });
  });

  describe("gigabytes (GB)", () => {
    it("formats exactly 1 GB", () => {
      expect(formatSize(1024 * 1024 * 1024)).toBe("1.00 GB");
    });

    it("formats large video sizes", () => {
      expect(formatSize(5368709120)).toBe("5.00 GB"); // 5 GB
      expect(formatSize(16106127360)).toBe("15.00 GB"); // 15 GB
    });
  });

  describe("terabytes (TB)", () => {
    it("formats exactly 1 TB", () => {
      expect(formatSize(Math.pow(1024, 4))).toBe("1.00 TB");
    });
  });

  describe("custom decimal places", () => {
    it("formats with 0 decimals", () => {
      expect(formatSize(1536, 0)).toBe("2 KB");
      expect(formatSize(1048576, 0)).toBe("1 MB");
    });

    it("formats with 1 decimal", () => {
      expect(formatSize(1536, 1)).toBe("1.5 KB");
    });

    it("formats with 3 decimals", () => {
      expect(formatSize(1536, 3)).toBe("1.500 KB");
    });
  });

  describe("boundary values", () => {
    it("formats just below next unit", () => {
      expect(formatSize(1023 * 1024)).toBe("1023.00 KB"); // Just below 1 MB
    });

    it("formats at unit boundary", () => {
      expect(formatSize(1024 * 1024 - 1)).toBe("1024.00 KB"); // 1048575 bytes
    });
  });
});
