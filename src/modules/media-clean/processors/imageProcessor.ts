export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** 检查是否支持的图片类型 */
export function isSupportedImageType(mime: string): boolean {
  return ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mime)
}

/**
 * 边界加权插值法去除水印
 *
 * 对矩形选区内的每个像素，根据其到四边（选区边界）的距离，
 * 加权平均边界外的像素值，实现类似"内容感知填充"的效果。
 */
export async function removeWatermark(
  source: ImageBitmap,
  rect: Rect
): Promise<Blob> {
  // 边界保护
  const r = {
    x: Math.max(0, Math.round(rect.x)),
    y: Math.max(0, Math.round(rect.y)),
    w: Math.min(source.width - Math.max(0, Math.round(rect.x)), Math.round(rect.w)),
    h: Math.min(source.height - Math.max(0, Math.round(rect.y)), Math.round(rect.h)),
  }
  if (r.w <= 0 || r.h <= 0) throw new Error('选区无效')

  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const { width, height } = imageData
  const { x, y, w, h } = r

  // 预计算边界像素（选区外一圈的像素值）
  // 四边：上(y-1行, x..x+w-1) 下(y+h行, x..x+w-1) 左(x-1列, y..y+h-1) 右(x+w列, y..y+h-1)
  const topEdge: Uint8Array[] = []
  const bottomEdge: Uint8Array[] = []
  const leftEdge: Uint8Array[] = []
  const rightEdge: Uint8Array[] = []

  const clampX = (v: number) => Math.max(0, Math.min(width - 1, v))
  const clampY = (v: number) => Math.max(0, Math.min(height - 1, v))

  for (let px = x; px < x + w; px++) {
    const ty = clampY(y - 1)
    const by = clampY(y + h)
    const topIdx = (ty * width + px) * 4
    const botIdx = (by * width + px) * 4
    topEdge.push(new Uint8Array([data[topIdx], data[topIdx + 1], data[topIdx + 2]]))
    bottomEdge.push(new Uint8Array([data[botIdx], data[botIdx + 1], data[botIdx + 2]]))
  }
  for (let py = y; py < y + h; py++) {
    const lx = clampX(x - 1)
    const rx = clampX(x + w)
    const leftIdx = (py * width + lx) * 4
    const rightIdx = (py * width + rx) * 4
    leftEdge.push(new Uint8Array([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]))
    rightEdge.push(new Uint8Array([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]))
  }

  // 对选区内的每个像素
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      // 计算到四边的距离
      const dTop = py - y + 1
      const dBot = (y + h) - py + 1
      const dLeft = px - x + 1
      const dRight = (x + w) - px + 1

      // 获取四条边上的参考像素
      const topIdx = px - x
      const botIdx = px - x
      const leftIdx = py - y
      const rightIdx = py - y

      const t = topEdge[topIdx]
      const b = bottomEdge[botIdx]
      const l = leftEdge[leftIdx]
      const r2 = rightEdge[rightIdx]

      // 加权平均：距离越近权重越大
      const wTop = 1 / (dTop * dTop)
      const wBot = 1 / (dBot * dBot)
      const wLeft = 1 / (dLeft * dLeft)
      const wRight = 1 / (dRight * dRight)
      const totalW = wTop + wBot + wLeft + wRight

      const rVal = (t[0] * wTop + b[0] * wBot + l[0] * wLeft + r2[0] * wRight) / totalW
      const gVal = (t[1] * wTop + b[1] * wBot + l[1] * wLeft + r2[1] * wRight) / totalW
      const bVal = (t[2] * wTop + b[2] * wBot + l[2] * wLeft + r2[2] * wRight) / totalW

      const idx = (py * width + px) * 4
      data[idx] = rVal
      data[idx + 1] = gVal
      data[idx + 2] = bVal
      // data[idx+3] = alpha 保持不变
    }
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('生成图片失败'))
    }, 'image/png')
  })
}
