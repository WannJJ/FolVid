import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,           // Cho phép dùng describe/test/expect không cần import
    environment: 'jsdom',    // Giả lập DOM trong Node
    setupFiles: './src/test/setup.js', // File chạy trước mỗi test
  },
});