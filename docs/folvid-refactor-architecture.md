# FolVid Frontend — Refactor Architecture Guide

> **Phiên bản:** 2.0  
> **Kiến trúc:** Feature-Based + Modular  
> **Stack:** React 18+, Vite, Zustand, TanStack Query (khuyên dùng), HTML5 Video API

---

## 1. Tổng quan kiến trúc

Project chuyển từ **Type-Based** (`components/`, `hooks/`, `pages/`) sang **Feature-Based Architecture**.

- Mỗi tính năng (feature) là một **module độc lập**: chứa components, hooks, logic, types, utils riêng.
- `App.jsx` chỉ còn vai trò **orchestrator**: mount layout, providers, global UI overlays.
- Không còn file 1000+ dòng. Mỗi file tối đa 200-300 dòng, đảm nhận 1 trách nhiệm duy nhất (Single Responsibility).

---

## 2. Cấu trúc thư mục tổng thể

```
folvid-frontend/
│
├── public/                          # Static assets (favicon, poster fallback...)
│
├── src/
│   ├── main.jsx                     # Entry point: mount root + providers
│   ├── App.jsx                      # Orchestrator: Layout + Global UI + Routes
│   │
│   ├── assets/                      # Ảnh, SVG, font
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── styles/                      # Global styles, CSS variables, reset
│   │   ├── global.css               # Reset, body, scrollbar, font-face
│   │   ├── variables.css            # Color palette, spacing, radius, shadow tokens
│   │   └── utilities.css            # Helper classes (.sr-only, .text-truncate...)
│   │
│   ├── config/                      # Hằng số & cấu hình ứng dụng
│   │   ├── constants.js             # API_BASE_URL, VIDEO_EXTS, DEBOUNCE_MS...
│   │   └── app-config.js            # Feature flags, player defaults (defaultVolume, defaultSpeed)
│   │
│   ├── lib/                         # Cấu hình thư viện bên thứ 3 (không chứa logic nghiệp vụ)
│   │   ├── axios.js                 # Axios instance: baseURL, timeout, request/response interceptors
│   │   └── query-client.js          # TanStack Query Client config (staleTime, cacheTime, retry)
│   │
│   ├── types/                       # TypeScript types / JSDoc typedefs (nếu dùng JS)
│   │   ├── video.types.js           # VideoItem, VideoMetadata, VideoFilter...
│   │   └── ui.types.js              # ModalType, ToastType, ContextMenuItem...
│   │
│   ├── utils/                         # Pure functions dùng CHUNG toàn app (không import từ features)
│   │   ├── formatTime.js            # seconds → "mm:ss" / "hh:mm:ss"
│   │   ├── debounce.js              # Generic debounce/throttle
│   │   ├── throttle.js
│   │   ├── sanitizeFilename.js      # Xử lý tên file trước khi gửi API
│   │   ├── clamp.js                 # Giới hạn giá trị trong range
│   │   └── index.js                 # Barrel export
│   │
│   ├── services/                    # API Layer — TẤT CẢ gọi network tập trung ở đây
│   │   ├── videoApi.js              # GET /api/videos, rename, delete, getDetails
│   │   ├── uploadApi.js             # POST upload với progress tracking
│   │   └── index.js
│   │
│   ├── hooks/                       # Custom hooks DÙNG CHUNG (không thuộc 1 feature cụ thể)
│   │   ├── useDebounce.js           # Debounce value (dùng cho search input)
│   │   ├── useLocalStorage.js       # Sync state với localStorage
│   │   ├── useClickOutside.js       # Đóng dropdown/menu khi click ra ngoài
│   │   ├── useMediaQuery.js         # Responsive breakpoint detection
│   │   ├── usePrevious.js           # Giữ giá trị trước đó của state
│   │   └── index.js
│   │
│   ├── components/ui/               # 🎨 Design System — components PURE, KHÔNG business logic
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.module.css
│   │   │   └── index.js
│   │   ├── Icon/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── ModalBase/               # Skeleton modal: overlay, portal, animation, close-on-ESC
│   │   ├── Portal/                  # React Portal wrapper
│   │   ├── Tooltip/
│   │   ├── Spinner/
│   │   └── index.js                 # export * from './Button'; export * from './Icon'; ...
│   │
│   ├── components/layout/           # 🏗️ Layout wrappers — định hình bố cục trang
│   │   ├── AppLayout.jsx            # Flex container: Sidebar + Main + Global overlays
│   │   ├── Sidebar/                 # Container sidebar (width, resize handle, collapsed state)
│   │   ├── MainContent/             # Khu vực chính chứa player
│   │   ├── Header/                  # Thanh header nếu có (mobile menu, logo)
│   │   └── index.js
│   │
│   ├── contexts/                    # React Contexts dùng GLOBAL (HẠN CHẾ — chỉ khi thật cần)
│   │   └── UIContext.jsx            # Quản lý global toast, theme (nếu không dùng Zustand cho mục này)
│   │
│   ├── stores/                      # 🏪 Zustand stores — Global state management
│   │   ├── usePlayerStore.js        # Trạng thái player được CHỌN (selectedVideoId, isSidebarOpen)
│   │   ├── useVideoStore.js         # Danh sách video, loading, error, filters
│   │   ├── useUIStore.js            # Modal stack, context menu, toast queue, theme
│   │   └── useUploadStore.js        # Upload queue, progress, abort controllers
│   │
│   └── features/                    # ⭐ CORE — Mỗi folder là 1 domain độc lập
│       │
│       ├── video-player/            # Domain: Phát video + điều khiển
│       │   ├── components/
│       │   │   ├── VideoPlayer.jsx          # Orchestrator: kết hợp canvas + controls + keyboard
│       │   │   ├── VideoCanvas.jsx          # Thẻ <video> thật + ref forwarding
│       │   │   ├── PlayerControls.jsx       # Container layout các nút điều khiển
│       │   │   ├── PlayPauseButton.jsx
│       │   │   ├── Timeline.jsx             # Thanh seek + buffered bar + hover preview
│       │   │   ├── VolumeControl.jsx        # Slider âm lượng + nút mute
│       │   │   ├── SpeedControl.jsx         # Dropdown chọn tốc độ
│       │   │   ├── FullscreenButton.jsx
│       │   │   ├── TimeDisplay.jsx          # "03:24 / 12:00"
│       │   │   └── index.js
│       │   ├── hooks/
│       │   │   ├── useVideoPlayer.js        # ⭐ CORE: quản lý videoRef, playback state, event listeners
│       │   │   ├── useTimeline.js           # Logic buffered segments, preview position
│       │   │   ├── useKeyboardShortcuts.js  # Bắt phím Space, ← →, M, F, ↑ ↓
│       │   │   ├── useFullscreen.js           # Wrapper Fullscreen API
│       │   │   └── index.js
│       │   ├── contexts/
│       │   │   └── PlayerContext.jsx        # Context NỘI BỘ feature (tránh prop drill giữa controls)
│       │   ├── utils/
│       │   │   ├── calculateBuffered.js     # Tính % buffered từ TimeRanges
│       │   │   └── index.js
│       │   └── index.js                     # export { VideoPlayer } from './components/VideoPlayer'
│       │
│       ├── video-list/              # Domain: Danh sách + tìm kiếm + lọc
│       │   ├── components/
│       │   │   ├── VideoList.jsx            # Container: fetch + filter + render list
│       │   │   ├── VideoListItem.jsx        # Item trong list (thumbnail + title + duration)
│       │   │   ├── VideoThumbnail.jsx       # <video> ẩn → canvas → img, hoặc poster frame
│       │   │   ├── SearchBar.jsx            # Input + icon + clear button
│       │   │   ├── FilterBar.jsx            # Sort, format filter, view mode (grid/list)
│       │   │   ├── EmptyState.jsx           # "Không tìm thấy video"
│       │   │   └── index.js
│       │   ├── hooks/
│       │   │   ├── useVideoList.js          # Gọi API + cache danh sách (TanStack Query)
│       │   │   ├── useSearchFilter.js       # Client-side search + sort + filter logic
│       │   │   ├── useRename.js             # Logic rename: gọi API + optimistic update
│       │   │   └── index.js
│       │   └── index.js
│       │
│       ├── video-actions/           # Domain: Hành động trên 1 video (context menu, modal, delete)
│       │   ├── components/
│       │   │   ├── VideoContextMenu.jsx       # UI menu (1 instance, dùng global position)
│       │   │   ├── VideoDetailsModal.jsx      # Hiển thị metadata video
│       │   │   ├── RenameModal.jsx            # Form đổi tên
│       │   │   ├── ConfirmDeleteModal.jsx     # Xác nhận xóa
│       │   │   └── index.js
│       │   ├── hooks/
│       │   │   ├── useContextMenu.js          # Trả về { x, y, isOpen, open, close, items }
│       │   │   ├── useVideoDetails.js         # Fetch metadata (duration, size, codec, resolution)
│       │   │   └── index.js
│       │   └── index.js
│       │
│       └── upload/                  # Domain: Upload file
│           ├── components/
│           │   ├── UploadButton.jsx
│           │   ├── UploadDropzone.jsx         # Kéo thả file
│           │   ├── UploadProgress.jsx         # Thanh tiến trình từng file
│           │   └── index.js
│           ├── hooks/
│           │   └── useUpload.js             # Xử lý FormData, progress, abort, retry
│           └── index.js
│
├── index.html
├── vite.config.js                   # Có path alias: `@/` → `./src`
├── package.json
└── jsconfig.json / tsconfig.json    # Để IDE hiểu alias `@/`
```

