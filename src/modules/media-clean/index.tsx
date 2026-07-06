import type { AppModule } from '../registry'
import MediaCleanPage from './pages/MediaCleanPage'

const MediaCleanModule: AppModule = {
  id: 'media-clean',
  name: '媒体净化',
  description: '上传图片去除水印',
  icon: '✨',
  routes: [
    { path: '/media-clean', element: <MediaCleanPage /> },
  ],
}

export default MediaCleanModule
