# 杨慎龙 - 个人博客

Technical Artist 个人网站，专注于 Shader 开发、实时渲染和工具链优化。

## 技术栈

- **框架**: Astro 5 + TypeScript
- **样式**: CSS 自定义属性设计系统 + Glassmorphism
- **搜索**: Pagefind 静态搜索
- **内容**: Markdown / MDX
- **CI**: GitHub Actions + Husky + lint-staged

## 开发

```bash
npm install       # 安装依赖
npm run dev       # 开发服务器 http://localhost:4321
npm run build     # 生产构建
npm run preview   # 预览构建结果
npm run lint      # 代码检查
npm run format    # 格式化代码
npm run type-check # 类型检查
```

## 项目结构

```
src/
├── components/    # UI 组件
├── content/       # 博客文章 (Markdown)
├── layouts/       # 页面布局
├── pages/         # 路由页面
├── styles/        # 全局样式 & 设计令牌
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数
```
