import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ToolDef } from './toolDefs'
import { TOOLS } from './toolDefs'

// ── 搜索栏 ──
export function SearchBar() {
  return (
    <div className="search-strip flex items-center gap-2 px-5 py-2.5 mx-4 mt-4">
      <svg className="w-4 h-4 shrink-0 opacity-30" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink)' }}>
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
      </svg>
      <input
        className="flex-1 bg-transparent text-sm outline-none min-w-0"
        style={{ color: 'var(--ink)' }}
        placeholder="搜索工具、记录…"
        readOnly
      />
      <span className="text-[10px] opacity-20 font-handwriting tracking-wider">⌘K</span>
    </div>
  )
}

// ── 当前生活状态卡片 ──
export function LifeCard() {
  return (
    <div
      className="desk-card relative p-6"
      style={{
        width: '100%',
        minHeight: 280,
        transform: 'rotate(-0.3deg)',
        zIndex: 15,
      }}
    >
      {/* 大回形针 */}
      <div className="paper-clip" />

      {/* 纸胶带（顶部） */}
      <div className="washi-tape" />

      {/* 标题 */}
      <div className="flex items-center gap-2 mb-5">
        <span className="font-handwriting text-3xl" style={{ color: 'var(--ink)' }}>
          当前生活状态
        </span>
        <div className="flex-1 border-b border-dashed border-[var(--border)] opacity-30 mt-3" />
      </div>

      {/* 日期 */}
      <p className="font-handwriting text-base mb-4" style={{ color: 'var(--ink-light)' }}>
        {new Date().toLocaleDateString('zh-CN', {
          year: 'numeric', month: 'long', day: 'numeric',
          weekday: 'long',
        })}
      </p>

      {/* 空白内容区域 */}
      <div className="space-y-3 opacity-40">
        <div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        <div className="h-3 w-1/2 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        <div className="h-3 w-5/6 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* 底部植物装饰 */}
      <div className="absolute bottom-3 right-4 text-xl opacity-15 pointer-events-none select-none">
        🌿
      </div>
    </div>
  )
}

// ── 浮动工具卡 ──
export function ToolCard({ tool, index }: { tool: ToolDef; index: number }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (tool.moduleId) {
      navigate(`/${tool.moduleId}`)
    }
    // 占位卡片不做跳转
  }

  return (
    <motion.div
      className="desk-card absolute cursor-pointer select-none overflow-hidden"
      style={{
        top: tool.pos.top,
        left: tool.pos.left,
        width: tool.pos.width,
        zIndex: tool.z,
        transform: `rotate(${tool.rotate}deg)`,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.4 + index * 0.06,
        duration: 0.4,
        ease: 'easeOut',
      }}
      whileHover={{ scale: 1.03, rotate: `${tool.rotate + 0.5}deg` }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
    >
      {/* 纸胶带 */}
      {tool.tape && (
        <div className={`washi-tape ${tool.tape === 'green' ? 'washi-tape-green' : tool.tape === 'blue' ? 'washi-tape-blue' : ''}`} />
      )}

      {/* 回形针 */}
      {tool.clip && <div className="paper-clip-sm" />}

      {/* 内容 */}
      <div className="flex flex-col items-center gap-2 py-4 px-3">
        <span className="text-2xl">{tool.icon}</span>
        <span className="font-handwriting text-xl tracking-wide text-center leading-tight"
          style={{ color: 'var(--ink)' }}>
          {tool.name}
        </span>
        {!tool.moduleId && (
          <span className="text-[10px] opacity-20 mt-1">⋯</span>
        )}
      </div>
    </motion.div>
  )
}

// ── 收纳区 ──
export function DrawerArea() {
  return (
    <div className="drawer-area mt-auto pt-5 pb-6 px-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-handwriting text-lg" style={{ color: 'var(--ink)' }}>
          收纳
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-[10px] opacity-20">STORAGE</span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {['📌', '✂️', '📍', '🧷', '📎', '🖍️', '✏️', '📐'].map((item, i) => (
          <motion.div
            key={i}
            className="drawer-shelf flex items-center justify-center py-2 px-1 cursor-default"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
            whileHover={{ scale: 1.1, y: -2 }}
          >
            <span className="text-lg">{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── 移动端卡片（堆叠垂直布局） ──
export function MobileToolCards() {
  return (
    <div className="px-4 py-3 space-y-3">
      <p className="font-handwriting text-lg px-1" style={{ color: 'var(--ink-light)' }}>
        常用工具
      </p>
      <div className="flex flex-col gap-3">
        {TOOLS.map((tool, i) => (
          <MobileToolRow key={tool.id} tool={tool} index={i} />
        ))}
      </div>
    </div>
  )
}

function MobileToolRow({ tool, index }: { tool: ToolDef; index: number }) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="desk-card flex items-center gap-3 px-4 py-3 cursor-pointer"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      style={{ transform: `rotate(${index % 2 === 0 ? -0.5 : 0.8}deg)` }}
      onClick={() => {
        if (tool.moduleId) navigate(`/${tool.moduleId}`)
      }}
    >
      <span className="text-xl">{tool.icon}</span>
      <span className="font-handwriting text-lg flex-1" style={{ color: 'var(--ink)' }}>
        {tool.name}
      </span>
      <span className="text-sm opacity-20">›</span>
    </motion.div>
  )
}

// ── 移动端生活卡 ──
export function MobileLifeCard() {
  return (
    <div className="px-4 pt-4">
      <div className="desk-card relative p-5" style={{ transform: 'rotate(-0.5deg)' }}>
        <div className="paper-clip" />
        <div className="flex items-center gap-2 mb-3">
          <span className="font-handwriting text-2xl" style={{ color: 'var(--ink)' }}>
            当前生活状态
          </span>
        </div>
        <p className="font-handwriting text-sm" style={{ color: 'var(--ink-light)' }}>
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
        <div className="mt-3 space-y-2 opacity-30">
          <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
          <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        </div>
      </div>
    </div>
  )
}

// ── 移动端收纳区 ──
export function MobileDrawer() {
  return (
    <div className="drawer-area px-4 py-4 mt-2 mb-16">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-handwriting text-base" style={{ color: 'var(--ink)' }}>
          收纳
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {['📌', '✂️', '📍', '🧷', '📎', '✏️', '📐', '🖍️'].map((item, i) => (
          <div
            key={i}
            className="drawer-shelf flex items-center justify-center py-1.5"
          >
            <span className="text-base">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
