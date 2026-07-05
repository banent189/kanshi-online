# 如何新增一个功能模块

## 三步加一个模块

### 1. 创建文件夹

```
src/modules/my-tool/
  index.tsx      # 模块定义（必须有）
  pages/         # 模块的页面组件
  converters/    # 模块的转换逻辑（可选）
  components/    # 模块专属组件（可选）
```

### 2. 写模块定义

```tsx
// src/modules/my-tool/index.tsx
import type { AppModule } from '../registry'
import MyPage from './pages/MyPage'

const MyToolModule: AppModule = {
  id: 'my-tool',          // 唯一标识，也用作路由前缀
  name: '我的工具',         // 首页卡片标题，2-6 字
  description: '一句话描述', // 首页卡片副标题，10-20 字
  icon: '🔧',              // 首页显示的 emoji
  routes: [
    { path: '/my-tool', element: <MyPage /> },
  ],
}

export default MyToolModule
```

### 3. 在 App.tsx 注册

```tsx
// src/App.tsx 中加一行：
import MyToolModule from './modules/my-tool'
registerModule(MyToolModule)
```

完成！首页会自动出现新模块的入口卡片 🎉

---

## 文件结构规范

```
src/
├── App.tsx                  # 主应用（在这里注册模块）
├── main.tsx                 # 入口
├── index.css                # 全局样式
├── shared/                  # 所有模块共享的代码
│   ├── components/          # 通用组件
│   │   ├── Logo.tsx
│   │   ├── FormatPicker.tsx
│   │   └── EntryButton.tsx
│   └── utils/               # 通用工具函数
│       ├── fileHelper.ts
│       └── share.ts
├── pages/
│   └── Home.tsx             # 首页（模块启动器）
└── modules/                 # 所有功能模块
    ├── registry.ts          # 模块注册系统
    ├── TEMPLATE.md          # 本文件
    └── format-convert/      # 格式转换模块（第一个模块）
        ├── index.tsx        # 模块定义
        ├── pages/
        ├── converters/
        └── components/
```

## 模块内引用共享代码

模块内的页面或组件，用相对路径引用 `shared/`：

```tsx
// src/modules/my-tool/pages/MyPage.tsx
import Logo from '../../../shared/components/Logo'
import { shareFile } from '../../../shared/utils/share'
```

## 注意事项

- 路由路径不要和其他模块冲突
- 每个模块入口页面建议加一个 ← 返回首页按钮：`onClick={() => navigate('/')}`
- `AppModule` 的 `routes` 中的路径是完整路径（以 `/` 开头）
