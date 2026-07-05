# 构建日志

> 记录每次迭代版本，方便回溯。不满意可要求退回指定版本。

---

## v1 — 2026-07-01 | 初始版本

- 格式转换模块：图片→PDF / 图片互转 / PDF 合并 / Office 导出
- 媒体净化模块：图片水印去除
- PWA 配置：manifest + service worker + share_target
- Cloudflare Pages 部署
- HTPS (Cloudflare)

## v2 — 2026-07-02 | 分享交互重构

**修改文件：**

| 文件 | 改动 |
|------|------|
| `src/shared/utils/share.ts` | 去掉 `alert()`，改返回 `ShareResult` 状态码；失败时自动复制文件名到剪贴板 |
| `src/modules/format-convert/pages/ConvertingPage.tsx` | 全页重写 |
| `src/modules/format-convert/index.tsx` | 移除 `/complete` 路由 |
| `src/modules/format-convert/pages/CompletePage.tsx` | 删除（冗余页面） |
| `BUILD_LOG.md` | 新增 |

**改动内容：**

- **转换动画优化：** 去掉纸鹤持续扑翅，改用平滑进度环 + 消息渐入渐出；完成时纸鹤弹簧飞入一次，不反复动
- **文件名自定义：** 完成页文件名可点击编辑，自定义后再分享/保存
- **分享流程精简：** 点击分享 → 系统分享菜单 → 直接切到微信，无中间弹层
- **移除分享成功 Toast：** 分享成功即结束，不弹任何覆盖层（系统分享菜单本身就是那个界面）
- **分享失败兜底：** 底部小提示条（不盖住页面）+ 自动复制文件名到剪贴板 + 重试按钮
- **移除 `/complete` 路由 + CompletePage：** ConvertingPage 已覆盖所有功能，不再需要独立详情页
- **移除所有 `alert()` 弹窗：** 统一页面内交互

## v3 — 2026-07-02 | 文件名自定义 + 自动分享

**修改文件：**

| 文件 | 改动 |
|------|------|
| `src/modules/format-convert/pages/ConvertPage.tsx` | 新增文件名输入框；完善 launchQueue 接收微信分享 |
| `src/modules/format-convert/pages/ConvertingPage.tsx` | 转换完自动弹出分享；取消成功 Toast 覆盖层 |
| `vite.config.ts` | 加 `allowedHosts: true` |

**改动内容：**

- **选文件时可自定义文件名：** ConvertPage 新增输出文件名输入框
- **转换完自动分享：** 进度环 → 🕊️ 飞入 → 自动弹出系统分享菜单，直达微信
- **分享成功不再弹 Toast：** 系统分享菜单本身就是那个界面
- **分享失败兜底：** 底部小条 + 剪贴板复制 + 重试
- **PWA share_target：** 完善 launchQueue 接收微信分享的图片

## v4 — 2026-07-02 | 文件列表优化 + 图片方向还原

**修改文件：**

| 文件 | 改动 |
|------|------|
| `src/modules/format-convert/pages/ConvertPage.tsx` | "继续添加文件"改为追加；图片文件显示缩略图 |
| `src/modules/format-convert/converters/imageToPdf.ts` | 回退：取消 EXIF 矫正，保持原始像素数据 |
| `src/modules/format-convert/converters/index.ts` | 回退：删除 `correctOrientation()`，Office 输出原始图片 |
| `src/shared/utils/share.ts` | 保存不再强制 `octet-stream`，用原始 MIME 类型 |
| `BUILD_LOG.md` | 更新日志 |

**改动内容：**

- **继续添加文件修复：** 点击"继续添加文件"现在会追加到列表末尾，不再覆盖已选文件
- **图片缩略图预览：** 文件列表中图片显示实际缩略图
- **图片方向全部回退：** 不做任何 EXIF 处理，图片原样输出到 PDF/Office，保持用户看到的样子
- **iOS 保存修复：** 去掉 `application/octet-stream`，iOS 不再弹"跳转外部应用"提示

## v5 — 2026-07-05 | 分环境交互 + share_target 完善

