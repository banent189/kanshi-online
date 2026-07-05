/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

// 会被 vite-plugin-pwa 替换为预缓存清单
// @ts-expect-error
// eslint-disable-next-line no-undef
self.__WB_MANIFEST

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

// ── 处理分享接收（iOS share_target POST） ──

async function handleSharePost(event: FetchEvent): Promise<Response> {
  try {
    const formData = await event.request.formData()
    const entries = formData.getAll('file') as (File | Blob)[]
    if (entries.length > 0) {
      const files: File[] = entries.map((entry, i) => {
        if (entry instanceof File) return entry
        return new File([entry], `分享-${i + 1}`, { type: entry.type })
      })
      await storeSharedFiles(files)
    }
  } catch (e) {
    console.error('[SW] 分享处理错误:', e)
  }
  return Response.redirect('/convert?shared=1', 302)
}

// ── 缓存远程资源 ──

const CACHE_NAME = 'kanshi-remote-v1'

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const resp = await fetch(request)
    if (resp.ok) {
      const clone = resp.clone()
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
    }
    return resp
  } catch {
    return cached ?? new Response('', { status: 503 })
  }
}

// ── 路由 ──

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url)

  // 拦截 POST → /convert（iOS share_target）
  if (event.request.method === 'POST' && url.pathname === '/convert') {
    event.respondWith(handleSharePost(event))
    return
  }

  // 远程字体缓存
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request))
  }
})

// ── 生命周期 ──

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})
