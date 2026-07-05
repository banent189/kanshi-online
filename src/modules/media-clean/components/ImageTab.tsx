import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CanvasEditor from './CanvasEditor'
import type { Rect } from '../processors/imageProcessor'
import { removeWatermark, isSupportedImageType } from '../processors/imageProcessor'
import { downloadFile, shareFile } from '../../../shared/utils/share'

type Phase = 'upload' | 'select' | 'result'

export default function ImageTab() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [originalBitmap, setOriginalBitmap] = useState<ImageBitmap | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string>('')
  const [selection, setSelection] = useState<Rect | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [originalUrl, resultUrl])

  // 粘贴监听
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) await loadImage(file)
          return
        }
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [])

  const loadImage = async (file: File) => {
    if (!isSupportedImageType(file.type)) {
      alert('仅支持 PNG / JPG / WebP / GIF')
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      setOriginalBitmap(bitmap)
      setOriginalUrl(URL.createObjectURL(file))
      setPhase('select')
      setSelection(null)
      setResultBlob(null)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultUrl('')
    } catch {
      alert('图片加载失败')
    }
  }

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp,image/gif'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) loadImage(file)
    }
    input.click()
  }

  const handleRemoveWatermark = useCallback(async () => {
    if (!originalBitmap || !selection) return
    setProcessing(true)
    try {
      const blob = await removeWatermark(originalBitmap, selection)
      setResultBlob(blob)
      setResultUrl(URL.createObjectURL(blob))
      setPhase('result')
    } catch (err) {
      alert(err instanceof Error ? err.message : '处理失败')
    } finally {
      setProcessing(false)
    }
  }, [originalBitmap, selection])

  const handleNewImage = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    originalBitmap?.close()
    setOriginalBitmap(null)
    setOriginalUrl('')
    setSelection(null)
    setResultBlob(null)
    setResultUrl('')
    setPhase('upload')
  }

  return (
    <motion.div
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AnimatePresence mode="wait">
        {/* 选择图片 */}
        {phase === 'upload' && (
          <motion.div
            key="upload"
            className="flex-1 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="w-full max-w-xs py-10 rounded-2xl border-2 border-dashed border-[var(--border)]
                bg-white/40 flex flex-col items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleFileSelect}
            >
              <span className="text-5xl opacity-60">🖼️</span>
              <span className="text-base font-medium" style={{ color: 'var(--ink)' }}>
                选择图片
              </span>
              <span className="text-xs opacity-40">PNG / JPG / WebP / GIF</span>
            </motion.button>

            <p className="mt-4 text-xs opacity-30">
              或 Ctrl+V 粘贴截图
            </p>
          </motion.div>
        )}

        {/* 选区 */}
        {phase === 'select' && originalBitmap && (
          <motion.div
            key="select"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mt-4">
              <CanvasEditor
                imageBitmap={originalBitmap}
                selection={selection}
                onSelection={setSelection}
              />
            </div>

            {selection && (
              <motion.div
                className="mt-3 flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-xs opacity-40">
                  {selection.w}×{selection.h} px
                </span>
                <button
                  className="text-xs opacity-30 hover:opacity-60"
                  onClick={() => setSelection(null)}
                >
                  清除
                </button>
              </motion.div>
            )}

            <div className="mt-4 flex gap-3">
              <motion.button
                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg
                  disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: processing ? 'var(--border)' : 'var(--ink)',
                  color: '#fff',
                }}
                disabled={!selection || processing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleRemoveWatermark}
              >
                {processing ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                    处理中...
                  </>
                ) : (
                  '✨ 去除水印'
                )}
              </motion.button>
              <motion.button
                className="px-4 py-3 rounded-xl font-medium text-sm border-2"
                style={{ borderColor: 'var(--border)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewImage}
              >
                ↺ 重选
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 结果 */}
        {phase === 'result' && resultUrl && (
          <motion.div
            key="result"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium mb-2 opacity-40 text-center">原图</p>
                <img
                  src={originalUrl}
                  className="w-full rounded-xl border border-[var(--border)] bg-white/60"
                  alt="原图"
                />
              </div>
              <div>
                <p className="text-[11px] font-medium mb-2 opacity-40 text-center">去水印</p>
                <img
                  src={resultUrl}
                  className="w-full rounded-xl border-2 border-green-200 bg-white/60"
                  alt="处理后"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <motion.button
                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg"
                style={{ backgroundColor: 'var(--ink)', color: '#fff' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { if (resultBlob) downloadFile(resultBlob, '去水印.png') }}
              >
                💾 下载
              </motion.button>
              <motion.button
                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 border-2"
                style={{ borderColor: 'var(--border)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { if (resultBlob) shareFile(resultBlob, '去水印.png') }}
              >
                📤 分享
              </motion.button>
            </div>

            <div className="mt-3 flex gap-3">
              <motion.button
                className="flex-1 py-2 rounded-lg text-sm border-2"
                style={{ borderColor: 'var(--border)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelection(null); setPhase('select') }}
              >
                ↺ 重新选区
              </motion.button>
              <motion.button
                className="flex-1 py-2 rounded-lg text-sm border-2"
                style={{ borderColor: 'var(--border)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewImage}
              >
                🖼️ 换一张
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
