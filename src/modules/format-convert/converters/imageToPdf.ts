import { PDFDocument } from 'pdf-lib'

export interface ConvertProgress {
  current: number
  total: number
  message: string
}

export type ProgressCallback = (progress: ConvertProgress) => void

export async function imagesToPdf(
  files: File[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    onProgress?.({
      current: i + 1,
      total,
      message: `正在处理图片 ${i + 1}/${total}...`,
    })

    if (!file.type.startsWith('image/')) continue

    // 不做任何 EXIF 矫正，直接使用原始文件数据
    // 图片在 PDF 中保持原始像素数据，由 PDF 阅读器处理显示方向
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    let image
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(uint8Array)
    } else if (file.type === 'image/webp') {
      // pdf-lib doesn't support webp directly, convert via canvas
      const jpeg = await webpToJpeg(file)
      image = await pdfDoc.embedJpg(new Uint8Array(jpeg))
    } else {
      // jpg/jpeg and others
      try {
        image = await pdfDoc.embedJpg(uint8Array)
      } catch {
        // fallback: try as png
        image = await pdfDoc.embedPng(uint8Array)
      }
    }

    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }

  onProgress?.({
    current: total,
    total,
    message: '正在生成PDF...',
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.slice()], { type: 'application/pdf' })
}

async function webpToJpeg(file: File): Promise<ArrayBuffer> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const img = await createImageBitmap(file)
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)
  img.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          blob.arrayBuffer().then(resolve)
        } else {
          reject(new Error('webp 转换失败'))
        }
      },
      'image/jpeg',
      0.95
    )
  })
}
