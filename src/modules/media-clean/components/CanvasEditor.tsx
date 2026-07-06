import { useRef, useEffect, useCallback, useState } from 'react'
import type { Rect } from '../processors/imageProcessor'

interface Props {
  imageBitmap: ImageBitmap
  selection: Rect | null
  onSelection: (rect: Rect | null) => void
}

export default function CanvasEditor({ imageBitmap, selection, onSelection }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [currentEnd, setCurrentEnd] = useState({ x: 0, y: 0 })

  // 缩放比例（物理像素 → 显示像素）
  const scaleRef = useRef(1)

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { width, height } = imageBitmap

    // 适配容器宽度
    const container = containerRef.current
    const maxW = container ? container.clientWidth : width
    const maxH = 60 // vh approx — use window
    const winH = window.innerHeight * 0.6
    const scale = Math.min(maxW / width, winH / height, 1)
    scaleRef.current = scale

    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width * scale}px`
    canvas.style.height = `${height * scale}px`

    ctx.drawImage(imageBitmap, 0, 0)
  }, [imageBitmap])

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const s = selection

    // 清除上一帧覆盖
    ctx.drawImage(imageBitmap, 0, 0)

    if (!s) return

    // 半透明覆盖
    ctx.fillStyle = 'rgba(43, 76, 126, 0.2)'
    ctx.fillRect(s.x, s.y, s.w, s.h)

    // 边框
    ctx.strokeStyle = 'rgba(43, 76, 126, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(s.x, s.y, s.w, s.h)
  }, [imageBitmap, selection])

  useEffect(() => { drawImage() }, [drawImage])

  useEffect(() => { drawOverlay() }, [drawOverlay])

  // 实时绘制拖拽中的选区
  const drawTempRect = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // 重绘图片
    ctx.drawImage(imageBitmap, 0, 0)

    const rx = Math.min(x1, x2)
    const ry = Math.min(y1, y2)
    const rw = Math.abs(x2 - x1)
    const rh = Math.abs(y2 - y1)

    ctx.fillStyle = 'rgba(43, 76, 126, 0.2)'
    ctx.fillRect(rx, ry, rw, rh)
    ctx.strokeStyle = 'rgba(43, 76, 126, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(rx, ry, rw, rh)
  }, [imageBitmap])

  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scale = scaleRef.current
    return {
      x: Math.round((clientX - rect.left) / scale),
      y: Math.round((clientY - rect.top) / scale),
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY)
    setDrawing(true)
    setStart(pos)
    setCurrentEnd(pos)
    onSelection(null)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing) return
    const pos = getCanvasPos(e.clientX, e.clientY)
    setCurrentEnd(pos)
    drawTempRect(start.x, start.y, pos.x, pos.y)
  }

  const handlePointerUp = () => {
    if (!drawing) return
    setDrawing(false)
    const rx = Math.min(start.x, currentEnd.x)
    const ry = Math.min(start.y, currentEnd.y)
    const rw = Math.abs(currentEnd.x - start.x)
    const rh = Math.abs(currentEnd.y - start.y)
    if (rw > 5 && rh > 5) {
      onSelection({ x: rx, y: ry, w: rw, h: rh })
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full flex justify-center"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="rounded-xl border-2 border-[var(--border)] bg-white/60 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  )
}
