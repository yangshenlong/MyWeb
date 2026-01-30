# 博客深色极简高级感 redesign 设计文档

## 概述

本次 redesign 的目标是将博客的视觉风格从当前的玻璃拟态风格转变为**深色极简高级感**风格。设计哲学是让内容成为主角，通过克制的视觉元素和精致的微交互提升阅读体验。

## 设计原则

1. **内容优先** - 设计退居幕后，不抢夺内容注意力
2. **克制的层次** - 用透明度层级而非多种颜色创造视觉层次
3. **精致微交互** - 流畅的过渡动效，感觉得到但不突兀
4. **技术内容友好** - 代码块清晰可读，适合技术博客场景

## 色彩系统

### 背景层次

| Token            | 值        | 用途                    |
| ---------------- | --------- | ----------------------- |
| `--bg-primary`   | `#050505` | 页面主背景 - 近黑有质感 |
| `--bg-secondary` | `#0a0a0a` | 卡片、浮层背景          |
| `--bg-tertiary`  | `#0f0f0f` | 代码块、引用块          |
| `--bg-hover`     | `#141414` | hover 状态微亮          |

### 文字层次（4 级透明度系统）

| Token              | 值                          | 用途         |
| ------------------ | --------------------------- | ------------ |
| `--text-primary`   | `rgba(255, 255, 255, 0.92)` | 标题、正文   |
| `--text-secondary` | `rgba(255, 255, 255, 0.65)` | 辅助说明     |
| `--text-tertiary`  | `rgba(255, 255, 255, 0.45)` | 时间、标签   |
| `--text-muted`     | `rgba(255, 255, 255, 0.25)` | 分割线、禁用 |

### 强调色（低饱和紫）

| Token             | 值                          | 用途              |
| ----------------- | --------------------------- | ----------------- |
| `--accent`        | `#7c6fae`                   | 主强调色 - 柔和紫 |
| `--accent-hover`  | `#9b8ec9`                   | hover 时稍亮      |
| `--accent-subtle` | `rgba(124, 111, 174, 0.15)` | 背景高亮          |

## 排版系统

### 字体栈

```css
--font-sans:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
```

使用系统字体意味着零加载时间，每个用户看到的最适合他们设备的字体。

### 字号层级

| Token          | 值       | 字重 | 用途                    |
| -------------- | -------- | ---- | ----------------------- |
| `--text-hero`  | 2.5rem   | 600  | 首页大标题              |
| `--text-h1`    | 2rem     | 600  | 文章标题                |
| `--text-h2`    | 1.5rem   | 500  | 章节标题                |
| `--text-h3`    | 1.25rem  | 500  | 小节标题                |
| `--text-body`  | 1.125rem | 400  | 正文，line-height: 1.75 |
| `--text-small` | 0.875rem | 400  | 辅助文字                |
| `--text-xs`    | 0.75rem  | 400  | 标签、时间戳            |

排版系统的特点是**克制的层级**——不用巨大的字号差异，而是用字重（weight）和透明度创造层次。

### 文章布局参数

```css
--content-width: 820px; /* 较宽布局，适合代码展示 */
--content-padding: 1.5rem; /* 移动端边距 */
--paragraph-spacing: 1.5rem; /* 段落间距 */
--heading-spacing-top: 2.5rem; /* 标题上方间距 */
--heading-spacing-bottom: 1rem; /* 标题下方间距 */
```

## 微交互动效

### 全局过渡

```css
* {
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### 链接交互

```css
.article-content a {
  color: var(--text-primary);
  text-decoration: underline;
  text-decoration-color: var(--text-muted);
  text-underline-offset: 0.2em;
  transition: text-decoration-color 0.2s ease;
}

.article-content a:hover {
  text-decoration-color: var(--accent);
  color: var(--accent-hover);
}
```

### 按钮/卡片交互

```css
.button,
.card {
  transition:
    transform 0.15s ease,
    background-color 0.2s ease;
}

.button:hover,
.card:hover {
  background-color: var(--bg-hover);
  transform: translateY(-1px);
}

.button:active,
.card:active {
  transform: translateY(0);
}
```

### 页面加载

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-content {
  animation: fadeIn 0.4s ease-out;
}
```

动效的原则是**"感觉得到但注意不到"**——交互反馈自然流畅，不会吸引注意力，但会让体验更精致。

## 代码块样式

### 容器

```css
pre {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1.25rem;
  overflow-x: auto;
  font-size: 0.9em;
  line-height: 1.6;
}

pre[data-language]::before {
  content: attr(data-language);
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--text-muted);
}
```

### 行内代码

```css
code {
  background: var(--accent-subtle);
  color: var(--accent);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

pre code {
  background: none;
  color: inherit;
  padding: 0;
}
```

### 语法高亮配色（低调风格）

| Token             | 颜色                    | 说明           |
| ----------------- | ----------------------- | -------------- |
| `.token-comment`  | `var(--text-muted)`     | 注释 - 25%白   |
| `.token-keyword`  | `#9b8ec9`               | 关键字 - 淡紫  |
| `.token-string`   | `#a3b8a0`               | 字符串 - 淡绿  |
| `.token-number`   | `#d4a5a5`               | 数字 - 淡红    |
| `.token-function` | `var(--text-primary)`   | 函数 - 纯白    |
| `.token-operator` | `var(--text-secondary)` | 运算符 - 65%白 |

### 复制按钮

- 代码块右上角，默认透明度 0
- hover 代码块时显示，淡入 0.2s
- 点击后显示"已复制"提示，2s 后恢复

## 组件规范

### 卡片

```css
.card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition:
    border-color 0.2s ease,
    transform 0.15s ease;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}
```

### 标签/徽章

```css
.tag {
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

.tag:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}
```

### 分隔线

```css
hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--text-muted), transparent);
  margin: 3rem 0;
}
```

### 引用块

```css
blockquote {
  border-left: 2px solid var(--accent);
  padding-left: 1.5rem;
  margin-left: 0;
  color: var(--text-secondary);
  font-style: italic;
}
```

## 参考案例

本次设计参考了以下优秀的深色极简风格网站：

1. **Linear App** (linear.app) - 4 级透明度文字层次系统
2. **Rauno** (rauno.me) - 纯黑背景 + 12 级灰阶
3. **Brian Lovin** (brianlovin.com) - 窄居中布局 + 混排字体

## 移除的设计元素

为了达成极简高级感，以下现有设计元素将被移除或简化：

- ❌ 玻璃拟态/毛玻璃效果（backdrop-filter）
- ❌ 强烈的阴影/投影
- ❌ 过多的动画效果
- ❌ 多种强调色（统一为低饱和紫色）
- ❌ 复杂的边框装饰

## 实施建议

1. **分阶段实施** - 先更新 CSS 变量和基础样式，再逐个组件调整
2. **保持兼容性** - 确保暗色/亮色/自动模式都正常工作
3. **性能优先** - 使用系统字体，避免额外的字体加载
4. **测试阅读体验** - 长篇文章的实际阅读舒适度是关键指标
