/**
 * 读取并清理 Service Worker 存储的分享文件（iOS share_target 路径）
 * 当 iOS 分享到 PWA 时，SW 拦截 POST 并存到 IndexedDB，
 * 前端页面读取后清理。
 */
export async function consumeSharedFiles(): Promise<File[]> {
  try {
    const db = await openShareDB()
    const files: File[] = await new Promise((resolve, reject) => {
      const tx = db.transaction('pending', 'readonly')
      const req = tx.objectStore('pending').get('files')
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
    if (files.length === 0) return []

    // 读取后清理
    const tx = db.transaction('pending', 'readwrite')
    tx.objectStore('pending').delete('files')
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()

    return files
  } catch {
    return []
  }
}

function openShareDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kanshi-shares', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('pending')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
