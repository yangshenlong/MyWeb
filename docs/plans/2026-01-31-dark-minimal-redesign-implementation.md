# 深色极简高级感 Redesign 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将博客从玻璃拟态风格转变为深色极简高级感风格

**Architecture:** 更新 CSS 变量系统、简化组件样式、移除玻璃拟态效果、添加流畅微交互、更新语法高亮配色

**Tech Stack:** Astro + 纯 CSS（无 Tailwind）

---

## 前置信息

### 关键文件位置

- `src/styles/theme.css` - 主题变量定义
- `src/styles/global.css` - 全局样式
- `src/components/GlassCard.astro` - 玻璃卡片组件（需简化）
- `src/components/HeaderArchitectural.astro` - 头部组件（需移除毛玻璃）

### 设计规范参考

详见 `docs/plans/2026-01-31-dark-minimal-redesign-design.md`

---

## Task 1: 更新 theme.css 变量系统

**Files:**

- Modify: `src/styles/theme.css:1-153`

**Step 1: 备份原文件**

```bash
cp src/styles/theme.css src/styles/theme.css.backup
```

**Step 2: 更新暗色主题变量**

替换 `:root` 部分（第4-48行）：

```css
:root {
  /* 背景层次 */
  --bg-primary: #050505;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #0f0f0f;
  --bg-hover: #141414;

  /* 文字层次 - 4级透明度系统 */
  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.65);
  --text-tertiary: rgba(255, 255, 255, 0.45);
  --text-muted: rgba(255, 255, 255, 0.25);

  /* 边框色 */
  --border-subtle: rgba(255, 255, 255, 0.03);
  --border-standard: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.1);

  /* 强调色 - 低饱和紫 */
  --accent: #7c6fae;
  --accent-hover: #9b8ec9;
  --accent-subtle: rgba(124, 111, 174, 0.15);

  /* 字体 - 系统字体栈 */
  --font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;

  /* 字号层级 */
  --text-hero: 2.5rem;
  --text-h1: 2rem;
  --text-h2: 1.5rem;
  --text-h3: 1.25rem;
  --text-body: 1.125rem;
  --text-small: 0.875rem;
  --text-xs: 0.75rem;

  /* 布局 */
  --content-width: 820px;
  --content-padding: 1.5rem;

  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;

  /* 兼容旧变量 */
  --color-bg-primary: var(--bg-primary);
  --color-bg-secondary: var(--bg-secondary);
  --color-bg-tertiary: var(--bg-tertiary);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
  --color-text-muted: var(--text-muted);
  --color-primary: var(--accent);
  --color-primary-hover: var(--accent-hover);
  --color-primary-muted: var(--accent-subtle);
}
```

**Step 3: 更新亮色主题变量**

替换 `[data-theme="light"]` 部分（第51-85行）：

```css
[data-theme="light"] {
  /* 背景层次 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f1f3f5;
  --bg-hover: #e9ecef;

  /* 文字层次 */
  --text-primary: rgba(0, 0, 0, 0.9);
  --text-secondary: rgba(0, 0, 0, 0.65);
  --text-tertiary: rgba(0, 0, 0, 0.45);
  --text-muted: rgba(0, 0, 0, 0.25);

  /* 边框色 */
  --border-subtle: rgba(0, 0, 0, 0.04);
  --border-standard: rgba(0, 0, 0, 0.08);
  --border-hover: rgba(0, 0, 0, 0.12);

  /* 强调色 - 稍深以在亮色背景可见 */
  --accent: #6b5fa0;
  --accent-hover: #5a4f8a;
  --accent-subtle: rgba(107, 95, 160, 0.12);

  /* 兼容旧变量 */
  --color-bg-primary: var(--bg-primary);
  --color-bg-secondary: var(--bg-secondary);
  --color-bg-tertiary: var(--bg-tertiary);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
  --color-text-muted: var(--text-muted);
  --color-primary: var(--accent);
  --color-primary-hover: var(--accent-hover);
  --color-primary-muted: var(--accent-subtle);
}
```

**Step 4: 更新自动主题媒体查询**

替换 `@media (prefers-color-scheme: light)` 部分（第88-117行）：