---

## 3. Giải thích từng tầng

### 3.1. `components/ui/` — Design System

- **Không được phép** import từ `features/`, `stores/`, hay `services/`.
- Chỉ nhận props và render. Ví dụ: `Button` nhận `variant`, `size`, `onClick`.
- Mục tiêu: tái sử dụng 100% giữa các feature. Nếu 1 component chỉ dùng trong 1 feature, nó thuộc về `features/xxx/components/`, không ở đây.

### 3.2. `components/layout/` — Bố cục

- Chỉ quan tâm **vị trí** và **kích thước** các vùng.
- Không chứa logic nghiệp vụ. `AppLayout` nhận `sidebar` và `main` qua `children` hoặc slots.

### 3.3. `services/` — API Layer

- Tất cả `fetch`/`axios` tập trung đây.
- Component/feature không gọi API trực tiếp, chỉ gọi qua `videoApi.getList()`.
- Dễ mock khi test, dễ thay đổi protocol (REST → WebSocket → tRPC).

### 3.4. `utils/` vs `features/xxx/utils/`

| `src/utils/` | `features/xxx/utils/` |
|---|---|
| Dùng ở ≥ 2 features | Chỉ dùng trong 1 feature |
| Pure function, không import từ feature | Có thể import types từ feature |
| Ví dụ: `formatTime`, `debounce` | Ví dụ: `calculateBuffered` (dùng `TimeRanges` của HTMLVideoElement) |

