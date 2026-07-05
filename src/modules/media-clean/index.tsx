import type { AppModule } from '../registry'
import MediaCleanPage from './pages/MediaCleanPage'

const MediaCleanModule: AppModule = {
  id: 'media-clean',
  name: '去除水印',
  description: '图片水印去除工具',
  icon: '✨',
  routes: [
    { path: '/media-clean', element: <MediaCleanPage /> },
  ],
}

export default MediaCleanModule
