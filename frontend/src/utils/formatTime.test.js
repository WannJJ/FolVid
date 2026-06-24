import { describe, expect, it } from "vitest";
import { formatTime } from "./formatTime";

describe("formatTime", () => {
  describe("edge cases & invalid input", () => {
    it('returns "0:00" for null', () => {
      expect(formatTime(null)).toBe("0:00");
    });

    it('returns "0:00" for undefined', () => {
      expect(formatTime(undefined)).toBe("0:00");
    });

    it('returns "0:00" for NaN', () => {
      expect(formatTime(NaN)).toBe("0:00");
    });

    it('returns "0:00" for negative numbers', () => {
      expect(formatTime(-5)).toBe("0:00");
      expect(formatTime(-999)).toBe("0:00");
    });

    it('returns "0:00" for non-numeric strings', () => {
      expect(formatTime("abc")).toBe("0:00");
    });
  });

  describe("seconds only (MM:SS)", () => {
    it("formats 0 seconds", () => {
      expect(formatTime(0)).toBe("0:00");
    });

    it("formats single digit seconds", () => {
      expect(formatTime(5)).toBe("0:05");
    });

    it("formats double digit seconds", () => {
      expect(formatTime(45)).toBe("0:45");
    });

    it("formats exactly 60 seconds as 1:00", () => {
      expect(formatTime(60)).toBe("1:00");
    });

    it("formats mixed minutes and seconds", () => {
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(125)).toBe("2:05");
      expect(formatTime(599)).toBe("9:59");
    });
  });

  describe("hours included (HH:MM:SS)", () => {
    it("formats exactly 1 hour", () => {
      expect(formatTime(3600)).toBe("1:00:00");
    });

    it("formats 1 hour 1 minute 1 second", () => {
      expect(formatTime(3661)).toBe("1:01:01");
    });

    it("formats long durations", () => {
      expect(formatTime(3666)).toBe("1:01:06");
      expect(formatTime(7322)).toBe("2:02:02");
      expect(formatTime(86399)).toBe("23:59:59");
    });
  });

  describe("decimal seconds", () => {
    it("floors decimal values", () => {
      expect(formatTime(65.9)).toBe("1:05");
      expect(formatTime(0.9)).toBe("0:00");
      expect(formatTime(59.999)).toBe("0:59");
    });
  });
});
