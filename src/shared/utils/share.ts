export type ShareResult = 'shared' | 'aborted' | 'failed' | 'unsupported'

// ── 环境检测 ──

/** 桌面端（非移动设备） */
export function isDesktop(): boolean {
  return !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** 微信内置浏览器 */
export function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent)
}

/** 是否以 PWA 独立模式运行（已添加到主屏幕） */
export function isRunningStandalone(): boolean {
  return (navigator as any).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches
}

// ── 分享 ──

/**
 * 分享文件
 *
 * ① HTTPS 下优先分享文件（files），弹出系统分享菜单可选微信
 * ② HTTP 下降级分享文字
 * ③ 失败时自动复制文件名到剪贴板
 *
 * 不再使用 alert() 弹窗，由调用方处理反馈
 */
export async function shareFile(blob: Blob, fileName: string): Promise<ShareResult> {
  if (!navigator.share) {
    await copyFallback(fileName)
    return 'unsupported'
  }

  try {
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName)] })) {
      await navigator.share({
        files: [new File([blob], fileName)],
        title: fileName,
      })
      return 'shared'
    }

    // 降级：分享文字（HTTP 下安卓 Chrome 也能弹出分享菜单）
    await navigator.share({
      title: fileName,
      text: `📄 ${fileName} — 来自 簡紙 Kanshi`,
    })
    return 'shared'
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'aborted'
    // 分享失败 → 剪贴板兜底
    await copyFallback(fileName)
    return 'failed'
  }
}

/** 兜底：复制文件名到剪贴板 */
async function copyFallback(fileName: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(`📄 ${fileName} — 来自 簡紙 Kanshi`)
    return true
  } catch {
    return false
  }
}

export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ── 微信内置浏览器专用：预览文件 ──

/**
 * 微信内置浏览器屏蔽了 navigator.share()，但打开 PDF/图片
 * 会触发微信自带的文件查看器，用户可以通过查看器的「···」
 * 菜单发送给朋友。
 */
export function previewFileInWeChat(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 不立即 revoke：微信需要时间加载文件
  setTimeout(() => URL.revokeObjectURL(url), 120000)
}
