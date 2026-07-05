import { useState } from 'react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { id: 'today', label: '今天', icon: '📅' },
  { id: 'frequent', label: '常用', icon: '⭐' },
  { id: 'records', label: '记录', icon: '📝' },
  { id: 'tools', label: '工具箱', icon: '🔧' },
  { id: 'storage', label: '收纳盒', icon: '📦' },
]

export default function BottomNav() {
  const [active, setActive] = useState('today')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mobile-only
      bg-white/60 backdrop-blur-md border-t-2 border-[var(--border)]
      safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`
              relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg
              transition-all duration-200 min-w-0
              ${active === item.id ? 'opacity-100' : 'opacity-40 hover:opacity-60'}
            `}
            style={{ color: 'var(--ink)' }}
          >
            {active === item.id && (
              <motion.div
                layoutId="bottom-nav-dot"
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--rust)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className="text-lg">{item.icon}</span>
            <span className="font-handwriting text-xs tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