```css
@media (prefers-color-scheme: light) {
  [data-theme="auto"] {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-tertiary: #f1f3f5;
    --bg-hover: #e9ecef;

    --text-primary: rgba(0, 0, 0, 0.9);
    --text-secondary: rgba(0, 0, 0, 0.65);
    --text-tertiary: rgba(0, 0, 0, 0.45);
    --text-muted: rgba(0, 0, 0, 0.25);

    --border-subtle: rgba(0, 0, 0, 0.04);
    --border-standard: rgba(0, 0, 0, 0.08);
    --border-hover: rgba(0, 0, 0, 0.12);

    --accent: #6b5fa0;
    --accent-hover: #5a4f8a;
    --accent-subtle: rgba(107, 95, 160, 0.12);

    --color-bg-primary: var(--bg-primary);
    --color-bg-secondary: var(--bg-secondary);
    --color-bg-tertiary: var(--bg-tertiary);
    --color-text-primary: var(--text-primary);
    --color-text-secondary: var(--text-secondary);
    --color-text-tertiary: var(--text-tertiary);
    --color-text-muted: var(--text-muted);
    --color-primary: var(--accent);
    --color-primary-hover: var(--accent-hover);
    --color-primary-muted: var(--accent-subtle);
  }
}
```

**Step 5: 更新过渡样式**

替换第120-136行：

```css
/* 全局过渡 */
* {
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

/* 聚焦状态 */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* 防止媒体元素过渡 */
img,
video,
iframe,
[no-transition] {
  transition: none !important;
}
```

**Step 6: 验证修改**

```bash
# 检查 CSS 语法
npx stylelint src/styles/theme.css
```

Expected: 无错误

**Step 7: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat: 更新主题变量系统为深色极简风格

- 添加新的4级背景层次变量
- 添加4级文字透明度系统
- 更换强调色为低饱和紫色 #7c6fae
- 更换字体为系统字体栈
- 更新亮色/自动主题配色
- 保留旧变量名兼容现有组件

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 更新 global.css 基础样式

**Files:**

- Modify: `src/styles/global.css:1-358`

**Step 1: 更新 :root 变量（第8-118行）**

保留与新 theme.css 一致的变量，移除玻璃拟态相关变量：

```css
:root {
  /* Color System - Minimal Dark Palette */
  --color-bg-primary: #050505;
  --color-bg-secondary: #0a0a0a;
  --color-bg-tertiary: #0f0f0f;
  --bg-hover: #141414;

  --color-text-primary: rgba(255, 255, 255, 0.92);
  --color-text-secondary: rgba(255, 255, 255, 0.65);
  --color-text-tertiary: rgba(255, 255, 255, 0.45);
  --color-text-muted: rgba(255, 255, 255, 0.25);

  /* Accent - Low Saturation Purple */
  --color-accent-rgb: 124, 111, 174;
  --accent: #7c6fae;
  --accent-hover: #9b8ec9;
  --accent-subtle: rgba(124, 111, 174, 0.15);

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.03);
  --border-standard: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.1);

  /* Typography - System Font Stack */
  --font-primary:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;

  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing System */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;

  /* Layout */
  --section-padding-y: 6rem;
  --section-padding-x: 1.5rem;
  --container-max-width: 1200px;
  --content-max-width: 820px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;

  /* Z-index Layers */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
}
```

**Step 2: 移除玻璃拟态工具类（第253-283行）**

删除 `.glass`、`.text-gradient`、`.text-gradient-accent`、`.glow` 这些类，或简化它们。

替换为：

```css
/* Card - Minimal Style */
.card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid var(--border-subtle);
  transition:
    border-color var(--transition-normal),
    transform var(--transition-fast);
}

.card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

/* Text Gradient - Subtle */
.text-gradient {
  background: linear-gradient(
    135deg,
    var(--color-text-primary) 0%,
    var(--color-text-secondary) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Step 3: 更新基础排版样式（第193-222行）**

```css
/* Typography */
h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

h1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
}

h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin-top: var(--space-3xl);
  margin-bottom: var(--space-md);
}

h3 {
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  margin-top: var(--space-2xl);
  margin-bottom: var(--space-sm);
}

p {
  margin: 0 0 var(--space-md) 0;
  line-height: 1.75;
  color: var(--color-text-secondary);
}

a {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--accent);
}
```

**Step 4: 更新选中文本样式（第224-229行）**

```css
::selection {
  background: var(--accent-subtle);
  color: var(--accent);
}
```

**Step 5: 验证修改**

```bash
npx stylelint src/styles/global.css
```

Expected: 无错误

**Step 6: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: 更新全局样式为深色极简风格

- 更新 :root 变量与新主题系统一致
- 移除玻璃拟态相关变量和工具类
- 简化卡片样式为纯色背景
- 更新排版层次和间距
- 更新选中文本高亮色

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 简化 GlassCard 组件

**Files:**

- Modify: `src/components/GlassCard.astro:36-243`

**Step 1: 简化样式**

替换整个 `<style>` 部分：

```astro
<style>
  .glass-card {
    position: relative;
    background: var(--bg-secondary);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    transition:
      border-color 0.2s ease,
      transform 0.15s ease;
  }

  .glass-card.hover-enabled:hover {
    border-color: var(--border-hover);
    transform: translateY(-2px);
  }

  .card-content {
    position: relative;
    padding: 1.5rem;
  }
