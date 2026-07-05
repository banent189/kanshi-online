# 簡紙 构建日志

## 2026-06-27

### 清理不支持的转换 + 页面优化

**问题：** 用户发现只能选图片转换，选其他格式（PDF、Word等）就报错。之前的转换器里有很多伪支持。

**改动：**

1. **`src/converters/index.ts`** — 大重构
   - 删掉伪装的 `simpleDocToPdf()`（之前只是把文件名写进PDF，不是真转换）
   - 删掉 PDF → 图片 的代码（pdfjs worker 在手机上加载有问题，暂且搁置）
   - 图片 → PDF ✅（正常）
   - 图片 → Word/Excel/PPT ✅（正常）
   - 图片 → JPG/PNG ✅（正常）
   - PDF合并 → PDF ✅（正常）
   - 新增 `canConvert()` 和 `getUnsupportedReason()` 校验函数
   - 导出 `SUPPORTED_CONVERSIONS` 供页面展示支持矩阵
   - 新增 `getActionHint()` 在转换页面显示具体操作说明

2. **`src/pages/Home.tsx`** — 首页
   - 文件选择器 `accept` 改回 `'*/*'`（之前设 `'image/*,.pdf'` 导致安卓弹出相机/相册）
   - 加了支持的转换说明卡片
   - 文件选择按钮下方显示当前选中格式支持什么输入

3. **`src/pages/ConvertPage.tsx`** — 转换页
   - 点击转换前调用 `canConvert()` 校验
   - 不支持时弹出提示原因
   - 转换按钮上方添加操作提示（如"将 3 张图片合并为一个 PDF"）

### 构建结果
- ✅ `vite build` 成功，443ms
- 14 个 precache 文件
- 无 TypeScript/编译错误

---
### 抽取模块系统 + 架构重构

**问题：** 用户想在该网页上叠加更多功能，需要模块化架构。

**改动：**

1. **`src/modules/`** — 全新模块系统
   - `registry.ts`：模块注册器（`AppModule` 类型 + `registerModule()` / `getModules()`）
   - `image-convert/index.tsx`：图片转换工具封装为第一个模块
   - `TEMPLATE.md`：模块开发模板，三步添加新功能

2. **`src/App.tsx`** — 重构路由
   - 从模块注册表中自动收集路由
   - 新增模块只需 `registerModule(YourModule)` 一行

3. **`src/pages/Home.tsx`** — 重构首页
   - 动态展示所有已注册模块的卡片
   - 点击卡片进入对应模块
   - 不再硬编码文件选择/转换入口

4. **`src/pages/ConvertPage.tsx`** — 自包含文件选择
   - 空态时自带文件选择器 + 格式选择 + 支持说明
   - 选文件后显示"继续添加文件"按钮可追加
   - 每个文件可单独删除（✕）

### 构建结果
- ✅ `vite build` 成功，477ms
- 14 个 precache 文件，无编译错误

## 项目重构 + 文件夹规范化

**改动：** 用户要求项目根文件夹改名"简纸Kanshi"，每个模块独立子文件夹，代码结构规范化。

### 目录结构变更

```
D:/
└── 桌面/
    └── 简纸Kanshi/                          # ← 根文件夹改名
        ├── src/
        │   ├── shared/                      # ← 共享代码集中管理
        │   │   ├── components/              #     Logo, FormatPicker...
        │   │   └── utils/                   #     fileHelper, share...
        │   ├── pages/
        │   │   └── Home.tsx                 #     首页（模块启动器）
        │   ├── modules/
        │   │   ├── registry.ts              #     模块注册系统
        │   │   ├── TEMPLATE.md              #     模块开发模板
        │   │   └── format-convert/          # ← image-convert 改名为 format-convert
        │   │       ├── index.tsx            #     模块定义
        │   │       ├── pages/               #     模块页面（自包含）
        │   │       │   ├── ConvertPage.tsx
        │   │       │   ├── ConvertingPage.tsx
        │   │       │   └── CompletePage.tsx
        │   │       └── converters/          #     模块转换逻辑
        │   │           ├── index.ts
        │   │           └── imageToPdf.ts
        │   ├── App.tsx
        │   ├── main.tsx
        │   └── index.css
        ├── CHANGELOG.md
        └── package.json
```

### 具体改动
1. **`d:\桌面\图片转PDF` → `d:\桌面\简纸Kanshi`** — 根文件夹正式改名
2. **`src/modules/image-convert/` → `src/modules/format-convert/`** — 模块名与首页显示一致
3. **`src/components/` → `src/shared/components/`** — 共享组件集中管理
4. **`src/utils/` → `src/shared/utils/`** — 共享工具函数集中管理
5. **`src/converters/` → `src/modules/format-convert/converters/`** — 转换逻辑归属模块
6. **`src/pages/ConvertPage.tsx` → `src/modules/format-convert/pages/`** — 页面归属模块
7. **`src/pages/ConvertingPage.tsx` → `src/modules/format-convert/pages/`**
8. **`src/pages/CompletePage.tsx` → `src/modules/format-convert/pages/`**
9. 所有旧目录已删除，无残留文件
10. 所有 module 内 import 路径已修正

### 构建结果
- ✅ `vite build` 成功，501ms
- 14 个 precache 文件，无编译错误
- 页面路径不变（/ /convert /converting /complete）

### Bug 修复
- `App.tsx` 中 `RouteObject[]` 不能直接作为 JSX 子节点渲染，改为 `.map()` 生成 `<Route>` 组件
- `registry.ts` 重构 `ModuleRoute` 改用 `ReactNode` 替代 `RouteObject` 避免类型不兼容
- 根文件夹已完成重命名，清理了 `assets/` `dist/` 等构建残留文件

## 下次启动开发服务器
```bash
cd "D:\桌面\简纸Kanshi"
npx vite --host 0.0.0.0
```
