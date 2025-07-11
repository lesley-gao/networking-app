import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    outDir: 'build',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          router: ['react-router-dom'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          signalr: ['@microsoft/signalr'],
        },
        // Generate consistent file names for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (ext === 'css') {
            return `assets/styles/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Optimize for CDN delivery
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
  },
  // Environment-specific base path for CDN
  base: mode === 'production' 
    ? process.env.VITE_CDN_BASE_URL || '/' 
    : '/',
  define: {
    // Expose environment variables for CDN configuration
    'process.env.VITE_CDN_STATIC_ASSETS_URL': JSON.stringify(process.env.VITE_CDN_STATIC_ASSETS_URL || ''),
    'process.env.VITE_CDN_APP_URL': JSON.stringify(process.env.VITE_CDN_APP_URL || ''),
  },
}));
