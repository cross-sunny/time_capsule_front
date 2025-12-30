// 1. 关键修复：导入 Vite 的 defineConfig 函数（解决未定义报错）
// 2. 关键修复：导入 @vitejs/plugin-vue 插件（支持 Vue 项目编译）
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/time_capsule/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  }
})