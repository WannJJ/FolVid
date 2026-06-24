import { http, HttpResponse } from "msw";

const API_BASE_URL = "http://localhost:4000";

export const handlers = [
  // GET /api/videos
  http.get(`${API_BASE_URL}/api/videos`, () => {
    return HttpResponse.json(["video1.mp4", "video2.webm", "clip.mov"]);
  }),

  // PUT /api/videos/:name
  http.put(`${API_BASE_URL}/api/videos/:name`, async ({ request }) => {
    const body = await request.json();

    if (body.newName === "existing.mp4") {
      return new HttpResponse(JSON.stringify({ error: "File đã tồn tại" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new HttpResponse(null, { status: 200 });
  }),

  // POST /api/upload
  http.post(`${API_BASE_URL}/api/upload`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("video");

    if (!file) {
      return new HttpResponse(JSON.stringify({ error: "Không có file" }), {
        status: 400,
      });
    }

    return HttpResponse.json({
      filename: file.name,
      size: file.size,
      message: "Upload thành công",
    });
  }),

  // POST /api/metadata
  http.post(`${API_BASE_URL}/api/metadata`, async ({ request }) => {
    const body = await request.json();

    if (!body.title) {
      return new HttpResponse(JSON.stringify({ error: "Thiếu title" }), {
        status: 400,
      });
    }

    return new HttpResponse(null, { status: 201 });
  }),

  // GET /cache/storyboard/:name
  http.get(`${API_BASE_URL}/cache/storyboard/:name`, ({ params }) => {
    const { name } = params;

    if (name === "nonexistent.storyboard.json") {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      duration: 120,
      interval: 10,
      sprites: [
        { time: 0, x: 0, y: 0 },
        { time: 10, x: 100, y: 0 },
      ],
    });
  }),
];