</style>
```

**Step 2: 简化模板**

替换整个模板部分（第16-34行）：

```astro
<div
  class:list={["glass-card", className, { "hover-enabled": hover }]}
  style={`--delay: ${delay}ms`}
>
  <div class="card-content">
    <slot />
  </div>
</div>
```

**Step 3: 验证**

```bash
# 检查 Astro 语法
npx astro check
```

**Step 4: Commit**

```bash
git add src/components/GlassCard.astro
git commit -m "refactor: 简化 GlassCard 组件为极简风格

- 移除玻璃拟态效果（backdrop-filter、渐变、噪点）
- 移除角落标记和光效装饰
- 简化为纯色卡片 + 边框 + hover效果

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 更新 HeaderArchitectural 组件

**Files:**

- Modify: `src/components/HeaderArchitectural.astro:86-122` (背景样式)
- Modify: `src/components/HeaderArchitectural.astro:280-293` (nav hover 效果)

**Step 1: 简化头部背景**

替换 `.header-background`、`.grid-overlay`、`.glass-effect` 样式（第86-122行）：

```css
.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
}
```

删除 `.grid-overlay` 和 `.glass-effect` 的样式定义。

**Step 2: 简化导航 hover 效果**

替换 `.nav-item:hover` 相关样式（第280-293行）：

```css
.nav-item:hover .nav-number {
  color: var(--text-secondary);
}

.nav-item:hover .nav-text {
  color: var(--text-primary);
}

.nav-item:hover .nav-line {
  width: 100%;
}
```

**Step 3: 更新移动端菜单背景**

替换第375-376行：

```css
background: var(--bg-primary);
```

删除 `backdrop-filter: blur(var(--glass-blur, 30px));`

**Step 4: Commit**

```bash
git add src/components/HeaderArchitectural.astro
git commit -m "refactor: 简化 HeaderArchitectural 为极简风格

- 移除头部毛玻璃背景效果
- 移除网格覆盖层
- 简化导航 hover 效果（移除发光）
- 简化移动端菜单背景

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 添加文章页面内容样式

**Files:**

- Modify: `src/styles/global.css` - 在文件末尾添加

**Step 1: 添加文章容器样式**

在文件末尾添加：

```css
/* Article Content Styles */
.article-content {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--content-padding);
}

/* Article Typography */
.article-content h1 {
  margin-bottom: var(--space-lg);
}

.article-content h2 {
  margin-top: var(--space-3xl);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-subtle);
}

.article-content h3 {
  margin-top: var(--space-2xl);
  margin-bottom: var(--space-sm);
}

.article-content p {
  margin-bottom: var(--space-md);
}

/* Article Links */
.article-content a {
  color: var(--text-primary);
  text-decoration: underline;
  text-decoration-color: var(--text-muted);
  text-underline-offset: 0.2em;
  transition:
    text-decoration-color 0.2s ease,
    color 0.2s ease;
}

.article-content a:hover {
  text-decoration-color: var(--accent);
  color: var(--accent-hover);
}

/* Lists */
.article-content ul,
.article-content ol {
  margin-bottom: var(--space-md);
  padding-left: var(--space-lg);
}

.article-content li {
  margin-bottom: var(--space-xs);
  color: var(--text-secondary);
}

.article-content li::marker {
  color: var(--text-muted);
}

/* Blockquote */
.article-content blockquote {
  border-left: 2px solid var(--accent);
  padding-left: var(--space-md);
  margin: var(--space-lg) 0;
  color: var(--text-secondary);
  font-style: italic;
}

/* Horizontal Rule */
.article-content hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--text-muted), transparent);
  margin: var(--space-3xl) 0;
}

/* Inline Code */
.article-content code {
  background: var(--accent-subtle);
  color: var(--accent);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
  font-family: var(--font-mono);
}

/* Code Blocks */
.article-content pre {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  overflow-x: auto;
  margin: var(--space-md) 0;
}

.article-content pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.6;
}

/* Images */
.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: var(--space-lg) 0;
}

/* Tables */
.article-content table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-md) 0;
  font-size: 0.9em;
}

