// ── 工具卡片定义（桌面&移动端共用） ──
export interface ToolDef {
  id: string
  name: string
  icon: string
  moduleId?: string      // 关联模块路由
  rotate: number         // 旋转角度 -2~+2
  // 桌面定位（百分比）
  pos: { top: string; left: string; width: string }
  z: number
  tape?: 'brown' | 'green' | 'blue'
  clip?: boolean         // 小回形针
}

export const TOOLS: ToolDef[] = [
  // ── 第一排：中央大卡周围浮动 ──
  { id: 'format-convert', name: '格式转换', icon: '🔄', moduleId: 'format-convert',
    pos: { top: '58%', left: '1%', width: '24%' }, rotate: -0.8, z: 10, tape: 'brown' },
  { id: 'watermark', name: '去除水印', icon: '✨', moduleId: 'media-clean',
    pos: { top: '58%', left: '27%', width: '22%' }, rotate: 1.2, z: 10, clip: true },
  { id: 'inspiration', name: '记录灵感', icon: '💡',
    pos: { top: '6%', left: '55%', width: '19%' }, rotate: -1.8, z: 20, tape: 'blue' },
  { id: 'scan', name: '扫描纸张', icon: '📄',
    pos: { top: '22%', left: '48%', width: '17%' }, rotate: 1.5, z: 20, clip: true },
  { id: 'clean-photos', name: '清理图片', icon: '🧹',
    pos: { top: '44%', left: '53%', width: '20%' }, rotate: -0.5, z: 15, tape: 'green' },
  { id: 'organize-files', name: '收纳文件', icon: '📁',
    pos: { top: '66%', left: '52%', width: '19%' }, rotate: 0.8, z: 10 },
  { id: 'diet', name: '记录饮食', icon: '🍽️',
    pos: { top: '18%', left: '76%', width: '17%' }, rotate: -1.2, z: 20 },
  { id: 'wardrobe', name: '整理衣橱', icon: '👔',
    pos: { top: '46%', left: '76%', width: '18%' }, rotate: 2, z: 15, tape: 'brown' },
]