---

## 4. State Management Strategy

FolVid sử dụng **3 tầng state** kết hợp. Đây là quyết định kiến trúc quan trọng nhất.

### 4.1. Tầng 1 — Local State (`useState` / `useReducer`)

**Dùng cho:** UI tạm thời, không cần chia sẻ.

| State | Vị trí | Lý do |
|---|---|---|
| `isHovering` trên 1 list item | `VideoListItem` | Chỉ item đó cần biết |
| `isMenuOpen` của 1 dropdown nhỏ | Component con | Scope cục bộ |
| Input value trước khi submit | `SearchBar` | Chưa cần đồng bộ ra ngoài |
| `currentTime` của video (render 60fps) | `Timeline` component | Dùng `useRef` + `requestAnimationFrame`, KHÔNG dùng Zustand/Context |

> ⚠️ **Cấm kỵ:** Đừng để `currentTime` (cập nhật liên tục) nằm trong Zustand hoặc Context global. Nó sẽ trigger re-render toàn bộ app 60 lần/giây.

### 4.2. Tầng 2 — Feature State (React Context nội bộ)

**Dùng cho:** State chia sẻ trong 1 feature, không cần ra ngoài.

Ví dụ: `PlayerContext` trong `features/video-player/`

```
features/video-player/
├── contexts/
│   └── PlayerContext.jsx      # Tạo Context + Provider
├── components/
│   ├── VideoPlayer.jsx        # <PlayerProvider> bao bọc
│   ├── PlayPauseButton.jsx    # usePlayerContext() → lấy play/pause
│   └── Timeline.jsx           # usePlayerContext() → lấy seek()
└── hooks/
    └── useVideoPlayer.js      # Logic chính, trả về object API
```

