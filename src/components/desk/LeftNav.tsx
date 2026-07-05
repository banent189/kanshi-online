import { useState } from 'react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { id: 'today', label: '今天', icon: '📅' },
  { id: 'frequent', label: '常用', icon: '⭐' },
  { id: 'records', label: '记录', icon: '📝' },
  { id: 'tools', label: '工具箱', icon: '🔧' },
  { id: 'storage', label: '收纳盒', icon: '📦' },
]

export default function LeftNav() {
  const [active, setActive] = useState('today')

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-48 z-50 flex flex-col items-center
      bg-white/30 backdrop-blur-sm border-r-2 border-[var(--border)] select-none">
      {/* ── 顶部纸签 ── */}
      <div className="w-full pt-8 pb-6 flex flex-col items-center">
        <span className="font-handwriting text-2xl tracking-[0.15em]" style={{ color: 'var(--ink)' }}>
          简紙
        </span>
        <div className="mt-2 w-10 h-0.5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* ── 导航标签（纸质标签样式） ── */}
      <div className="flex flex-col gap-2 w-full px-3 flex-1">
        {NAV_ITEMS.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
            onClick={() => setActive(item.id)}
            className={`
              relative w-full py-2.5 px-4 rounded-r-lg flex items-center gap-3
              transition-all duration-200 text-left overflow-visible
              ${active === item.id
                ? 'bg-white/70 shadow-md'
                : 'hover:bg-white/30'
              }
            `}
            style={{ color: 'var(--ink)' }}
          >
            {/* 纸签三角标签装饰（激活时） */}
            {active === item.id && (
              <motion.div
                layoutId="nav-tab"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                style={{ backgroundColor: 'var(--rust)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className="text-base shrink-0">{item.icon}</span>
            <span className="font-handwriting text-lg tracking-wide">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ── 底部装饰 ── */}
      <div className="w-full pb-6 flex flex-col items-center gap-2">
        <div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-[10px] tracking-widest opacity-20" style={{ color: 'var(--ink)' }}>
          KANSHI
        </span>
      </div>
    </nav>
  )
}
