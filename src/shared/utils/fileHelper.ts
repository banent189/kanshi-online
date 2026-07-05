export type OutputFormat = 'pdf' | 'word' | 'excel' | 'ppt' | 'jpg' | 'png'

export interface FileItem {
  id: string
  file: File
  name: string
  size: number
  type: string
}

export const FORMATS: { key: OutputFormat; icon: string; label: string; ext: string }[] = [
  { key: 'pdf', icon: '📄', label: 'PDF', ext: '.pdf' },
  { key: 'word', icon: '📝', label: 'Word', ext: '.docx' },
  { key: 'excel', icon: '📊', label: 'Excel', ext: '.xlsx' },
  { key: 'ppt', icon: '📽️', label: 'PPT', ext: '.pptx' },
  { key: 'jpg', icon: '🖼️', label: 'JPG', ext: '.jpg' },
  { key: 'png', icon: '🖼️', label: 'PNG', ext: '.png' },
]

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function getFileIcon(file: FileItem, outputFormat?: OutputFormat): string {
  if (outputFormat) {
    return FORMATS.find(f => f.key === outputFormat)?.icon || '📄'
  }
  const type = file.type
  if (type.startsWith('image/')) return '🖼️'
  if (type.includes('word') || file.name.endsWith('.docx')) return '📝'
  if (type.includes('sheet') || type.includes('excel') || file.name.endsWith('.xlsx')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint') || file.name.endsWith('.pptx')) return '📽️'
  if (type === 'application/pdf' || file.name.endsWith('.pdf')) return '📕'
  return '📎'
}

export function getFileColor(file: FileItem): string {
  const type = file.type
  if (type.startsWith('image/')) return 'from-amber-50 to-orange-50 border-amber-200'
  if (type.includes('word')) return 'from-blue-50 to-indigo-50 border-blue-200'
  if (type.includes('sheet') || type.includes('excel')) return 'from-green-50 to-emerald-50 border-green-200'
  if (type.includes('presentation') || type.includes('powerpoint')) return 'from-red-50 to-rose-50 border-red-200'
  return 'from-gray-50 to-slate-50 border-gray-200'
}

export function getFileBaseName(name: string): string {
  return name.replace(/\.[^/.]+$/, '')
}

export function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || ''
}
