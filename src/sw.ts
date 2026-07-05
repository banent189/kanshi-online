/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

import { precacheAndRoute } from 'workbox-precaching'
import { setCacheNameDetails } from 'workbox-core'

setCacheNameDetails({ prefix: 'kanshi', suffix: 'v1', precache: 'precache', runtime: 'runtime' })

// 这个变量会被 vite-plugin-pwa 替换为实际文件清单
precacheAndRoute(self.__WB_MANIFEST)

// ── IndexedDB 工具 ──

const DB_NAME = 'kanshi-shares'
const DB_VERSION = 1
const STORE_NAME = 'pending'

function openShareDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function storeSharedFiles(files: File[]): Promise<void> {
  const db = await openShareDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(files, 'files')
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

// ── 处理 iOS 分享接收 ──

async function handleSharePost(event: FetchEvent): Promise<Response> {
  try {
    const formData = await event.request.formData()
    // iOS 和 Android 共享时可能用 'file' 或 'media' 字段名
    const entries = formData.getAll('file') as (File | Blob)[]
    if (entries.length > 0) {
      const files: File[] = entries.map((entry, i) => {
        if (entry instanceof File) return entry
        return new File([entry], `分享-${i + 1}`, { type: entry.type })
      })
      await storeSharedFiles(files)
      console.log('[SW] 已存储', files.length, '个分享文件')
    } else {
      // 也可能是单文件或多字段名
      for (const key of formData.keys()) {
        const val = formData.get(key)
        if (val instanceof File) {
          await storeSharedFiles([val])
          break
        }
      }
    }
  } catch (e) {
    console.error('[SW] 分享处理错误:', e)
  }
  return Response.redirect('/convert?shared=1', 302)
}

// ── Fetch 路由 ──

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url)

  // iOS share_target POST → 拦截并重定向
  if (event.request.method === 'POST' && url.pathname === '/convert') {
    event.respondWith(handleSharePost(event))
    return
  }

  // 远程字体缓存
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone()
            caches.open('kanshi-fonts-v1').then(cache => cache.put(event.request, clone))
          }
          return resp
        })
      })
    )
  }
})

// ── 生命周期 ──

self.addEventListener('install', () => {
  console.log('[SW] 安装完成')
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  console.log('[SW] 已激活')
  self.clients.claim()
})
