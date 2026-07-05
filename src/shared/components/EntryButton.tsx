import { motion } from 'framer-motion'

interface Props {
  icon: string
  label: string
  description?: string
  onClick: () => void
  delay?: number
  disabled?: boolean
}

export default function EntryButton({ icon, label, description, onClick, delay = 0, disabled = false }: Props) {
  return (
    <motion.button
      className={`relative overflow-hidden rounded-xl border-2 bg-white/60 backdrop-blur-sm
        flex flex-col items-center justify-center py-6 px-4
        transition-all duration-150 w-full
        ${disabled
          ? 'border-dashed border-[var(--border)] opacity-50 cursor-default'
          : 'border-[var(--border)] active:scale-95 cursor-pointer'
        }`}
      style={{ minHeight: 100 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      onClick={disabled ? undefined : (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const ripple = document.createElement('span')
        ripple.className = 'ripple-effect'
        const size = Math.max(rect.width, rect.height)
        ripple.style.width = ripple.style.height = size + 'px'
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px'
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px'
        e.currentTarget.appendChild(ripple)
        setTimeout(() => ripple.remove(), 600)
        onClick()
      }}
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="font-medium" style={{ color: 'var(--ink)' }}>{label}</span>
      {description && (
        <span className="text-xs mt-1 opacity-60">{description}</span>
      )}
      {disabled && (
        <span className="text-[10px] mt-1.5" style={{ color: 'var(--ink-light)' }}>即将上线</span>
      )}
    </motion.button>
  )
}
