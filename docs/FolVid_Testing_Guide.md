# Hướng Dẫn Kiểm Thử (Testing) Toàn Diện cho FolVid

> **Dự án:** FolVid — Ứng dụng phát video từ thư mục (React + Vite + Node.js)  
> **Mục tiêu:** Hướng dẫn từ con số 0 đến việc viết test tự động cho cả Backend và Frontend.  
> **Ngày cập nhật:** 2026-05-25

---

## Mục lục

1. [Tại sao phải test?](#1-tại-sao-phải-test)
2. [Các loại kiểm thử phần mềm](#2-các-loại-kiểm-thử-phần-mềm)
3. [Nguyên tắc viết test hiệu quả](#3-nguyên-tắc-viết-test-hiệu-quả)
4. [Testing Backend (Node.js + Express)](#4-testing-backend-nodejs--express)
5. [Testing Frontend (React + Vite)](#5-testing-frontend-react--vite)
6. [Testing localStorage và Session State](#6-testing-localstorage-và-session-state)
7. [Các test case "must-have" cho FolVid](#7-các-test-case-must-have-cho-folvid)
8. [Cấu trúc thư mục sau khi thêm testing](#8-cấu-trúc-thư-mục-sau-khi-thêm-testing)
9. [Chạy test và đọc kết quả](#9-chạy-test-và-đọc-kết-quả)
10. [CI/CD tự động hóa (GitHub Actions)](#10-cicd-tự-động-hóa-github-actions)
11. [FAQ & Troubleshooting](#11-faq--troubleshooting)
12. [Cheat Sheet nhanh](#12-cheat-sheet-nhanh)
13. [Lưu ý quan trọng cuối cùng](#13-lưu-ý-quan-trọng-cuối-cùng)

---

## 1. Tại sao phải test?

### 1.1. Định nghĩa

**Kiểm thử phần mềm (Software Testing)** là quá trình chạy chương trình để phát hiện lỗi, đảm bảo phần mềm hoạt động đúng như mong đợi.

### 1.2. Tại sao FolVid cần test?

| Vùng dễ lỗi                         | Hậu quả nếu không test                                  |
| ----------------------------------- | ------------------------------------------------------- |
| API `/api/videos` lọc sai định dạng | Hiển thị cả file `.txt`, `.jpg` trong danh sách video   |
| Logic `localStorage` restore        | Mở tab mới bị ép xem video cũ, hoặc mất hết tiến độ xem |
| Gán `src` cho thẻ `<video>`         | Video không phát, hoặc request 404 không rõ nguyên nhân |
| Nút đổi tốc độ / âm lượng           | Click không có tác dụng, user nghĩ là trình duyệt lỗi   |
| Refactor code sau này               | Sửa một chỗ, hỏng ba chỗ khác mà không hay biết         |

### 1.3. Lợi ích của test tự động

- **Tự tin refactor:** Thay đổi cấu trúc code mà không sợ hỏng tính năng cũ.
- **Tài liệu sống:** Test mô tả cách hàm/component hoạt động đúng.
- **Phát hiện lỗi sớm:** Lỗi phát hiện khi viết code rẻ hơn lỗi phát hiện khi đã deploy.
- **Regression testing:** Mỗi lần thêm tính năng mới, chạy lại toàn bộ test cũ để đảm bảo không ảnh hưởng.

---

## 2. Các loại kiểm thử phần mềm

### 2.1. Phân loại theo phạm vi

```
┌─────────────────────────────────────────────┐
│           End-to-End (E2E) Testing          │  ← Giả lập user thật click trên browser
│  ┌───────────────────────────────────────┐  │     Playwright, Cypress
│  │      Integration Testing              │  │  ← Test nhiều module kết hợp
│  │  ┌───────────────────────────────┐   │  │     API + Database, Component + API
│  │  │     Unit Testing              │   │  │  ← Test hàm/component đơn lẻ
│  │  │  (Hàm, Component, Hook)      │   │  │     Jest, Vitest
│  │  └───────────────────────────────┘   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

| Loại                 | Mô tả                                         | Ví dụ trong FolVid                                                       | Công cụ                           |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| **Unit Test**        | Test đơn vị nhỏ nhất: hàm, component riêng lẻ | Hàm `loadState()`, component `VideoList` render đúng                     | Jest, Vitest                      |
| **Integration Test** | Test nhiều đơn vị phối hợp                    | API trả danh sách → React hiển thị đúng                                  | Supertest + React Testing Library |
| **E2E Test**         | Test toàn bộ luồng từ đầu đến cuối            | User mở web → chọn video → phát → tua → đóng tab → mở lại vẫn đúng video | Playwright, Cypress               |

### 2.2. Phân loại theo cách tiếp cận

- **Black-box testing:** Không cần biết code bên trong, chỉ quan tâm input/output. Ví dụ: gửi request đến API, kiểm tra JSON trả về.
- **White-box testing:** Biết cấu trúc code bên trong, test từng nhánh `if/else`. Ví dụ: test hàm lọc đuôi file `.mp4` với cả trường hợp chữ hoa/chữ thường.

### 2.3. Chiến lược cho FolVid

**Ưu tiên:** Unit Test (70%) → Integration Test (25%) → E2E (5% khi đã ổn định).

> Lý do: Unit test chạy nhanh (miliseconds), dễ viết, dễ debug. E2E chạy chậm và dễ bị flaky (do mạng, do browser).

---

## 3. Nguyên tắc viết test hiệu quả

### 3.1. Quy tắc FIRST

| Chữ cái             | Ý nghĩa       | Áp dụng                                                                 |
| ------------------- | ------------- | ----------------------------------------------------------------------- |
| **F**ast            | Chạy nhanh    | Không gọi API thật, không đợi timeout dài                               |
| **I**ndependent     | Độc lập       | Test A không phụ thuộc kết quả test B. Dùng `beforeEach` để reset state |
| **R**epeatable      | Lặp lại được  | Chạy 100 lần vẫn cho cùng kết quả, không phụ thuộc thời gian thực       |
| **S**elf-validating | Tự kiểm chứng | Kết quả chỉ có PASS hoặc FAIL, không cần đọc log đoán mò                |
| **T**imely          | Viết đúng lúc | Viết test cùng lúc hoặc trước khi viết code (TDD)                       |

### 3.2. Quy tắc AAA (Arrange - Act - Assert)

```javascript
// Arrange: Chuẩn bị dữ liệu, mock, render component
const videos = ["a.mp4", "b.mp4"];
const mockSelect = vi.fn();

// Act: Thực hiện hành động cần test
render(<VideoList videos={videos} onSelect={mockSelect} />);
fireEvent.click(screen.getByText("a.mp4"));

// Assert: Kiểm tra kết quả
expect(mockSelect).toHaveBeenCalledWith("a.mp4");
```

### 3.3. Test hành vi, không test implementation

**Sai:** Test "khi click thì `setState` được gọi 1 lần"  
**Đúng:** Test "khi click thì tên video được highlight màu xanh"

Lý do: Implementation thay đổi thường xuyên (dùng `useState` hay `useReducer`), nhưng hành vi user thấy phải ổn định.

### 3.4. Một test chỉ kiểm tra một điều

Sai:

```javascript
test("test mọi thứ", () => {
  // render, click, check text, check style, check API call...
});
```

Đúng:

```javascript
test('hiển thị đúng số lượng video', () => { ... });
test('highlight video đang chọn', () => { ... });
test('gọi callback khi click', () => { ... });
```

---

## 4. Testing Backend (Node.js + Express)

### 4.1. Stack chọn

- **Jest:** Framework test chuẩn cho Node.js. Tự động tìm file `.test.js` hoặc trong `__tests__/`.
- **Supertest:** Thư viện giả lập HTTP request đến Express app mà không cần mở port thật.

### 4.2. Lý do phải tách `app.js` và `server.js`

File `server.js` hiện tại của bạn có `app.listen(PORT)` — điều này **mở port và chạy server vĩnh viễn**. Supertest cần `app` instance để gửi request, nhưng không muốn server thật chạy trong quá trình test.

**Cách tách:**

Tạo `backend/app.js`:

```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const VIDEO_DIR = path.join(__dirname, "videos");

app.use(cors());
app.use("/videos", express.static(VIDEO_DIR));

app.get("/api/videos", (req, res) => {
  fs.readdir(VIDEO_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: "Lỗi đọc thư mục" });
    const videoExts = [".mp4", ".webm", ".ogg", ".mov"];
    const videos = files.filter((f) =>
      videoExts.includes(path.extname(f).toLowerCase()),
    );
    res.json(videos);
  });
});

module.exports = app;
```

Sửa `backend/server.js`:

```javascript
const app = require("./app");
const PORT = 4000;
app.listen(PORT, () =>
  console.log(`Backend chạy tại http://localhost:${PORT}`),
);
```

### 4.3. Cài đặt

```bash
cd backend
npm install --save-dev jest supertest
```

Thêm vào `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "test": "jest"
  }
}
```

### 4.4. Viết test cho API

Tạo thư mục `backend/__tests__/` và file `api.test.js`:

```javascript
const request = require("supertest");
const app = require("../app");
const fs = require("fs");
const path = require("path");

const VIDEO_DIR = path.join(__dirname, "../videos");

// Dọn dẹp trước mỗi test để đảm bảo độc lập
beforeEach(() => {
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }
  // Xóa hết file trong videos/ test
  fs.readdirSync(VIDEO_DIR).forEach((f) =>
    fs.unlinkSync(path.join(VIDEO_DIR, f)),
  );
});

afterAll(() => {
  // Dọn dẹp sau khi chạy xong toàn bộ file test
  if (fs.existsSync(VIDEO_DIR)) {
    fs.readdirSync(VIDEO_DIR).forEach((f) =>
      fs.unlinkSync(path.join(VIDEO_DIR, f)),
    );
  }
});

describe("GET /api/videos", () => {
  test("trả về mảng rỗng khi thư mục videos trống", async () => {
    const res = await request(app).get("/api/videos");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("chỉ trả về file có đuôi video hợp lệ", async () => {
    fs.writeFileSync(path.join(VIDEO_DIR, "phim1.mp4"), "fake");
    fs.writeFileSync(path.join(VIDEO_DIR, "phim2.webm"), "fake");
    fs.writeFileSync(path.join(VIDEO_DIR, "readme.txt"), "not video");
    fs.writeFileSync(path.join(VIDEO_DIR, "photo.jpg"), "not video");

    const res = await request(app).get("/api/videos");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("phim1.mp4");
    expect(res.body).toContain("phim2.webm");
    expect(res.body).not.toContain("readme.txt");
    expect(res.body).not.toContain("photo.jpg");
    expect(res.body.length).toBe(2);
  });

  test("không phân biệt chữ hoa/thường trong đuôi file", async () => {
    fs.writeFileSync(path.join(VIDEO_DIR, "test.MP4"), "fake");
    fs.writeFileSync(path.join(VIDEO_DIR, "test2.MOV"), "fake");

    const res = await request(app).get("/api/videos");
    expect(res.body).toContain("test.MP4");
    expect(res.body).toContain("test2.MOV");
  });

  test("trả về lỗi 500 nếu thư mục videos không tồn tại (edge case)", async () => {
    // Tạm đổi tên thư mục để giả lập lỗi
    // Hoặc mock fs.readdir để throw error
    const originalReaddir = fs.readdir;
    fs.readdir = jest.fn((dir, cb) => cb(new Error("ENOENT")));

    const res = await request(app).get("/api/videos");
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBeDefined();

    fs.readdir = originalReaddir; // Restore
  });
});

describe("GET /videos/:filename", () => {
  test("trả về 404 nếu file không tồn tại", async () => {
    const res = await request(app).get("/videos/khong-ton-tai.mp4");
    expect(res.statusCode).toBe(404);
  });

  test("trả về 200 và header video nếu file tồn tại", async () => {
    fs.writeFileSync(path.join(VIDEO_DIR, "real.mp4"), "fake video content");
    const res = await request(app).get("/videos/real.mp4");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/video/);
  });
});
```

### 4.5. Mocking trong Jest

Khi test, bạn không muốn gọi hệ thống file thật (chậm, phụ thuộc môi trường). Jest cho phép mock module:

```javascript
jest.mock("fs");
const fs = require("fs");

// Giả lập fs.readdir trả về danh sách file
fs.readdir.mockImplementation((dir, cb) => {
  cb(null, ["a.mp4", "b.txt", "c.webm"]);
});
```

Tuy nhiên với FolVid, việc tạo file giả lập vào `videos/` (như ví dụ trên) đơn giản và đủ nhanh. Chỉ mock khi bạn test logic phức tạp hơn.

### 4.6. Chạy test backend

```bash
cd backend
npm test
```

Jest chạy mặc định ở chế độ watch (theo dõi file thay đổi). Nhấn `a` để chạy tất cả, `q` để thoát.

---

## 5. Testing Frontend (React + Vite)

### 5.1. Stack chọn

- **Vitest:** Thay thế Jest cho project Vite. Hiểu ES Module native, không cần Babel.
- **React Testing Library (RTL):** Test component theo cách người dùng tương tác thật (tìm text, click button).
- **jsdom:** Môi trường giả lập DOM trong Node.js để test chạy trên terminal.
- **@testing-library/jest-dom:** Bộ matcher mở rộng (`toBeInTheDocument()`, `toHaveStyle()`).

### 5.2. Cài đặt

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 5.3. Cấu hình Vitest

Sửa `frontend/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Dùng describe/test/expect không cần import
    environment: "jsdom", // Giả lập trình duyệt
    setupFiles: "./src/test/setup.js", // File khởi tạo trước mỗi test
    coverage: {
      reporter: ["text", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
  },
});
```

Tạo `frontend/src/test/setup.js`:

```javascript
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
```

Sửa `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### 5.4. Viết test cho Component

Giả sử bạn tách `VideoList` thành component riêng:

```jsx
// src/components/VideoList.jsx
export default function VideoList({ videos, currentVideo, onSelect }) {
  return (
    <ul role="list">
      {videos.map((v) => (
        <li
          key={v}
          role="listitem"
          onClick={() => onSelect(v)}
          style={{
            cursor: "pointer",
            padding: "10px",
            background: currentVideo === v ? "#3b82f6" : "#2a2a2a",
            color: "#fff",
          }}
          aria-selected={currentVideo === v}
        >
          🎬 {v}
        </li>
      ))}
    </ul>
  );
}
```

Test file `frontend/src/components/__tests__/VideoList.test.jsx`:

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import VideoList from "../VideoList";

describe("VideoList", () => {
  const mockVideos = ["phim1.mp4", "phim2.webm", "phim3.ogg"];

  test("hiển thị đúng số lượng video", () => {
    render(
      <VideoList videos={mockVideos} currentVideo={null} onSelect={() => {}} />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
    expect(screen.getByText("🎬 phim1.mp4")).toBeInTheDocument();
  });

  test("gọi onSelect với đúng tên file khi click", () => {
    const mockSelect = vi.fn();
    render(
      <VideoList
        videos={mockVideos}
        currentVideo={null}
        onSelect={mockSelect}
      />,
    );

    fireEvent.click(screen.getByText("🎬 phim2.webm"));
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith("phim2.webm");
  });

  test("highlight video đang được chọn", () => {
    render(
      <VideoList
        videos={mockVideos}
        currentVideo="phim1.mp4"
        onSelect={() => {}}
      />,
    );

    const selectedItem = screen.getByText("🎬 phim1.mp4");
    expect(selectedItem).toHaveStyle({ background: "#3b82f6" });
  });

  test("không gọi onSelect nếu chưa click", () => {
    const mockSelect = vi.fn();
    render(
      <VideoList
        videos={mockVideos}
        currentVideo={null}
        onSelect={mockSelect}
      />,
    );
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
```

### 5.5. Query trong React Testing Library — thứ tự ưu tiên

RTL khuyên bạn tìm element giống người dùng thật nhất:

1. **Queries về accessibility (ưu tiên cao nhất):**
   - `getByRole('button')` — tìm nút theo vai trò ARIA
   - `getByLabelText('Tên')` — tìm input theo label
   - `getByPlaceholderText('Tìm kiếm...')`

2. **Queries về nội dung hiển thị:**
   - `getByText('🎬 phim1.mp4')` — tìm text trên màn hình
   - `getByDisplayValue('giá trị input')`

3. **Test ID (dùng khi không có cách khác):**
   - `getByTestId('video-player')` — cần thêm `data-testid="video-player"` vào JSX

**Không dùng:** `getByClassName`, `getById`, `querySelector` — vì user không nhìn thấy class/id.

### 5.6. Test bất đồng bộ (Async)

Khi component gọi API, bạn cần đợi element xuất hiện:

```jsx
import { render, screen, waitFor } from "@testing-library/react";

test("tải và hiển thị danh sách video từ API", async () => {
  // Mock fetch trước khi render
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(["a.mp4", "b.mp4"]),
    }),
  );

  render(<App />);

  // Đợi element xuất hiện (timeout mặc định 1s)
  await waitFor(() => {
    expect(screen.getByText("a.mp4")).toBeInTheDocument();
  });
});
```

---

## 6. Testing localStorage và Session State

### 6.1. Tách logic ra khỏi component

Để test dễ dàng, đừng để `localStorage.getItem` nằm lẫn trong JSX. Tách thành module riêng:

```javascript
// src/utils/playerState.js
const STORAGE_KEY = "folvid_player_state";

export function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        lastUpdated: Date.now(),
      }),
    );
  } catch (e) {
    console.warn("Không thể lưu state:", e);
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Không thể đọc state:", e);
    return null;
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
```

### 6.2. Test module playerState

File `frontend/src/utils/__tests__/playerState.test.js`:

```javascript
import { describe, test, expect, beforeEach } from "vitest";
import { saveState, loadState, clearState } from "../playerState";

describe("playerState", () => {
  // Dọn sạch trước mỗi test
  beforeEach(() => {
    localStorage.clear();
  });

  test("lưu và đọc state đầy đủ", () => {
    const state = {
      filename: "test.mp4",
      currentTime: 125.5,
      playbackRate: 1.25,
      volume: 0.8,
      muted: false,
      loop: false,
    };

    saveState(state);
    const loaded = loadState();

    expect(loaded.filename).toBe("test.mp4");
    expect(loaded.currentTime).toBe(125.5);
    expect(loaded.playbackRate).toBe(1.25);
    expect(loaded.lastUpdated).toBeDefined();
  });

  test("trả về null nếu chưa có dữ liệu", () => {
    expect(loadState()).toBeNull();
  });

  test("clearState xóa hoàn toàn", () => {
    saveState({ filename: "x.mp4" });
    clearState();
    expect(loadState()).toBeNull();
  });

  test("không crash khi localStorage bị lỗi (edge case)", () => {
    // Giả lập localStorage bị disable/full
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("QuotaExceeded");
    };

    expect(() => saveState({ filename: "x.mp4" })).not.toThrow();

    localStorage.setItem = originalSetItem;
  });
});
```

### 6.3. Test phân biệt tab mới vs reload

Logic `sessionStorage` quan trọng nhưng khó test vì jsdom mô phỏng hạn chế. Bạn nên tách thành hàm thuần:

```javascript
// src/utils/tabDetector.js
export function isNewTab() {
  return !sessionStorage.getItem("folvid_tab_initialized");
}

export function markTabInitialized() {
  sessionStorage.setItem("folvid_tab_initialized", "true");
}
```

Test:

```javascript
describe("tabDetector", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("nhận diện tab mới", () => {
    expect(isNewTab()).toBe(true);
  });

  test("nhận diện reload sau khi đánh dấu", () => {
    markTabInitialized();
    expect(isNewTab()).toBe(false);
  });
});
```

---

## 7. Các test case "must-have" cho FolVid

### 7.1. Backend

| #   | Test                       | Mô tả                               |
| --- | -------------------------- | ----------------------------------- |
| 1   | `GET /api/videos` trả mảng | Status 200, body là array           |
| 2   | Lọc đuôi file chính xác    | Chỉ `.mp4`, `.webm`, `.ogg`, `.mov` |
| 3   | Không phân biệt hoa/thường | `.MP4`, `.WebM` đều nhận            |
| 4   | Thư mục trống              | Trả `[]`                            |
| 5   | File tĩnh tồn tại          | `GET /videos/real.mp4` → 200        |
| 6   | File tĩnh không tồn tại    | `GET /videos/fake.mp4` → 404        |
| 7   | Lỗi đọc thư mục            | `fs.readdir` lỗi → 500              |

### 7.2. Frontend

| #   | Test                           | Mô tả                          |
| --- | ------------------------------ | ------------------------------ |
| 1   | Danh sách render đúng số lượng | 3 video → 3 dòng               |
| 2   | Click chọn gọi callback        | `onSelect(filename)` được gọi  |
| 3   | Highlight video đang chọn      | Style khác biệt                |
| 4   | localStorage lưu đọc đúng      | `saveState` / `loadState`      |
| 5   | localStorage xử lý lỗi         | Không crash khi quota full     |
| 6   | Tab mới không restore          | `isNewTab()` trả `true`        |
| 7   | Video player nhận đúng src     | `<video src="...">` đúng URL   |
| 8   | Đổi tốc độ cập nhật DOM        | Nút `1.5x` được chọn/highlight |

---

## 8. Cấu trúc thư mục sau khi thêm testing

```
FolVid/
├── backend/
│   ├── app.js                  ← Export app instance
│   ├── server.js               ← Chỉ listen port
│   ├── package.json
│   ├── node_modules/
│   ├── videos/                 ← Thư mục chứa video thật
│   └── __tests__/
│       ├── api.test.js         ← Test API endpoints
│       └── static.test.js      ← Test phục vụ file tĩnh
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js          ← Có block `test: {}`
│   ├── package.json
│   ├── node_modules/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── test/
│       │   └── setup.js        ← Extend matchers
│       ├── components/
│       │   ├── VideoList.jsx
│       │   ├── VideoPlayer.jsx
│       │   └── __tests__/
│       │       ├── VideoList.test.jsx
│       │       └── VideoPlayer.test.jsx
│       └── utils/
│           ├── playerState.js
│           ├── tabDetector.js
│           └── __tests__/
│               ├── playerState.test.js
│               └── tabDetector.test.js
│
└── .github/
    └── workflows/
        └── test.yml            ← CI/CD (xem phần 10)
```

---

## 9. Chạy test và đọc kết quả

### 9.1. Backend

```bash
cd backend
npm test              # Chạy tất cả test
npm test -- --watch  # Chế độ theo dõi (mặc định)
npm test -- --coverage  # Báo cáo độ phủ code
```

Kết quả mẫu:

```
 PASS  __tests__/api.test.js
  GET /api/videos
    ✓ trả về mảng rỗng khi thư mục videos trống (45 ms)
    ✓ chỉ trả về file có đuôi video hợp lệ (12 ms)
    ✓ không phân biệt chữ hoa/thường trong đuôi file (8 ms)
  GET /videos/:filename
    ✓ trả về 404 nếu file không tồn tại (5 ms)
    ✓ trả về 200 nếu file tồn tại (3 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
```

### 9.2. Frontend

```bash
cd frontend
npm test              # Chạy Vitest watch mode
npm test -- --run     # Chạy 1 lần rồi thoát
npm test -- --coverage # Báo cáo độ phủ
```

### 9.3. Đọc coverage report

Sau khi chạy `--coverage`, Jest/Vitest tạo folder `coverage/`:

- `coverage/lcov-report/index.html` — Mở bằng trình duyệt để xem dòng nào chưa được test.
- Mục tiêu ban đầu: **> 60%** là tốt, **> 80%** là rất tốt. Đừng ám ảnh 100%.

---

## 10. CI/CD tự động hóa (GitHub Actions)

Khi bạn push code lên GitHub, hệ thống tự động chạy test để đảm bảo không ai push lỗi.

Tạo file `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: npm ci
      - run: npm test

  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: npm ci
      - run: npm test -- --run
```

> **Lưu ý:** `npm ci` nhanh hơn `npm install` và dùng `package-lock.json`.

---

## 11. FAQ & Troubleshooting

### Q1: Test báo lỗi `window is not defined` hoặc `document is not defined`

**Nguyên nhân:** Bạn đang test code có dùng `window`/`document` trong môi trường Node (jsdom chưa được cấu hình).  
**Sửa:** Kiểm tra `vite.config.js` đã có `environment: 'jsdom'`.

### Q2: Test backend báo `PORT already in use`

**Nguyên nhân:** `server.js` đang chạy thật, chiếm port 4000.  
**Sửa:** Đảm bảo bạn tách `app.js` (không có `.listen()`). Test chỉ import `app`, không import `server`.

### Q3: `TypeError: Cannot read properties of null (reading 'click')`

**Nguyên nhân:** Element chưa render khi bạn query.  
**Sửa:** Dùng `await screen.findByText(...)` (cho async) hoặc kiểm tra component có điều kiện render không.

### Q4: Test localStorage ảnh hưởng lẫn nhau

**Nguyên nhân:** localStorage trong jsdom là global, không tự xóa giữa các test.  
**Sửa:** Luôn có `beforeEach(() => { localStorage.clear(); })`.

### Q5: `fetch` báo lỗi trong test

**Nguyên nhân:** Node không có `fetch` toàn cục (trước Node 18) hoặc bạn chưa mock.  
**Sửa:** `global.fetch = vi.fn(() => Promise.resolve(...))` hoặc dùng thư viện `msw` (Mock Service Worker) cho mock HTTP chuyên nghiệp.

### Q6: Vitest không nhận diện file `.test.jsx`

**Nguyên nhân:** Config thiếu hoặc file nằm sai chỗ.  
**Sửa:** Mặc định Vitest tìm file có pattern `*.test.*` hoặc `*.spec.*` trong toàn project. Kiểm tra `vite.config.js` có `test: { include: ['src/**/*.{test,spec}.{js,jsx}'] }` nếu cần.

### Q7: Test chạy chậm

**Nguyên nhân:** Có thể do tạo quá nhiều file thật, hoặc dùng `setTimeout`/`setInterval`.  
**Sửa:**

- Dùng `jest.useFakeTimers()` (Jest) hoặc `vi.useFakeTimers()` (Vitest).
- Mock `fs` thay vì tạo file thật.
- Tránh `waitFor` với timeout quá lớn.

---

## 12. Cheat Sheet nhanh

### 12.1. Jest (Backend)

| Mục đích             | Cú pháp                                    |
| -------------------- | ------------------------------------------ |
| Tạo mock function    | `const fn = jest.fn()`                     |
| Giả lập return       | `fn.mockReturnValue(42)`                   |
| Giả lập async        | `fn.mockResolvedValue({ json: () => [] })` |
| Mock module          | `jest.mock('fs')`                          |
| Chạy trước mỗi test  | `beforeEach(() => { ... })`                |
| Chạy sau tất cả test | `afterAll(() => { ... })`                  |
| Bỏ qua 1 test        | `test.skip('...', ...)`                    |
| Chỉ chạy 1 test      | `test.only('...', ...)`                    |

### 12.2. Vitest (Frontend)

| Mục đích          | Cú pháp                        |
| ----------------- | ------------------------------ |
| Tạo mock function | `const fn = vi.fn()`           |
| Giả lập return    | `fn.mockReturnValue(42)`       |
| Mock module       | `vi.mock('./api')`             |
| Giả lập timer     | `vi.useFakeTimers()`           |
| Advance timer     | `vi.advanceTimersByTime(1000)` |
| Restore mock      | `vi.restoreAllMocks()`         |

### 12.3. React Testing Library

| Mục đích               | Cú pháp                                                   |
| ---------------------- | --------------------------------------------------------- |
| Render component       | `render(<Component />)`                                   |
| Tìm theo text          | `screen.getByText('Hello')`                               |
| Tìm theo role          | `screen.getByRole('button')`                              |
| Tìm async              | `await screen.findByText('Loaded')`                       |
| Kiểm tra không tồn tại | `expect(screen.queryByText('X')).not.toBeInTheDocument()` |
| Click                  | `fireEvent.click(element)`                                |
| Nhập input             | `fireEvent.change(input, { target: { value: 'abc' } })`   |
| Đợi điều kiện          | `await waitFor(() => expect(...).toBe(...))`              |

---

## 13. Lưu ý quan trọng cuối cùng

### 13.1. Về tâm lý

- **Đừng cố viết test hoàn hảo ngay lập tức.** Test đầu tiên của bạn có thể rất đơn giản: kiểm tra hàm cộng 2 số. Quan trọng là bắt đầu.
- **Test cũng là code**, cần được refactor. Nếu thấy test dài 50 dòng, tách thành hàm helper hoặc nhiều test nhỏ.
- **Không test everything.** Focus vào logic quan trọng (API, localStorage, user interaction). CSS màu sắc không cần test.

### 13.2. Về kỹ thuật

- **Mock ít thôi.** Mock càng nhiều, test càng xa thực tế. Chỉ mock những thứ ngoài tầm kiểm soát (API, localStorage, timer).
- **Test stateless function trước.** Hàm thuần (input → output) dễ test nhất. Component có side-effect (useEffect, fetch) khó hơn, để sau.
- **Dùng `data-testid` khi cần thiết.** Nếu không thể tìm element bằng text/role, thêm `data-testid="player-controls"` vào JSX. Không dùng class/id.

### 13.3. Về FolVid cụ thể

| Tính năng             | Cách test hiệu quả                                                               |
| --------------------- | -------------------------------------------------------------------------------- |
| Quét thư mục video    | Backend test: mock `fs.readdir` hoặc tạo file giả                                |
| Phát video            | Khó unit test thẻ `<video>`. Dùng E2E (Playwright) hoặc chỉ test `src` attribute |
| localStorage restore  | Test hàm `loadState`/`saveState` độc lập, không cần render cả App                |
| Phím tắt (Space, ← →) | `fireEvent.keyDown(window, { key: ' ', code: 'Space' })`                         |
| Tốc độ phát           | Test nút click gọi `videoRef.current.playbackRate = 1.5`                         |

### 13.4. Lộ trình đề xuất

```
Tuần 1:  Viết test backend API (2-3 test đầu tiên)
Tuần 2:  Viết test frontend component đơn giản (VideoList)
Tuần 3:  Test localStorage/sessionStorage logic
Tuần 4:  Test integration (App.jsx render + fetch mock)
Tuần 5+: Thêm CI/CD GitHub Actions + coverage report
```

---

## Kết luận

Testing không phải để chứng minh code đúng, mà để **phát hiện code sai sớm nhất có thể**. Với FolVid, bạn chỉ cần 5-10 file test cho các phần lõi (API, danh sách video, localStorage) là đã có một lớp bảo vệ vững chắc để thoải mái thêm tính năng mới (playlist, subtitle, responsive...) mà không sợ phá hỏng những gì đã chạy ổn.

**Bắt đầu bằng 1 test đơn giản hôm nay, tốt hơn 10 test hoàn hảo mai sau.**

---

_Tài liệu được biên soạn cho dự án FolVid — React + Vite + Node.js Video Player._