.article-content th,
.article-content td {
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}

.article-content th {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.article-content td {
  color: var(--text-secondary);
}
```

**Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: 添加文章页面内容样式

- 添加 .article-content 容器样式
- 添加标题、段落、链接样式
- 添加列表、引用、分割线样式
- 添加代码块和图片样式
- 添加表格样式

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: 更新语法高亮配色

**Files:**

- Create: `src/styles/syntax-highlight.css`
- Modify: `src/components/BaseHead.astro` - 引入新样式

**Step 1: 创建语法高亮样式文件**

```css
/* Syntax Highlighting - Minimal Dark Theme */

/* Code block container */
pre[data-language]::before {
  content: attr(data-language);
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

/* Syntax Tokens - Subtle Color Palette */
.token-comment,
.token-prolog,
.token-doctype,
.token-cdata {
  color: var(--text-muted);
}

.token-punctuation {
  color: var(--text-secondary);
}

.token-property,
.token-tag,
.token-boolean,
.token-number,
.token-constant,
.token-symbol,
.token-deleted {
  color: #d4a5a5; /* Muted red */
}

.token-selector,
.token-attr-name,
.token-string,
.token-char,
.token-builtin,
.token-inserted {
  color: #a3b8a0; /* Muted green */
}

.token-operator,
.token-entity,
.token-url,
.language-css .token-string,
.style .token-string {
  color: var(--text-secondary);
}

.token-atrule,
.token-attr-value,
.token-keyword {
  color: #9b8ec9; /* Muted purple */
}

.token-function,
.token-class-name {
  color: var(--text-primary);
}

.token-regex,
.token-important,
.token-variable {
  color: #c9b896; /* Muted yellow */
}

/* Line Numbers (optional) */
.line-numbers {
  position: relative;
  padding-left: 3.5rem;
}

.line-numbers .line-numbers-rows {
  position: absolute;
  left: 0;
  top: 0;
  width: 3rem;
  border-right: 1px solid var(--border-subtle);
  padding-right: 0.5rem;
  text-align: right;
  color: var(--text-muted);
  font-size: 0.9em;
  line-height: 1.6;
}
```

**Step 2: 在 BaseHead.astro 中引入**

在 `<head>` 中添加：

```astro
<link rel="stylesheet" href="/src/styles/syntax-highlight.css" />
```

**Step 3: Commit**

```bash
git add src/styles/syntax-highlight.css src/components/BaseHead.astro
git commit -m "feat: 添加低调语法高亮配色

- 创建 syntax-highlight.css
- 使用低饱和配色（淡紫、淡绿、淡红）
- 添加代码块语言标签样式
- 添加可选行号样式

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: 更新 TechTag 组件

**Files:**

- Modify: `src/components/TechTag.astro`

**Step 1: 查看当前文件**

先读取文件了解当前结构。

**Step 2: 简化样式**

将多彩标签改为统一的极简风格：

```astro
<span class="tech-tag">
  <slot />
</span>

<style>
  .tech-tag {
    display: inline-flex;
    align-items: center;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  .tech-tag:hover {
    background: var(--accent-subtle);
    color: var(--accent);
  }
</style>
```

**Step 3: Commit**

```bash
git add src/components/TechTag.astro
git commit -m "refactor: 简化 TechTag 为极简风格

- 移除多彩配色
- 统一使用灰底 + 低饱和紫hover效果
- 简化为 pill 形状

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: 构建和验证

**Step 1: 构建项目**

```bash
npm run build
```

Expected: 构建成功，无 CSS 错误

**Step 2: 预览检查**

```bash
npm run preview
```

检查点：

- [ ] 首页加载正常
- [ ] 导航栏显示正常（无玻璃效果）
- [ ] 卡片样式正确（纯色背景）
- [ ] 文章页面排版正常
- [ ] 代码块语法高亮正常
- [ ] 暗色/亮色切换正常
- [ ] 所有链接 hover 效果正常

**Step 3: Commit 任何修复**

```bash
git add .
git commit -m "fix: 构建修复和样式调整

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 实施完成总结

实施完成后，博客将具有以下特征：

1. ✅ 深色极简配色（4级背景 + 4级文字透明度）
2. ✅ 低饱和紫色强调色
3. ✅ 系统字体栈（零加载成本）
4. ✅ 820px 宽内容区域
5. ✅ 流畅的微交互动效
6. ✅ 移除所有玻璃拟态效果
7. ✅ 低调的语法高亮配色
8. ✅ 统一简洁的组件样式
