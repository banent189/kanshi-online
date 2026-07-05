import { motion } from 'framer-motion'
import { FORMATS, type OutputFormat } from '../utils/fileHelper'

interface Props {
  selected: OutputFormat
  onChange: (format: OutputFormat) => void
}

export default function FormatPicker({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {FORMATS.map((f, i) => (
        <motion.button
          key={f.key}
          className={`rounded-xl border-2 p-4 flex flex-col items-center gap-1 transition-all duration-200
            ${selected === f.key
              ? 'border-[var(--ink)] bg-[var(--ink)] text-white shadow-lg'
              : 'border-[var(--border)] bg-white/60 text-[var(--charcoal)] hover:border-[var(--ink-light)]'
            }`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(f.key)}
        >
          <span className="text-2xl">{f.icon}</span>
          <span className="font-medium text-sm">{f.label}</span>
          <span className={`text-[10px] ${selected === f.key ? 'text-white/60' : 'opacity-40'}`}>{f.ext}</span>
        </motion.button>
      ))}
    </div>
  )
}
