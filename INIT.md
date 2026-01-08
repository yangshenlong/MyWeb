# 网站初始化配置

## 设计风格系统

### 风格定位
**建筑美学技术美术个人网站**

- 核心理念：极简主义 + 精致动效 + 毛玻璃质感
- 受众定位：技术美术、游戏开发者、图形程序员
- 视觉特点：深色调、几何线条、网格布局

---

## 配色方案

### 主色调
```css
--bg-primary: #050505;          /* 主背景 */
--bg-secondary: #0a0a0a;        /* 次级背景 */
--bg-tertiary: #030303;         /* 页脚背景 */
```

### 文字颜色
```css
--text-primary: rgba(255, 255, 255, 0.95);    /* 主文字 */
--text-secondary: rgba(255, 255, 255, 0.7);    /* 次级文字 */
--text-tertiary: rgba(255, 255, 255, 0.5);     /* 辅助文字 */
--text-muted: rgba(255, 255, 255, 0.3);        /* 弱化文字 */
```

### 边框和分割线
```css
--border-subtle: rgba(255, 255, 255, 0.06);    /* 微妙边框 */
--border-medium: rgba(255, 255, 255, 0.1);     /* 中等边框 */
--border-strong: rgba(255, 255, 255, 0.15);    /* 强边框 */
```

### 装饰元素
```css
--deco-number: rgba(255, 255, 255, 0.03);      /* 装饰数字 */
--deco-line: rgba(255, 255, 255, 0.2);         /* 装饰线条 */
```

---

## 字体系统

### 主要字体
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 字重使用
- Light (200): 大标题、Hero文字
- Regular (300-400): 正文、副标题
- Medium (500): 按钮、强调文字
- Semibold (600): 小标题

### 代码/数字字体
```css
font-family: 'Space Mono', 'Courier New', monospace;
```

### 字体大小规范
```css
/* 标题 */
--display: clamp(3em, 12vw, 10em);      /* Hero标题 */
--h1: clamp(2.5em, 6vw, 4em);           /* 页面标题 */
--h2: clamp(2em, 4vw, 3em);             /* 区块标题 */
--h3: 1.2em - 1.5em;                    /* 小标题 */

/* 正文 */
--body-large: 1.1em;                    /* 大正文 */
--body-base: 1em;                       /* 基础正文 */
--body-small: 0.9em;                    /* 小正文 */
--body-tiny: 0.7em;                     /* 标签文字 */
```

---

## 组件系统

### 核心组件

1. **HeaderArchitectural.astro** - 导航头
   - 毛玻璃背景
   - 网格叠加效果
   - 动画导航项
   - 响应式菜单

2. **HeroArchitectural.astro** - 首屏英雄区
   - 几何浮动形状
   - 网格背景
   - 淡入动画
   - 滚动提示

3. **GlassCard.astro** - 毛玻璃卡片
   - backdrop-filter blur
   - 噪点纹理
   - 角标装饰
   - 悬停动效

4. **ProjectGridArchitectural.astro** - 项目网格
   - 2列网格布局
   - 编号显示
   - 角落高亮
   - 悬停上浮

5. **ScrollProgress.astro** - 滚动进度
   - 固定顶部
   - 渐变进度条
   - 发光效果

6. **BackToTop.astro** - 返回顶部
   - 滚动触发显示
   - 平滑滚动

---

## 页面结构

### 网站地图
```
/ (首页)
├── Hero 区域
├── 服务展示 (4个 GlassCard)
├── 精选作品 (4个项目)
├── 关于简介
└── 联系 CTA

/projects (作品页)
├── 页面头部
├── 全部作品网格 (8个项目)
└── 页脚

/blog (博客页)
├── 页面头部
├── 文章网格 (2列)
└── 页脚

/blog/{slug} (文章详情)
├── 文章内容
└── 导航

/about (关于页)
├── 页面头部
├── 技能展示 (4个 GlassCard)
├── 工作经历 (时间线)
└── 页脚

/contact (联系页)
├── 页面头部
├── 联系信息 (2个 GlassCard)
├── 联系表单
└── 页脚
```

---

## 动画系统

### 标准动画时长
```css
--duration-fast: 0.2s;
--duration-base: 0.3s;
--duration-medium: 0.5s;
--duration-slow: 0.8s;
```

### 缓动函数
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```

### 常用动画
```css
/* 淡入上浮 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滑动展开 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 浮动 */
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(-30px) rotate(50deg);
  }
}
```

---

## 间距系统

### 基础间距单位
```css
--space-xs: 0.5em;
--space-sm: 1em;
--space-md: 2em;
--space-lg: 4em;
--space-xl: 6em;
--space-2xl: 8em;
```

### 页面内边距
```css
--padding-page-desktop: 4em;
--padding-page-tablet: 2em;
--padding-page-mobile: 1.5em;
```

---

## 响应式断点

```css
/* 大屏幕 */
@media (min-width: 1600px) { }

/* 桌面 */
@media (max-width: 1024px) {
  --padding-page: 2em;
}

/* 平板 */
@media (max-width: 768px) {
  --padding-page: 1.5em;
}

/* 手机 */
@media (max-width: 480px) {
  --padding-page: 1em;
}
```

---

## 毛玻璃效果规范

### 标准毛玻璃
```css
background: rgba(255, 255, 255, 0.02);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.06);
```

### 强毛玻璃
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(30px);
-webkit-backdrop-filter: blur(30px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### 噪点纹理
```css
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
```

---

## 内容规范

### 导航结构
```javascript
[
  { title: '作品', href: '/projects' },
  { title: '博客', href: '/blog' },
  { title: '关于', href: '/about' },
  { title: '联系', href: '/contact' }
]
```

### 页面元数据
```javascript
{
  title: '杨慎龙',
  description: 'Technical Artist | Shader开发 | 渲染技术 | 工具开发',
  author: {
    name: '杨慎龙',
    bio: 'Technical Artist，专注于实时渲染、Shader开发和工具链优化。'
  }
}
```

---

## 技术栈

### 前端框架
- Astro 5.16.7
- Vue 3 (可选)
- TypeScript

### 样式系统
- 原生 CSS
- Scoped Styles
- CSS 自定义属性

### 主要依赖
```json
{
  "astro": "^5.16.7",
  "@astrojs/vue": "^4.5.0",
  "@astrojs/sitemap": "^3.2.1",
  "tailwindcss": "^3.4.17"
}
```

---

## 性能优化

### 图片优化
- 使用 WebP 格式
- 懒加载
- 响应式图片

### 字体优化
- font-display: swap
- 预连接 Google Fonts
- 仅加载必要字重

### 代码分割
- 按路由分割
- 组件懒加载
- CSS 内联关键样式

---

## Git 提交规范

### 提交格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- perf: 性能优化
- test: 测试
- chore: 构建

---

## 开发命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 类型检查
npm run check
```

---

## 待办事项

- [ ] 添加暗色模式切换
- [ ] 实现文章搜索功能
- [ ] 添加评论系统
- [ ] 集成 Google Analytics
- [ ] 添加 RSS 订阅
- [ ] 优化移动端体验
- [ ] 添加更多示例作品
- [ ] 实现国际化支持

---

**最后更新**: 2026-01-09
**版本**: 1.0.0
**状态**: ✅ 已确认
