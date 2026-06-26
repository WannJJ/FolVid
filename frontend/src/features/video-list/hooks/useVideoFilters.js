import { useMemo, useState } from "react";

export function useVideoFilters(videos) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    genre: "",
    artist: "",
    minDuration: "",
    maxDuration: "",
    resolution: "",
  });

  const filteredVideos = useMemo(() => {
    const q = search.toLowerCase();
    const min = filters.minDuration ? parseInt(filters.minDuration) * 60 : 0;
    const max = filters.maxDuration
      ? parseInt(filters.maxDuration) * 60
      : Infinity;

    return videos.filter((v) => {
      const matchSearch =
        !q ||
        v.filename.toLowerCase().includes(q) ||
        (v.custom?.artist && v.custom.artist.toLowerCase().includes(q));

      const matchGenre = !filters.genre || v.custom?.genre === filters.genre;
      const matchArtist =
        !filters.artist || v.custom?.artist === filters.artist;
      const matchRes =
        !filters.resolution || `${v.width}x${v.height}` === filters.resolution;
      const matchDuration =
        (v.duration || 0) >= min && (v.duration || 0) <= max;

      return (
        matchSearch && matchGenre && matchArtist && matchRes && matchDuration
      );
    });
  }, [videos, search, filters]);

  return { search, setSearch, filters, setFilters, filteredVideos };
}
