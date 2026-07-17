import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/guli/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lightweight-charts')) return 'lightweight-charts'
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender') || id.includes('node_modules/echarts-for-react')) return 'echarts'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/zustand')) return 'state'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) return 'react-vendor'
        },
      },
    },
  },
})
