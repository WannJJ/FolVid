import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

// Giả sử bạn tách Sidebar thành component riêng
function VideoList({ videos, onSelect, currentVideo }) {
  return (
    <ul>
      {videos.map((v) => (
        <li
          key={v}
          onClick={() => onSelect(v)}
          style={{ background: currentVideo === v ? "blue" : "gray" }}
        >
          {v}
        </li>
      ))}
    </ul>
  );
}

describe("VideoList", () => {
  test("hiển thị đúng số lượng video", () => {
    const videos = ["phim1.mp4", "phim2.mp4"];
    render(
      <VideoList videos={videos} onSelect={() => {}} currentVideo={null} />,
    );

    expect(screen.getByText("phim1.mp4")).toBeInTheDocument();
    expect(screen.getByText("phim2.mp4")).toBeInTheDocument();
  });

  test("gọi onSelect khi click video", () => {
    const mockSelect = vi.fn(); // vi.fn() là spy function của Vitest
    const videos = ["phim1.mp4"];

    render(
      <VideoList videos={videos} onSelect={mockSelect} currentVideo={null} />,
    );
    fireEvent.click(screen.getByText("phim1.mp4"));

    expect(mockSelect).toHaveBeenCalledWith("phim1.mp4");
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  test("highlight video đang chọn", () => {
    render(
      <VideoList videos={["a.mp4"]} onSelect={() => {}} currentVideo="a.mp4" />,
    );
    const item = screen.getByText("a.mp4");
    expect(item).toHaveStyle({ background: "blue" });
  });
});