**修改文件：**

| 文件 | 改动 |
|------|------|
| `src/shared/utils/share.ts` | 新增 `isDesktop()`、`isWeChatBrowser()`、`isRunningStandalone()`、`previewFileInWeChat()` |
| `src/modules/format-convert/pages/ConvertingPage.tsx` | 桌面端仅显示保存下载；微信内置浏览器改用预览打开；手机保持分享 |
| `src/modules/format-convert/pages/ConvertPage.tsx` | 新增从微信接收图片指引；launchQueue 防重复注册 |
| `BUILD_LOG.md` | 更新日志 |

**改动内容：**

- **桌面端（电脑）：** 主按钮改为「💾 保存下载」，提示"桌面端暂不支持直接分享，保存后拖入微信窗口发送给好友"
- **微信内置浏览器：** 主按钮改为「📤 发送给好友」，点击后在微信中打开 PDF/图片（微信自带查看器支持从「···」发送给朋友），绕过 WeChat 对 `navigator.share()` 的限制
- **正常手机浏览器：** 保持「📤 分享给好友」不变，使用系统分享菜单
- **新手指引：** ConvertPage 空态新增"从微信接收图片"指引卡片（仅未安装 PWA 时显示）
- **launchQueue 稳健性：** 用 `useRef` 防止重复注册消费器

## v6 — 2026-07-05 | iOS PWA 分享修复（PNG图标 + Service Worker 拦截）

**修改文件：**

| 文件 | 改动 |
|------|------|
| `index.html` | `apple-touch-icon` 改用 PNG 180×180；移除 SVG 引用 |
| `vite.config.ts` | 新增 `strategies: injectManifest` + 自定义 SW；manifest 图标改为 PNG；移除 workbox 配置 |
| `src/sw.ts` | **新增** 自定义 Service Worker：拦截 iOS share_target POST /convert，文件存 IndexedDB，重定向到页面 |
| `src/shared/utils/getSharedFiles.ts` | **新增** 前端读取 IndexedDB 中分享文件的工具函数 |
| `src/modules/format-convert/pages/ConvertPage.tsx` | 新增 IndexedDB 消费路径（iOS），支持 `?shared=1` URL 参数 |
| `public/icon.svg` | **删除**（不再使用） |
| `public/icons.svg` | **删除**（不再使用） |
| `public/icon-{180,192,512}.png` | **新增** 从 SVG 生成的 PNG 图标 |
| `BUILD_LOG.md` | 更新日志 |
| `package.json` | 新增 sharp 依赖（图标生成） |

**改动内容：**

- **图标格式修复：** iOS 不识别 SVG 图标，PWA 无法注册到系统分享列表。全部改为 PNG（sharp 生成 180/192/512 三种尺寸）
- **Service Worker POST 拦截：** iOS 通过 share_target 分享文件时发送 POST 到 `/convert`，自定义 SW 拦截后解析 FormData，存入 IndexedDB，再重定向到 `/convert?shared=1`
- **双路径接收：** Android/Chrome 走 `launchQueue`，iOS 走 IndexedDB，统一在 ConvertPage 消费
- **Google Fonts 缓存：** SW 中保留 CacheFirst 策略

## v7 — 2026-07-05 | 微信浏览器流程简化：自动预览 → 右上角转发

**修改文件：**

| 文件 | 改动 |
|------|------|
| `src/modules/format-convert/pages/ConvertingPage.tsx` | 微信环境：转换完自动预览文件，删除「分享好友」按钮；改为预览+保存 |
| `BUILD_LOG.md` | 更新日志 |

**改动内容：**

- **微信内置浏览器流程重做：** 转换完成自动预览图片/PDF → 用户直接点右上角「···」即可发送给朋友，不再绕路
- **删除「分享好友」按钮：** 微信里 `navigator.share()` 走不通，预览后用微信原生「···」菜单转发更自然
- **fallback 修复：** `handleShare` 引用改为 `handlePrimaryAction`
- **iOS PWA 分享修复搁置**（iOS 沙箱限制暂无法绕过）
