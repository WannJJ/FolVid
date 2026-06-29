# 📁 FolVid Video Directory

This folder contains all video files served by the FolVid backend.
Videos placed here are automatically scanned and listed in the web player.

## Supported Video Formats

| Extension       | Notes                                                      |
| --------------- | ---------------------------------------------------------- |
| `.mp4`          | **Recommended** — best browser compatibility (H.264 codec) |
| `.webm`         | Excellent for web; VP8/VP9 codecs                          |
| `.ogg` / `.ogv` | Theora codec support                                       |
| `.mov`          | QuickTime format; browser support varies                   |

> ⚠️ **Not supported:** `.mkv`, `.avi`, `.wmv` — these will not play in standard browsers.

---

## 🏷️ Optional Metadata (`.meta.json`)

For each video file, you may create a companion metadata file with the exact same name plus `.meta.json`.

**Naming rule:**

```
<video-filename>.meta.json
```

| Video File      | Metadata File             |
| --------------- | ------------------------- |
| `concert.mp4`   | `concert.mp4.meta.json`   |
| `tutorial.webm` | `tutorial.webm.meta.json` |
| `my-movie.mov`  | `my-movie.mov.meta.json`  |

> The metadata file is **optional**. If absent, the player will simply show the raw filename.

---

### Metadata Schema

Create a JSON file with any of the following fields:

```json
{
  "title": "Summer Music Festival 2024",
  "artist": "The FolVid Band",
  "author": "Jane Doe",
  "genre": "Live Performance",
  "description": "Full recording of the opening night.",
  "year": 2024,
  "duration": "1:23:45",
  "tags": ["music", "live", "outdoor"]
}
```

### Field Reference

| Field         | Type     | Description                                                            |
| ------------- | -------- | ---------------------------------------------------------------------- |
| `title`       | string   | Display title in the player UI (falls back to filename if empty)       |
| `artist`      | string   | Performing artist or band                                              |
| `author`      | string   | Creator, uploader, or director                                         |
| `genre`       | string   | Category or genre tag                                                  |
| `description` | string   | Short description shown in the UI                                      |
| `year`        | number   | Release or recording year                                              |
| `duration`    | string   | Human-readable duration (for reference only; player reads actual file) |
| `tags`        | string[] | Array of keyword tags for future search/filter features                |

> **Extensible:** You may add custom fields. The backend will include them in the API response so the frontend can display them as needed.

---

## 🚀 How to Add a New Video

1. Copy your video file into this folder (`backend/videos/`).
2. _(Optional)_ Create a `.meta.json` file with the same base name.
3. Reload the FolVid web app — the new video appears instantly in the list.

No server restart is required.

---

## 📋 Example Directory Layout

```
videos/
├── concert.mp4
├── concert.mp4.meta.json
├── tutorial.webm
├── tutorial.webm.meta.json
├── vacation.mov
└── drone-footage.mp4
```

In this example, `vacation.mov` and `drone-footage.mp4` have no metadata and will display with their raw filenames.

---

## 💡 Tips

- Keep filenames simple. Avoid special characters that may need URL-encoding.
- If a video does not appear, check that its extension is in the supported list above.
- Metadata files are ignored by the video scanner; they will never appear as playable items.
