import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    https: false, // Enable HTTPS in production for camera access
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'onnxruntime': ['onnxruntime-web'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  // Required for ONNX Runtime Web to work properly
  resolve: {
    alias: {
      './rn-bridge': './rn-bridge.js',
    },
  },
});
