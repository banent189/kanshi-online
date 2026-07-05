import { motion } from 'framer-motion'

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }
  const subSizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

  return (
    <motion.div
      className="text-center select-none"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className={`${sizeMap[size]} font-light tracking-widest`} style={{ color: 'var(--ink)' }}>
        <span className="inline-block mr-1">📄</span>
        簡紙
      </div>
      <div className={`${subSizeMap[size]} tracking-[0.3em] mt-1`} style={{ color: 'var(--ink-light)' }}>
        KANSHI
      </div>
    </motion.div>
  )
}
