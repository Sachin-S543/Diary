/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    base: mode === 'production' ? '/Diary/' : '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@secret-capsule/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
            '@secret-capsule/crypto-utils': path.resolve(__dirname, '../../packages/crypto-utils/src/index.ts'),
            '@secret-capsule/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts')
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    }
} as any))
