# 📚 FolVid Documentation

> Thư mục này chứa toàn bộ tài liệu kỹ thuật, ghi chép quyết định kiến trúc (ADR), và hướng dẫn triển khai cho dự án **FolVid**.
>
> **Mục tiêu:** Khi bạn (hoặc ai đó) mở lại project sau 3 tháng, không cần đoán mò "hồi đó mình nghĩ gì", chỉ cần vào đây đọc.

---

## 📁 Cấu trúc thư mục

```
docs/
├── README.md                          ← Bạn đang đọc file này (mục lục)
├── video-seek-preview-strategies.md   ← ADR: Các phương pháp preview khi hover progress bar
└── (các file ADR khác sẽ được thêm dần)
```

---

## 🗂️ Danh sách tài liệu

| File | Chủ đề | Trạng thái | Ghi chú |
|------|--------|------------|---------|
| `video-seek-preview-strategies.md` | 3 cách làm Hover Thumbnail (Video ẩn / Storyboard / Hybrid) | ✅ Hoàn thành | Đọc khi cần bổ sung tính năng preview |

---

## 🏗️ Quy ước viết ADR (Architecture Decision Record)

Khi bạn cần ghi lại một quyết định kỹ thuật quan trọng (chọn thư viện nào, cách xử lý vấn đề gì...), hãy tạo file mới theo mẫu:

### Đặt tên file
```
adr-[số thứ tự]-[tên-vấn-đề-ngắn-gọn].md

Ví dụ:
adr-001-tech-stack.md
adr-002-video-formats.md
adr-003-seek-preview.md
```

### Cấu trúc nội dung mỗi ADR

```markdown
# Tiêu đề vấn đề

## Ngữ cảnh
Tại sao cần ra quyết định này? Vấn đề gì đang gặp phải?

## Các phương án được xem xét
- Phương án A: ...
- Phương án B: ...

## Quyết định
Chọn phương án nào? Tại sao?

## Hệ quả
Chấp nhận đánh đổi gì? Cần làm gì tiếp theo?

## Code tham khảo / Triển khai
(Link hoặc snippet nếu cần)
```

---

## 🚀 Hướng dẫn sử dụng (cho chính bạn)

### Khi nào vào đây?
- **Trước khi code tính năng mới:** Kiểm tra xem đã có ADR nào liên quan chưa, tránh viết lại từ đầu.
- **Khi gặp bug lạ:** Xem lại quyết định cũ có đoán trước case này không.
- **Sau khi refactor:** Cập nhật ADR cũ hoặc tạo ADR mới giải thích tại sao đổi.

### Khi nào tạo file mới?
- Giải pháp có từ **2 phương án khả thi** trở lên cần so sánh.
- Tính năng ảnh hưởng đến **hiệu năng, bảo mật, hoặc trải nghiệm người dùng**.
- Bạn mất **> 30 phút** nghiên cứu trên Google/StackOverflow để quyết định.

> **Quy tắc vàng:** Nếu bạn phải suy nghĩ "làm A hay B đây?", hãy ghi lại.

---

## 📌 Các chủ đề dự kiến (Roadmap)

- [ ] **ADR-001:** Tech Stack & Lý do chọn React + Vite + Express
- [ ] **ADR-002:** Cách xử lý video định dạng đặc biệt (.mkv, .avi) – transcode hay từ chối?
- [ ] **ADR-003:** Video Seek Preview (đã có file)
- [ ] **ADR-004:** Authentication – Có cần đăng nhập không? JWT hay Session?
- [x] **ADR-005:** Responsive Design – Xử lý layout trên mobile/tablet
- [ ] **ADR-006:** Playlist & Phát liên tụp (queue system)
- [ ] **ADR-007:** Triển khai Production – Build & deploy như thế nào?

---

## 💡 Mẹo nhanh

- **GitHub render `.md` rất đẹp:** Bạn có thể đọc trực tiếp trên trình duyệt không cần mở IDE.
- **Tìm kiếm nhanh:** Dùng `Ctrl+F` trong GitHub để tìm từ khóa qua toàn bộ thư mục `docs/`.
- **Link chéo:** Trong các ADR, nên dùng đường dẫn tương đối để link đến nhau. Ví dụ: `[xem chi tiết](./video-seek-preview-strategies.md)`.

---

*Đây là tài liệu sống (living document). Nó sẽ được cập nhật mỗi khi project phát triển.*
