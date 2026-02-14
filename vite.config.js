import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 确保 Wrangler 能够正确代理
    // port: 5173,
    // strictPort: true,
  }
})