import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // 커스텀 도메인을 사용하는 경우 base를 '/'로 설정
    const isCustomDomain = env.CUSTOM_DOMAIN === 'true';
    return {
      base: isCustomDomain ? '/' : '/bloggogogo/',
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        exclude: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore']
      }
    };
});
