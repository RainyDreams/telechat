import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const sanitizeName = (value, fallback = 'asset') => {
  const cleaned = String(value || '').replace(/[^a-zA-Z0-9]/g, '')
  return cleaned || fallback
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        hashCharacters: 'hex',
        entryFileNames: 'assets/[name][hash].js',
        chunkFileNames: 'assets/[name][hash].js',
        assetFileNames: (assetInfo) => {
          const rawName = typeof assetInfo?.name === 'string' ? assetInfo.name : ''
          const dot = rawName.lastIndexOf('.')
          const baseName = dot > 0 ? rawName.slice(0, dot) : rawName
          const ext = dot > 0 ? rawName.slice(dot) : ''
          return `assets/${sanitizeName(baseName)}[hash]${ext}`
        },
      },
    },
  },
  server: {
    // 确保 Wrangler 能够正确代理
    // port: 5173,
    // strictPort: true,
  }
})
