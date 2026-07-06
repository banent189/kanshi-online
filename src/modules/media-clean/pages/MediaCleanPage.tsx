import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../../../shared/components/Logo'
import ImageTab from '../components/ImageTab'

export default function MediaCleanPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ backgroundColor: 'var(--washi)' }}>
      {/* Header */}
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

      {/* 页面标题 */}
      <motion.p
        className="text-sm font-medium mb-4"
        style={{ color: 'var(--ink-light)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        🖼️ 图片水印去除
      </motion.p>

      {/* 内容 */}
      <div className="flex-1 flex flex-col">
        <ImageTab />
      </div>

      {/* 隐私提示 */}
      <motion.p
        className="text-center text-xs opacity-30 py-4 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        文件仅在本地处理，不会上传 ✓
      </motion.p>
    </div>
  )
}
