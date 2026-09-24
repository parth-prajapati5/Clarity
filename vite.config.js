import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Tauri expects a fixed dev server port
  server: {
    port: 1420,
    strictPort: true,
    // Do NOT open browser — Tauri manages the window
    open: false,
  },
  // Prevent Vite from obscuring Rust errors in the terminal
  clearScreen: false,
  // Tauri uses environment variables to communicate dev / prod
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri supports es2021
    target: ['es2021', 'chrome100', 'safari13'],
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy charting + d3 deps into their own chunk
          'vendor-recharts': ['recharts'],
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
})
