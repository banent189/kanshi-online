import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../../../shared/components/Logo'
import FormatPicker from '../../../shared/components/FormatPicker'
import type { FileItem, OutputFormat } from '../../../shared/utils/fileHelper'
import { FORMATS } from '../../../shared/utils/fileHelper'
import { canConvert, getUnsupportedReason } from '../converters'
import { isRunningStandalone } from '../../../shared/utils/share'

interface ConvertState {
  files: FileItem[]
  format: OutputFormat
  fileName: string
}

export default function ConvertPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ConvertState | null

  const [files, setFiles] = useState<FileItem[]>([])
  const [format, setFormat] = useState<OutputFormat>('pdf')
  const [customName, setCustomName] = useState('')
  const launchQueueSet = useRef(false)

  // ====== 接收外部导入的文件（share_target / launchQueue） ======
  useEffect(() => {
    if (state?.files && state.files.length > 0) {
      setFiles(state.files)
      setFormat(state.format)
      setCustomName(state.fileName)
      return
    }
    tryAutoImport()
  }, [])

  // 更新文件名默认值
  useEffect(() => {
    if (files.length === 0) return
    const name = files.length === 1
      ? files[0].name.replace(/\.[^/.]+$/, '')
      : '合并文档'
    setCustomName(n => n || name)
  }, [files])

  /** 从 launchQueue（PWA share_target）获取文件 */
  async function tryAutoImport() {
    try {
      if ('launchQueue' in window && window.launchQueue && !launchQueueSet.current) {
        launchQueueSet.current = true
        window.launchQueue.setConsumer(async (params) => {
          const handles = params.files
          if (handles && handles.length > 0) {
            const items: FileItem[] = []
            for (let i = 0; i < handles.length; i++) {
              const f = await handles[i].getFile()
              items.push({ id: `share-${Date.now()}-${i}`, file: f, name: f.name, size: f.size, type: f.type })
            }
            if (items.length > 0) setFiles(items)
          }
        })
      }
    } catch {
      // launchQueue 不可用（非 PWA 环境）
    }
  }

  const handleSelectFiles = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '*/*'
    input.multiple = true
    input.onchange = (e) => {
      const selected = Array.from((e.target as HTMLInputElement).files || [])
      if (selected.length === 0) return
      const newItems: FileItem[] = selected.map((f, i) => ({
        id: `${Date.now()}-${i}`,
        file: f,
        name: f.name,
        size: f.size,
        type: f.type,
      }))
      setFiles(prev => [...prev, ...newItems])
    }
    input.click()
  }

  const handleConvert = () => {
    if (files.length === 0) return

    const rawFiles = files.map(f => f.file)
    if (!canConvert(rawFiles, format)) {
      const reason = getUnsupportedReason(rawFiles, format)
      alert(reason || '不支持的转换组合')
      return
    }

    const baseName = customName.trim() || (
      files.length === 1
        ? files[0].name.replace(/\.[^/.]+$/, '')
        : '合并文档'
    )

    navigate('/converting', {
      state: {
        files: rawFiles,
        format,
        fileName: baseName,
      },
    })
  }

  const formatInfo = FORMATS.find(f => f.key === format)

  const getActionHint = () => {
    const hasImage = files.some(f => f.file.type.startsWith('image/'))
    const hasPdf = files.some(f => f.file.type === 'application/pdf' || f.file.name.endsWith('.pdf'))
    if (format === 'pdf' && hasImage && !hasPdf) return `将 ${files.length} 张图片合并为一个 PDF`
    if (format === 'pdf' && hasPdf && files.length > 1) return `将 ${files.length} 个 PDF 合并为一个文档`
    if (format === 'pdf' && hasPdf) return 'PDF 合并需选择 2 个以上 PDF'
    if ((format === 'jpg' || format === 'png') && hasImage) return `将图片转换为 ${formatInfo?.label} 格式`
    return ''
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ backgroundColor: 'var(--washi)' }}>
      <div className="pt-4 pb-4 flex items-center gap-3">
        <motion.button
          className="text-lg opacity-40 -ml-1 p-1"
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
        >
          ←
        </motion.button>
        <Logo size="sm" />
      </div>

      {files.length === 0 ? (
        /* ── 空态：选择文件 ── */
        <motion.div
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.button
            className="w-full max-w-xs py-6 rounded-2xl border-2 border-dashed border-[var(--border)]
              bg-white/40 flex flex-col items-center justify-center gap-2 mb-8"
            style={{ minHeight: 140 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSelectFiles}
          >
            <span className="text-4xl opacity-60">📂</span>
            <span className="text-base font-medium" style={{ color: 'var(--ink)' }}>
              选择文件
            </span>
            <span className="text-xs opacity-40">
              图片 / PDF
            </span>
          </motion.button>

          <FormatPicker selected={format} onChange={setFormat} />

          <motion.button
            className="mt-6 text-sm underline underline-offset-4"
            style={{ color: 'var(--ink-light)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
          >
            回到首页
          </motion.button>

          {/* 支持说明 */}
          <motion.div
            className="max-w-xs mx-auto w-full mt-8 rounded-xl border border-[var(--border)] bg-white/40 px-4 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[11px] font-medium mb-2 opacity-50" style={{ color: 'var(--charcoal)' }}>
              📋 支持的转换
            </p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="opacity-40 mt-0.5">─</span>
                <div>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>图片</span>
                  <span className="opacity-50"> → PDF / JPG / PNG</span>
                  <div className="text-[10px] opacity-40">PNG / JPG / WebP / GIF / BMP</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="opacity-40 mt-0.5">─</span>
                <div>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>PDF</span>
                  <span className="opacity-50"> → PDF 合并</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 从微信接收图片指引 */}
          {!isRunningStandalone() && (
            <motion.div
              className="max-w-xs mx-auto w-full mt-3 rounded-xl border border-[var(--border)] bg-white/40 px-4 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-[11px] font-medium mb-2 opacity-50" style={{ color: 'var(--charcoal)' }}>
                📱 从微信接收图片
              </p>
              <div className="text-[11px] space-y-1.5 opacity-60" style={{ color: 'var(--ink)' }}>
                <p>1. 将本网站添加到主屏幕（PWA）</p>
                <p>2. 在微信中打开图片 → 分享</p>
                <p>3. 选择「簡紙 Kanshi」→ 自动载入</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        /* ── 已选文件 ── */
        <motion.div
          className="flex-1 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* 文件列表 */}
          <div className="space-y-2 mb-4">
            {files.map((f, i) => (
              <FileRow key={f.id} file={f} onRemove={() => setFiles(prev => prev.filter(x => x.id !== f.id))} delay={i} />
            ))}
          </div>

          {/* 继续添加 */}
          <motion.button
            className="mb-4 py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] bg-white/30
              text-xs flex items-center justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSelectFiles}
          >
            <span>＋</span> 继续添加文件
          </motion.button>

          {/* 格式选择 */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-3 opacity-50">
              转换为：
            </p>
            <FormatPicker selected={format} onChange={setFormat} />
          </div>

          {/* ── 文件名自定义 ── */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs font-medium mb-2 opacity-50">
              输出文件名：
            </p>
            <div className="flex items-center gap-2 bg-white/60 rounded-xl border-2 border-[var(--border)] px-4 py-2.5">
              <span className="text-sm opacity-40 shrink-0">✎</span>
              <input
                className="flex-1 text-sm font-medium bg-transparent outline-none min-w-0"
                style={{ color: 'var(--ink)' }}
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder={
                  files.length === 1
                    ? files[0].name.replace(/\.[^/.]+$/, '')
                    : '合并文档'
                }
              />
              <span className="text-xs opacity-40 shrink-0">
                {formatInfo?.ext || `.${format}`}
              </span>
            </div>
          </motion.div>

          {/* 操作提示 */}
          {getActionHint() && (
            <motion.div
              className="mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-xs px-3 py-1.5 rounded-full bg-white/60 border border-[var(--border)]" style={{ color: 'var(--ink-light)' }}>
                🕊️ {getActionHint()}
              </span>
            </motion.div>
          )}

          {/* 转换按钮 */}
          <motion.button
            className="w-full py-4 rounded-xl font-medium text-lg tracking-wider shadow-lg
              flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--ink)', color: '#fff' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleConvert}
          >
            <span>🕊️</span>
            开始转换 {formatInfo?.label}
          </motion.button>

          {/* 取消 */}
          <motion.button
            className="mt-4 text-sm opacity-40 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
          >
            取消，回到首页
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

/** 单行文件展示（带图片缩略图） */
function FileRow({ file, onRemove, delay }: { file: FileItem; onRemove: () => void; delay: number }) {
  const [thumb, setThumb] = useState('')

  useEffect(() => {
    if (!file.file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setThumb(reader.result as string)
    reader.readAsDataURL(file.file)
  }, [file.file])

  return (
    <motion.div
      className="rounded-xl border-2 border-[var(--border)] bg-white/60 p-2.5 flex items-center gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
    >
      {thumb ? (
        <img src={thumb} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[var(--border)]" alt="" />
      ) : (
        <span className="w-10 h-10 flex items-center justify-center text-lg shrink-0">📄</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{file.name}</div>
        <div className="text-xs opacity-50 mt-0.5">{(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <motion.button
        className="text-xs opacity-30 hover:opacity-60 p-1 shrink-0"
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
      >
        ✕
      </motion.button>
    </motion.div>
  )
}
