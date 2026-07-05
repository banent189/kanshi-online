import { PDFDocument } from 'pdf-lib'
import { imagesToPdf, type ConvertProgress, type ProgressCallback } from './imageToPdf'

export type { ConvertProgress, ProgressCallback }

export interface ConvertResult {
  blob: Blob
  fileName: string
  ext: string
}

// ===== 真正支持的转换一览 =====
export interface SupportedConv {
  from: string
  to: string[]
}
export const SUPPORTED_CONVERSIONS: SupportedConv[] = [
  { from: '图片 (PNG/JPG/WebP/GIF/BMP)', to: ['PDF', 'JPG', 'PNG'] },
  { from: 'PDF', to: ['PDF (合并)'] },
]

/** 判断传入文件是否支持转换 */
export function canConvert(files: File[], outputFormat: string): boolean {
  if (files.length === 0) return false
  const hasImage = files.some(f => f.type.startsWith('image/'))
  const hasPdf = files.some(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))

  if (outputFormat === 'pdf' && (hasImage || hasPdf)) return true
  if ((outputFormat === 'word' || outputFormat === 'excel' || outputFormat === 'ppt') && hasImage) return true
  if ((outputFormat === 'jpg' || outputFormat === 'png') && hasImage) return true
  return false
}

/** 获取错误原因 */
export function getUnsupportedReason(files: File[], outputFormat: string): string {
  const hasImage = files.some(f => f.type.startsWith('image/'))
  const hasPdf = files.some(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
  const other = files.some(f => !f.type.startsWith('image/') && !f.type.includes('pdf') && !f.name.endsWith('.pdf'))

  if (other) return '目前仅支持图片和 PDF 格式的输入文件'
  if (hasPdf && outputFormat !== 'pdf') return 'PDF 目前仅支持合并为 PDF'
  if (hasImage && (outputFormat === 'word' || outputFormat === 'excel' || outputFormat === 'ppt')) return ''
  return '不支持此转换组合'
}

// ===== 主入口 =====
export async function convert(
  files: File[],
  outputFormat: string,
  onProgress?: ProgressCallback
): Promise<ConvertResult> {
  if (!canConvert(files, outputFormat)) {
    throw new Error(getUnsupportedReason(files, outputFormat) || '不支持的转换组合')
  }

  const baseName = files.length === 1
    ? files[0].name.replace(/\.[^/.]+$/, '')
    : '合并文档'

  switch (outputFormat) {
    case 'pdf':
      return convertToPdf(files, baseName, onProgress)
    case 'word':
      return convertToDocx(files, baseName, onProgress)
    case 'excel':
      return convertToXlsx(files, baseName, onProgress)
    case 'ppt':
      return convertToPptx(files, baseName, onProgress)
    case 'jpg':
      return convertToImage(files, baseName, 'jpeg', onProgress)
    case 'png':
      return convertToImage(files, baseName, 'png', onProgress)
    default:
      throw new Error('不支持的文件格式')
  }
}

// ===== 转 PDF =====
async function convertToPdf(
  files: File[],
  baseName: string,
  onProgress?: ProgressCallback
): Promise<ConvertResult> {
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))

  // 图片 → PDF
  if (imageFiles.length > 0) {
    const blob = await imagesToPdf(imageFiles, onProgress)
    return { blob, fileName: `${baseName}.pdf`, ext: '.pdf' }
  }

  // PDF 合并
  if (pdfFiles.length > 0) {
    onProgress?.({ current: 0, total: pdfFiles.length, message: '正在合并PDF...' })
    const merged = await PDFDocument.create()
    for (let i = 0; i < pdfFiles.length; i++) {
      onProgress?.({ current: i + 1, total: pdfFiles.length, message: `合并 ${i + 1}/${pdfFiles.length}...` })
      const buf = await pdfFiles[i].arrayBuffer()
      const pdf = await PDFDocument.load(buf)
      const pages = await merged.copyPages(pdf, pdf.getPageIndices())
      pages.forEach(p => merged.addPage(p))
    }
    const bytes = await merged.save()
    return { blob: new Blob([bytes], { type: 'application/pdf' }), fileName: `${baseName}.pdf`, ext: '.pdf' }
  }

  throw new Error('没有可转换的文件')
}