**Tại sao dùng Context ở đây mà không phải Zustand?**
- Scope giới hạn: chỉ các component bên trong `VideoPlayer` mới truy cập được.
- Khi unmount `VideoPlayer` (chuyển sang trang khác), state tự động cleanup.
- Không làm ô nhiễm global store.

### 4.3. Tầng 3 — Global State (Zustand)

**Dùng cho:** State cần truy cập từ nhiều feature khác nhau, hoặc UI overlay toàn cục.

#### Store 1: `usePlayerStore`

```js
// Chỉ lưu THÔNG TIN ĐỊNH DANH, không lưu currentTime
{
  selectedVideoId: "abc.mp4",   // Video đang được chọn
  isSidebarOpen: true,           // Sidebar mở/rút
  isPlaying: false,             // Trạng thái phát (để list item hiện icon)
  playbackRate: 1,               // Tốc độ (để sync UI)
  volume: 0.8,                   // Âm lượng (persist)
}
```

> `currentTime` KHÔNG ở đây. `VideoCanvas` giữ giá trị thật qua `ref`. `Timeline` đọc từ ref để vẽ thanh.

#### Store 2: `useVideoStore`

```js
// Quản lý danh sách video (client-side cache)
{
  videos: [],           // Dữ liệu từ API
  isLoading: false,
  error: null,
  filters: {
    query: "",
    sortBy: "name",     // "name" | "date" | "duration"
    sortOrder: "asc",   // "asc" | "desc"
    format: "all"       // "all" | "mp4" | "webm"...
  }
}
```

> Nếu dùng **TanStack Query**, store này có thể thu gọn lại chỉ còn `filters`, vì danh sách video sẽ do Query quản lý.

#### Store 3: `useUIStore`

```js
// Quản lý toàn bộ UI overlay: chỉ 1 instance tồn tại
{
  // Context Menu
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    items: []           // { label, icon, onClick, danger }
  },
  // Modal Stack (hỗ trợ nhiều modal chồng nhau)
  modals: [
    // { id: "details", type: "video-details", props: { videoId } }
  ],
  // Toast
  toasts: [
    // { id, message, type: "success" | "error", duration }
  ],
  theme: "dark"         // "dark" | "light"
}
```

**Tại sao dùng Zustand thay vì Context cho global?**
- Không bị "Provider Hell" (không cần bao bọc nhiều lớp).
- Selector tối ưu: component chỉ re-render khi state nó subscribe thay đổi.
- Persist middleware dễ dàng (lưu volume, theme vào localStorage).
- DevTools middleware hỗ trợ Redux DevTools.

#### Store 4: `useUploadStore`

```js
{
  queue: [
    {
      id: "uuid",
      file: File,
      status: "pending" | "uploading" | "completed" | "error",
      progress: 45,      // %
      abortController: AbortController,
      errorMessage: ""
    }
  ],
  isDropzoneActive: false
}
```

---

## 5. Hooks Architecture (Tầng Hooks)

Project phân biệt rõ 3 loại hook để tránh nhầm lẫn:

### 5.1. Global Hooks (`src/hooks/`)

Dùng ở bất kỳ đâu. Không import từ `features/`.

| Hook | Mục đích |
|---|---|
| `useDebounce(value, delay)` | Trì hoãn cập nhật giá trị (search input) |
| `useLocalStorage(key, defaultValue)` | Sync state ↔ localStorage |
| `useClickOutside(ref, callback)` | Đóng dropdown/menu khi click ngoài |
| `useMediaQuery(query)` | Responsive: `useMediaQuery('(max-width: 768px)')` |
| `usePrevious(value)` | Giữ giá trị trước của prop/state |

### 5.2. Feature Hooks (`features/xxx/hooks/`)

Chỉ dùng trong feature đó. Có thể import từ `services/`, `stores/`, `utils/`.

#### `features/video-player/hooks/`

| Hook | Trách nhiệm |
|---|---|
| `useVideoPlayer(videoRef)` | ⭐ **Core hook**: khởi tạo ref, đăng ký event listeners (`timeupdate`, `progress`, `loadedmetadata`, `ended`, `error`), trả về `{ isPlaying, duration, currentTime, buffered, play, pause, seek, setVolume, setPlaybackRate }` |
| `useTimeline(videoRef)` | Tính toán buffered segments, vị trí preview khi hover, tính % seek |
| `useKeyboardShortcuts(actions)` | Đăng ký `keydown`/`keyup` trên `window`, mapping phím → hành động. Cleanup khi unmount. |
| `useFullscreen(elementRef)` | Wrap Fullscreen API với fallback. Trả về `{ isFullscreen, enter, exit, toggle }` |

