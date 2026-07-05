import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import { registerModule, getAllModuleRoutes } from './modules/registry'
import FormatConvertModule from './modules/format-convert'
import MediaCleanModule from './modules/media-clean'

// 注册所有模块
registerModule(FormatConvertModule)
registerModule(MediaCleanModule)

// 收集所有模块路由
const moduleRoutes = getAllModuleRoutes()

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          {moduleRoutes.map(r => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}

export default App
