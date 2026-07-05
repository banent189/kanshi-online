import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-512.png', 'icon-192.png', 'icon-180.png', 'icon-120.png'],
      manifest: {
        name: '簡紙 Kanshi',
        short_name: '簡紙',
        description: '图片/文档转PDF工具，从微信分享即可转换',
        theme_color: '#2B4C7E',
        background_color: '#F5F0E8',
        display: 'standalone',
        id: 'kanshi-online',
        start_url: '/',
        scope: '/',
        lang: 'zh-CN',
        icons: [
          {
            src: 'icon-120.png',
            sizes: '120x120',
            type: 'image/png',
          },
          {
            src: 'icon-180.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        share_target: {
          action: '/convert',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'file',
                accept: [
                  'image/*',
                  'application/pdf',
                ],
              },
            ],
          },
        } as any, // TypeScript的类型定义暂未完全覆盖share_target的files参数
      },
    }),
  ],
})
