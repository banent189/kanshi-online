import type { ReactNode } from 'react'

/** 模块内一个页面的路由定义 */
export interface ModuleRoute {
  path: string
  element: ReactNode
}

/** 一个功能模块 */
export interface AppModule {
  /** 唯一标识，也用作路由前缀 */
  id: string
  /** 首页显示的名称 */
  name: string
  /** 首页显示的简短描述 */
  description: string
  /** 图标 emoji */
  icon: string
  /** 该模块的页面路由 */
  routes: ModuleRoute[]
}

const modules = new Map<string, AppModule>()

export function registerModule(m: AppModule) {
  if (modules.has(m.id)) throw new Error(`模块 "${m.id}" 已存在`)
  modules.set(m.id, m)
}

export function getModules(): AppModule[] {
  return [...modules.values()]
}

export function getModule(id: string): AppModule | undefined {
  return modules.get(id)
}

export function getAllModuleRoutes(): ModuleRoute[] {
  return [...modules.values()].flatMap(m => m.routes)
}
