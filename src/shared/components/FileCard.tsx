import { motion } from 'framer-motion'
import { type FileItem, getFileIcon, getFileColor, formatFileSize } from '../utils/fileHelper'

interface Props {
  file: FileItem
  index: number
}

export default function FileCard({ file, index }: Props) {
  return (
    <motion.div
      className={`paper-fall rounded-xl border-2 bg-gradient-to-br ${getFileColor(file)} p-4 flex items-center gap-3`}
      style={{ animationDelay: `${index * 0.1}s` }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <span className="text-2xl">{getFileIcon(file)}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{file.name}</div>
        <div className="text-xs opacity-60 mt-0.5">{formatFileSize(file.size)}</div>
      </div>
    </motion.div>
  )
}
