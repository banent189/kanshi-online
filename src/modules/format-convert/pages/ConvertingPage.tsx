import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { convert, type ConvertProgress } from '../converters'
import type { OutputFormat } from '../../../shared/utils/fileHelper'
import { FORMATS, formatFileSize } from '../../../shared/utils/fileHelper'
import { shareFile, downloadFile, previewFileInWeChat, isDesktop, isWeChatBrowser, type ShareResult } from '../../../shared/utils/share'

interface ConvertState {
  files: File[]
  format: OutputFormat
  fileName: string
}

type PagePhase = 'converting' | 'done' | 'error'
type EnvType = 'normal' | 'desktop' | 'wechat'

export default function ConvertingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ConvertState | null

  const [phase, setPhase] = useState<PagePhase>('converting')
  const [progress, setProgress] = useState<ConvertProgress>({ current: 0, total: 1, message: '准备中...' })
  const [error, setError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [customName, setCustomName] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [failBar, setFailBar] = useState(false)

  const resultRef = useRef<{ blob: Blob; fileName: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const fileExtRef = useRef('')

  const formatInfo = FORMATS.find(f => f.key === state?.format)
  const percent = Math.min(
    Math.round((progress.current / Math.max(progress.total, 1)) * 100),
    100
  )

  // ── 环境检测 ──
  const env: EnvType = isWeChatBrowser() ? 'wechat' : isDesktop() ? 'desktop' : 'normal'

  // ====== 生命周期 ======
  useEffect(() => {
    if (!state?.files?.length) {
      navigate('/', { replace: true })
      return
    }
    setCustomName(state.fileName)
    doConvert()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus()
      const val = inputRef.current.value
      const dotIdx = val.lastIndexOf('.')
      if (dotIdx > 0) inputRef.current.setSelectionRange(0, dotIdx)
      else inputRef.current.select()
    }
  }, [editingName])

  // ====== 转换 ======
  async function doConvert() {
    if (!state) return
    try {
      const result = await convert(state.files, state.format, (p) => {
        setProgress({ ...p })
      })
      resultRef.current = result

      const parts = result.fileName.split('.')
      fileExtRef.current = parts.length > 1 ? '.' + parts.pop()! : ''

      // 保留用户在 ConvertPage 设置的名字，否则用结果文件名
      setCustomName(state.fileName || result.fileName.replace(/\.[^/.]+$/, ''))

      setProgress({ current: 1, total: 1, message: '转换完成' })
      timerRef.current = setTimeout(() => setPhase('done'), 450)
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败')
      setPhase('error')
    }
  }

  // ====== 操作 ======
  const handlePrimaryAction = async () => {
    const r = resultRef.current
    if (!r) return
    const finalName = customName + fileExtRef.current

    if (env === 'wechat') {
      // 微信内置浏览器：用预览文件代替分享
      previewFileInWeChat(r.blob, finalName)
      return
    }

    if (env === 'desktop') {
      // 桌面端不支持分享文件，直接保存
      downloadFile(r.blob, finalName)
      return
    }

    // 正常手机：分享
    setShareLoading(true)
    setFailBar(false)
    const shareResult: ShareResult = await shareFile(r.blob, finalName)
    setShareLoading(false)
    if (shareResult === 'failed' || shareResult === 'unsupported') {
      setFailBar(true)
    }
  }

  const handleSave = () => {
    const r = resultRef.current
    if (!r) return
    const finalName = customName + fileExtRef.current
    downloadFile(r.blob, finalName)
  }

  // ====== 错误页 ======
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--washi)' }}>
        <motion.div
          className="text-6xl mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          😅
        </motion.div>
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--rust)' }}>转换失败</p>
        <p className="text-sm opacity-50 mb-8 text-center">{error}</p>
        <motion.button
          className="px-8 py-3 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--ink)', color: '#fff' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/', { replace: true })}
        >
          回到首页
        </motion.button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ backgroundColor: 'var(--washi)' }}>
      <AnimatePresence mode="wait">
        {/* ── 转换中 ── */}
        {phase === 'converting' && (
          <motion.div
            key="converting"
            className="flex-1 flex flex-col items-center justify-center"
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative w-28 h-28 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="3" />
                <motion.circle
                  cx="40" cy="40" r="34"
                  fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - percent / 100) }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  className="text-lg font-medium tracking-wider"
                  style={{ color: 'var(--ink)' }}
                  key={percent}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {percent}%
                </motion.span>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.p
                key={progress.message}
                className="text-sm text-center px-4"
                style={{ color: 'var(--ink-light)' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {progress.message}
              </motion.p>
            </AnimatePresence>

            {formatInfo && (
              <motion.div
                className="mt-6 px-4 py-1.5 rounded-full bg-white/50 border border-[var(--border)] flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <span className="text-sm">{formatInfo.icon}</span>
                <span className="text-xs" style={{ color: 'var(--ink-light)' }}>{formatInfo.label}</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── 转换完成 ── */}
        {phase === 'done' && (
          <motion.div
            key="done"
            className="flex-1 flex flex-col items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* 纸鹤 */}
            <motion.div
              className="text-5xl mb-5"
              initial={{ scale: 0, rotate: -15, y: 30 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 13, mass: 0.8 }}
            >
              <span>🕊️</span>
            </motion.div>

            <motion.p
              className="text-xl font-medium mb-6"
              style={{ color: 'var(--ink)' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              转换完成 ✓
            </motion.p>

            {/* ── 文件信息卡片（可重命名） ── */}
            <motion.div
              className="w-full max-w-xs rounded-xl border-2 border-[var(--border)] bg-white/60 p-4 mb-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{formatInfo?.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <input
                      ref={inputRef}
                      className="w-full text-sm font-medium bg-white rounded-md px-2 py-1
                        border-2 border-[var(--ink)] outline-none"
                      style={{ color: 'var(--ink)' }}
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium truncate cursor-pointer hover:opacity-60 transition-opacity"
                        style={{ color: 'var(--ink)' }}
                        onClick={() => setEditingName(true)}
                      >
                        {customName}{fileExtRef.current}
                      </span>
                      <button
                        className="text-xs opacity-30 hover:opacity-60 shrink-0 p-0.5"
                        onClick={() => setEditingName(true)}
                      >
                        ✎
                      </button>
                    </div>
                  )}
                  <div className="text-xs opacity-50 mt-0.5">
                    {resultRef.current ? formatFileSize(resultRef.current.blob.size) : ''}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── 主要操作 ── */}
            <motion.button
              className="w-full max-w-xs py-4 rounded-xl font-medium text-lg shadow-lg
                flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--ink)', color: '#fff' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              disabled={shareLoading}
              onClick={handlePrimaryAction}
            >
              {env === 'desktop' ? (
                '💾 保存下载'
              ) : env === 'wechat' ? (
                shareLoading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                    准备中...
                  </>
                ) : '📤 发送给好友'
              ) : (
                shareLoading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                    准备分享...
                  </>
                ) : '📤 分享给好友'
              )}
            </motion.button>

            {/* ── 环境提示 ── */}
            {env === 'desktop' && (
              <motion.div
                className="max-w-xs mx-auto mt-3 px-4 py-2.5 rounded-xl bg-white/50 border border-[var(--border)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <p className="text-xs text-center" style={{ color: 'var(--ink-light)' }}>
                  💡 桌面端暂不支持直接分享<br />
                  保存后拖入微信窗口即可发送给好友
                </p>
              </motion.div>
            )}
            {env === 'wechat' && (
              <motion.div
                className="max-w-xs mx-auto mt-3 px-4 py-2.5 rounded-xl bg-white/50 border border-[var(--border)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <p className="text-xs text-center" style={{ color: 'var(--ink-light)' }}>
                  💡 文件将在微信中打开<br />
                  点击右上角「···」即可发送给朋友
                </p>
              </motion.div>
            )}

            {/* ── 保存（微信/手机环境显示为次要按钮） ── */}
            {env !== 'desktop' && (
              <motion.button
                className="w-full max-w-xs py-3 rounded-xl font-medium border-2 mt-3
                  flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--border)' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
              >
                💾 保存
              </motion.button>
            )}

            {/* ── 回到首页 ── */}
            <motion.button
              className="mt-5 text-sm opacity-40 hover:opacity-60 transition-opacity py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/', { replace: true })}
            >
              回到首页
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 分享失败提示条 ── */}
      <AnimatePresence>
        {failBar && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <div
              className="mx-auto max-w-xs rounded-xl bg-white/95 border-2 border-[var(--border)]
                shadow-xl px-5 py-4 flex items-center gap-3 cursor-pointer"
              onClick={() => setFailBar(false)}
            >
              <span className="text-lg shrink-0">📋</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>分享未完成</p>
                <p className="text-xs opacity-50 mt-0.5">文件名已复制到剪贴板</p>
              </div>
              <motion.button
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: 'var(--ink)', color: '#fff' }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); setFailBar(false); handleShare() }}
              >
                重试
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        className="text-center text-xs opacity-30 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        文件仅在本地处理，不会上传 ✓
      </motion.p>
    </div>
  )
}