// ===== 转 Word (DOCX) — 仅支持图片 =====
async function convertToDocx(
  files: File[],
  baseName: string,
  onProgress?: ProgressCallback
): Promise<ConvertResult> {
  onProgress?.({ current: 1, total: 1, message: '正在生成 Word 文档...' })

  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (imageFiles.length === 0) throw new Error('Word 转换仅支持图片文件')

  const { Document, Packer, Paragraph, ImageRun } = await import('docx')
  const paragraphs: Paragraph[] = []

  for (const f of imageFiles) {
    const buf = await f.arrayBuffer()
    const img = await createImageBitmap(f)
    const maxW = 500
    const scale = img.width > maxW ? maxW / img.width : 1
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    img.close()

    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: buf,
            transformation: { width: w, height: h },
            type: f.type.includes('png') ? 'png' as const : 'jpg' as const,
          }),
        ],
        spacing: { after: 200 },
      })
    )
  }

  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  return { blob, fileName: `${baseName}.docx`, ext: '.docx' }
}

// ===== 转 Excel (XLSX) — 仅支持图片 =====
async function convertToXlsx(
  files: File[],
  baseName: string,
  onProgress?: ProgressCallback
): Promise<ConvertResult> {
  onProgress?.({ current: 1, total: 1, message: '正在生成 Excel 文件...' })

  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (imageFiles.length === 0) throw new Error('Excel 转换仅支持图片文件')

  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('文件')

  ws.columns = [{ width: 40 }, { width: 20 }]
  ws.getCell('A1').value = '文件名'
  ws.getCell('B1').value = '大小'
  ws.getRow(1).font = { bold: true }

  for (let i = 0; i < imageFiles.length; i++) {
    const f = imageFiles[i]
    const row = i + 2
    ws.getCell(`A${row}`).value = f.name
    ws.getCell(`B${row}`).value = `${(f.size / 1024).toFixed(1)} KB`

    const buf = await f.arrayBuffer()
    const imgId = wb.addImage({
      buffer: buf as any,
      extension: f.type.includes('png') ? 'png' : 'jpeg',
    })
    ws.addImage(imgId, {
      tl: { col: 0, row: row - 1 },
      ext: { width: 200, height: 150 },
    })
    ws.getRow(row).height = 100
  }

  const buf = await wb.xlsx.writeBuffer()
  return { blob: new Blob([buf]), fileName: `${baseName}.xlsx`, ext: '.xlsx' }
}

// ===== 转 PPT — 仅支持图片 =====
async function convertToPptx(
  files: File[],
  baseName: string,
  onProgress?: ProgressCallback
): Promise<ConvertResult> {
  onProgress?.({ current: 1, total: 1, message: '正在生成 PPT...' })

  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (imageFiles.length === 0) throw new Error('PPT 转换仅支持图片文件')

  const pptxgen = await import('pptxgenjs')
  const pres = new pptxgen.default()

  for (const f of imageFiles) {
    const buf = await f.arrayBuffer()
    const b64 = arrayBufferToBase64(buf)
    const slide = pres.addSlide()
    slide.addImage({
      data: `data:${f.type};base64,${b64}`,
      x: 0.5, y: 0.5, w: 9, h: 6.5,
    })
  }

  const blob = await pres.write({ outputType: 'blob' })
  return { blob: blob as Blob, fileName: `${baseName}.pptx`, ext: '.pptx' }
}

// ===== 转图片 — 仅支持图片互转 =====
async function convertToImage(
  files: File[],
  baseName: string,
  format: 'jpeg' | 'png',
  onProgress?: ProgressCallback
): Promise<ConvertResult> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'

  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (imageFiles.length === 0) throw new Error('图片转换仅支持图片文件')

  onProgress?.({ current: 1, total: 1, message: `正在转换为 ${format.toUpperCase()}...` })
  const f = imageFiles[0]
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const img = await createImageBitmap(f)
  canvas.width = img.width; canvas.height = img.height
  ctx.drawImage(img, 0, 0)
  img.close()

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, 0.95))
  if (!blob) throw new Error('转换失败')
  return { blob, fileName: `${baseName}.${format}`, ext: `.${format}` }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
