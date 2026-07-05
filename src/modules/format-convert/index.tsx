import type { AppModule } from '../registry'
import ConvertPage from './pages/ConvertPage'
import ConvertingPage from './pages/ConvertingPage'

const FormatConvertModule: AppModule = {
  id: 'convert',
  name: '格式转换',
  description: '图片转PDF / 图片转JPG-PNG / PDF合并',
  icon: '🖼️',
  routes: [
    { path: '/convert', element: <ConvertPage /> },
    { path: '/converting', element: <ConvertingPage /> },
  ],
}

export default FormatConvertModule
