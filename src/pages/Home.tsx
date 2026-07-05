import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../shared/components/Logo'
import { getModules } from '../modules/registry'

export default function Home() {
  const navigate = useNavigate()
  const modules = getModules()

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ backgroundColor: 'var(--washi)' }}>
      <div className="pt-12 pb-6">
        <Logo size="md" />
      </div>

      <motion.p
        className="text-center text-sm mb-6"
        style={{ color: 'var(--ink-light)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        选择工具
      </motion.p>

      {/* 模块卡片网格 */}
      <div className="max-w-xs mx-auto w-full space-y-3">
        {modules.map((m, i) => (
          <motion.button
            key={m.id}
            className="w-full rounded-2xl border-2 border-[var(--border)] bg-white/60 p-5
              flex items-center gap-4 active:scale-[0.97] transition-all duration-150 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(m.routes[0].path || '/')}
          >
            <span className="text-3xl">{m.icon}</span>
            <div className="min-w-0">
              <div className="font-medium" style={{ color: 'var(--ink)' }}>{m.name}</div>
              <div className="text-xs mt-0.5 opacity-50">{m.description}</div>
            </div>
            <span className="ml-auto text-lg opacity-30">›</span>
          </motion.button>
        ))}
      </div>

      <motion.div
        className="mt-auto text-center py-6 text-xs opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        文件仅在本地处理，不会上传
      </motion.div>
    </div>
  )
}