#### `features/video-list/hooks/`

| Hook | Trách nhiệm |
|---|---|
| `useVideoList()` | Gọi `videoApi.getList()`, trả về `{ videos, isLoading, error, refetch }`. Nếu dùng TanStack Query, hook này wrap `useQuery`. |
| `useSearchFilter(videos, filters)` | Pure function hook: nhận danh sách gốc + filters, trả về `filteredVideos`. Không side effect. |
| `useRename()` | Mutation: gọi `videoApi.rename()`, tự động `refetch` danh sách hoặc optimistic update. Trả về `{ rename, isRenaming, error }` |

#### `features/video-actions/hooks/`

| Hook | Trách nhiệm |
|---|---|
| `useContextMenu()` | Trả về `{ anchor, isOpen, open(event, items), close() }`. Tính toán vị trí để menu không tràn ra ngoài viewport. |
| `useVideoDetails(videoId)` | Gọi `videoApi.getDetails(videoId)`, trả về metadata. Dùng `useQuery` để cache. |

#### `features/upload/hooks/`

| Hook | Trách nhiệm |
|---|---|
| `useUpload()` | Nhận `File[]`, tạo `FormData`, gọi `uploadApi.upload()` với `onUploadProgress`, quản lý `AbortController`. Cập nhật `useUploadStore`. |

### 5.3. Nguyên tắc viết Hook

1. **1 hook = 1 trách nhiệm.** Nếu `useVideoPlayer` quá dài (>250 dòng), tách `useBuffered` hoặc `usePlaybackState` ra riêng.
2. **Tên bắt đầu bằng `use`.** Không đặt `videoPlayerLogic()` — đó là tên function thường.
3. **Cleanup trong `useEffect`.** Đặc biệt với media events: `removeEventListener` khi unmount.
4. **Không lưu ref vào state.** `videoRef` là ref, `currentTime` cho render nên dùng ref hoặc state có throttle.

---

## 6. Data Flow (Luồng dữ liệu)

### 6.1. Load danh sách video

```
App mount
  → VideoList component mount
    → useVideoList() hook
      → TanStack Query / videoApi.getList()
        → GET /api/videos
      ← Trả về videos[]
    ← Render VideoListItem[]
  ← User thấy sidebar
```

### 6.2. Chọn video để phát

```
User click VideoListItem
  → onClick gọi usePlayerStore.getState().setSelectedVideoId(id)
  → AppLayout re-render (vì lắng nghe selectedVideoId)
  → MainContent truyền id mới xuống VideoPlayer
  → VideoPlayer unmount video cũ, mount video mới
  → VideoCanvas set src = `/videos/${id}`
  → useVideoPlayer hook đăng ký event mới
  ← Video bắt đầu phát
```

### 6.3. Context Menu (Right-click)

```
User right-click trên VideoListItem
  → VideoListItem gọi useUIStore.getState().openContextMenu({ x, y, items })
  → UIStore cập nhật state
  → ContextMenuRoot (mount 1 lần ở App) nhận state mới
  → Render Portal tại vị trí (x, y)
  ← Menu hiện lên

User click "Details"
  → Context menu item onClick gọi useUIStore.getState().openModal('video-details', { videoId })
  → ModalRoot render VideoDetailsModal
  ← Modal hiện lên
```

### 6.4. Upload file

```
User chọn file / kéo thả
  → useUpload() nhận File[]
  → Tạo upload tasks, thêm vào useUploadStore.queue
  → Gọi uploadApi.upload(file, { onProgress })
  → Cập nhật progress trong store
  → UploadProgress component render thanh tiến trình
  ← Khi xong: refetch video list (thêm video mới vào sidebar)
```

---

## 7. Quy ước & Best Practices

### 7.1. Import Path Alias

`vite.config.js`:
```js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

Sử dụng:
```js
import { Button } from '@/components/ui';
import { VideoPlayer } from '@/features/video-player';
import { useDebounce } from '@/hooks/useDebounce';
import { videoApi } from '@/services/videoApi';
```

**Cấm:** Không dùng relative path vượt quá 2 cấp (`../../`). Nếu thấy `../../../`, đó là dấu hiệu cần refactor hoặc dùng alias.

### 7.2. Barrel Export (`index.js`)

Mỗi feature, mỗi folder `components/ui/`, `hooks/`, `utils/` đều có `index.js`:

```js
// features/video-player/index.js
export { VideoPlayer } from './components/VideoPlayer';

