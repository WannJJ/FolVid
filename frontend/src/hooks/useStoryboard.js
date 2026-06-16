import { useEffect, useState } from "react";

const API = "http://localhost:4000";

export function useStoryboard(videoName) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!videoName) return;
    const baseName = videoName.replace(/\.[^/.]+$/, "");

    fetch(`${API}/cache/storyboard/${baseName}.storyboard.json`)
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("Storyboard load error:", err));
  }, [videoName]);

  return data;
}
