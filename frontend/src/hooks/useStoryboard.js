import { API_BASE_URL } from "@/config/api";
import { useEffect, useState } from "react";

export function useStoryboard(video) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!video || !video.type || !video.storyboard) {
      setData(null);
      return;
    }
    const videoName = video.filename;
    const baseName = videoName.replace(/\.[^/.]+$/, "");

    fetch(`${API_BASE_URL}/cache/storyboard/${baseName}.storyboard.json`)
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("Storyboard load error:", err));
  }, [video]);

  return data;
}