// features/video-player/components/index.js
export { VideoPlayer } from './VideoPlayer';
export { VideoCanvas } from './VideoCanvas';
export { Timeline } from './Timeline';
// ...
```

Lợi ích: Import gọn, dễ refactor tên file bên trong.

### 7.3. File Naming

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Component | PascalCase + `.jsx` | `VideoPlayer.jsx`, `PlayPauseButton.jsx` |
| Hook | camelCase + `use` prefix | `useVideoPlayer.js`, `useDebounce.js` |
| Utility | camelCase | `formatTime.js`, `sanitizeFilename.js` |
| Store | camelCase + `use` + `Store` | `usePlayerStore.js` |
| Style module | PascalCase + `.module.css` | `VideoPlayer.module.css` |
| Feature folder | kebab-case | `video-player/`, `video-actions/` |

### 7.4. Giới hạn kích thước file

| Loại file | Giới hạn | Nếu vượt quá |
|---|---|---|
| Component | 200 dòng | Tách thành sub-components |
| Hook | 250 dòng | Tách thành 2+ hooks chuyên biệt |
| Store (Zustand) | 150 dòng | Tách thành nhiều store nhỏ hơn |
| Utility | 100 dòng | Tách thành các hàm riêng |

---

## 8. Lộ trình refactor đề xuất

**Đừng refactor toàn bộ 1 lúc.** Làm theo từng bước, test kỹ sau mỗi bước.

### Giai đoạn 1: Dựng khung (1-2 ngày)
1. Tạo folder structure mới (chưa di chuyển code, chỉ tạo folder trống).
2. Cấu hình Vite alias `@/`.
3. Viết barrel export `index.js` cho các folder.

### Giai đoạn 2: Tách App.jsx (2-3 ngày)
1. Tách `AppLayout` ra khỏi `App.jsx`.
2. Tách `Sidebar` và `MainContent` thành layout components.
3. `App.jsx` chỉ còn ~30-50 dòng.

### Giai đoạn 3: Tách Player (3-4 ngày)
1. Viết `useVideoPlayer` hook — chuyển toàn bộ logic player từ App.jsx vào đây.
2. Tách các nút controls thành component con (`PlayPauseButton`, `Timeline`, v.v.).
3. Tạo `PlayerContext` nội bộ nếu cần truyền data giữa controls.

### Giai đoạn 4: Tách List & Actions (2-3 ngày)
1. Chuyển `VideoList`, `VideoListItem`, `SearchBar`, `FilterBar` vào `features/video-list/`.
2. Chuyển `ContextMenu`, `VideoDetailsModal`, `RenameModal` vào `features/video-actions/`.
3. Viết `useUIStore` để quản lý modal & context menu global.

### Giai đoạn 5: Tách Upload (1-2 ngày)
1. Chuyển logic upload vào `features/upload/`.
2. Viết `useUploadStore` quản lý queue.

### Giai đoạn 6: Polish (1-2 ngày)
1. Thêm TanStack Query thay thế fetch thủ công (nếu muốn).
2. Thêm CSS Modules hoặc Tailwind cho scoped styles.
3. Viết thêm utils chung, dọn dẹp code cũ.

---

## 9. Checklist trước khi merge refactor

- [ ] `App.jsx` < 50 dòng.
- [ ] Không còn file nào > 300 dòng.
- [ ] Không còn import `../../..` vượt quá 2 cấp.
- [ ] Mỗi feature có thể xóa bằng cách xóa 1 folder (không ảnh hưởng feature khác).
- [ ] Video player vẫn phát được, không memory leak (check DevTools Performance).
- [ ] Context menu hoạt động đúng vị trí, đóng khi scroll/resize/click ngoài.
- [ ] Upload vẫn có progress, có thể cancel.
- [ ] Search/filter vẫn hoạt động, không lag với danh sách lớn.

---

*Document này là bản đồ hướng dẫn refactor. Hãy giữ nó ở `docs/architecture.md` và cập nhật khi thêm feature mới.*
