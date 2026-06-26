import { videoApi } from "@/services/videoApi";
import { useEffect, useState } from "react";

export function useStoryboard(video) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStoryboard = async () => {
      if (!video || !video.type || !video.storyboard) {
        setData(null);
        return;
      }

      try {
        const sbData = await videoApi.getStoryboardData(video.filename);
        setData(sbData);
      } catch (err) {
        console.error("Storyboard load error:", err);
      }
    };
    fetchStoryboard();
  }, [video]);

  return data;
}
