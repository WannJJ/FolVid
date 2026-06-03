import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Tùy chọn: alias sâu hơn nếu muốn
      "@features": path.resolve(__dirname, "./src/features"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@services": path.resolve(__dirname, "./src/services"),
    },
  },
  test: {
    globals: true, // Cho phép dùng describe/test/expect không cần import
    environment: "jsdom", // Giả lập DOM trong Node
    setupFiles: "./src/test/setup.js", // File chạy trước mỗi test
  },
});
