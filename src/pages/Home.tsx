import { motion } from 'framer-motion'
import LeftNav from '../components/desk/LeftNav'
import BottomNav from '../components/desk/BottomNav'
import {
  SearchBar,
  LifeCard,
  ToolCard,
  DrawerArea,
  MobileLifeCard,
  MobileToolCards,
  MobileDrawer,
} from '../components/desk/DeskSurface'
import { TOOLS } from '../components/desk/toolDefs'

export default function Home() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--washi)' }}>
      {/* ── 桌面左侧导航 ── */}
      <div className="desktop-only">
        <LeftNav />
      </div>

      {/* ── 主体内容 ── */}
      {/* 桌面：ml-48 给左侧导航留位 */}
      <main className="flex-1 flex flex-col min-h-screen desktop-only ml-48 relative">
        {/* 顶部搜索条 */}
        <SearchBar />

        {/* 桌面卡片区 - 使用相对定位实现"桌面摆放"效果 */}
        <div className="relative flex-1 mx-4" style={{ minHeight: 700 }}>
          {/* 中央生活卡 */}
          <div className="absolute" style={{ top: '8%', left: '2%', width: '45%', zIndex: 15 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
            >
              <LifeCard />
            </motion.div>
          </div>

          {/* 浮动工具卡 */}
          {TOOLS.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} />
          ))}

          {/* 植物装饰 */}
          <div
            className="absolute pointer-events-none select-none opacity-10"
            style={{ bottom: '30%', right: '2%', transform: 'rotate(-10deg)' }}
          >
            <span style={{ fontSize: 64 }}>🌿</span>
          </div>
        </div>

        {/* 底部收纳区 */}
        <DrawerArea />
      </main>

      {/* ── 移动端布局 ── */}
      <div className="mobile-only flex flex-col w-full min-h-screen">
        {/* 移动端顶部问候 */}
        <div className="px-4 pt-5 pb-1">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="font-handwriting text-2xl" style={{ color: 'var(--ink)' }}>
              简紙
            </span>
            <span className="text-xs opacity-30">Kanshi</span>
          </motion.div>
        </div>

        {/* 移动端搜索条 */}
        <div className="px-4 pb-2">
          <SearchBar />
        </div>

        {/* 移动端生活卡 */}
        <MobileLifeCard />

        {/* 移动端工具列表 */}
        <MobileToolCards />

        {/* 移动端收纳区 */}
        <MobileDrawer />

        {/* 移动端底部导航 */}
        <BottomNav />
      </div>
    </div>
  )
}
