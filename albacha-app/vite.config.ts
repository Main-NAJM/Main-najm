import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// يُنشر التطبيق على مسار ‎/app/‎ من نطاق الاستضافة، ويبقى ‎/‎ أثناء التطوير المحلي.
const base = process.env.APP_BASE_PATH || '/';

export default defineConfig({
  base,
  // ملفات البيئة في جذر المستودع: npm run firebase:setup يكتب .env.local هناك،
  // فيتشاركها التطبيقان بدل نسختين من نفس المفاتيح.
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5180,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
