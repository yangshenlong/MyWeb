# AI Agent 指南

本项目是一个使用 Astro 5.16.7 + TypeScript 构建的技术艺术家个人博客，采用 Premium Dark Mode + Architectural Glassmorphism 设计风格。

## 项目概览

- **框架**: Astro 5.16.7
- **语言**: TypeScript (严格模式)
- **设计系统**: Premium Dark Mode (#050505) + Architectural Glassmorphism
- **强调色**: Indigo (#6366f1), Purple (#a855f7), Orange (#FF4F00)
- **字体**: Inter (正文), Space Mono (等宽/代码)

---

## 命令参考

### 开发命令
```bash
npm run dev          # 启动开发服务器 (http://localhost:4321)
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run astro        # 运行 Astro CLI 命令
```

### 代码质量命令
```bash
npm run format       # 格式化代码 (Prettier)
npm run format:check # 检查格式化
npm run lint         # 代码检查 (ESLint)
npm run lint:fix     # 自动修复 lint 问题
npm run type-check   # TypeScript 类型检查 (astro check)
```

### 测试
本项目未配置测试框架。如需添加测试，请优先考虑 Vitest + Testing Library。

---

## 代码风格规范

### 导入顺序
```typescript
// 1. 外部依赖
import { getCollection } from 'astro:content';

// 2. 内部组件
import HeaderArchitectural from '../components/HeaderArchitectural.astro';
import GlassCard from '../components/GlassCard.astro';

// 3. 内部工具/类型
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import type { BlogActivity } from '../types/activity';
```

### 命名约定

**组件/类型/接口** - PascalCase
```typescript
// 文件名: CTAButton.astro
// 组件名: CTAButton
// 类型: ActivityType, BlogActivity, BlogStats
```

**常量** - UPPER_SNAKE_CASE
```typescript
export const SITE_TITLE = '杨慎龙';
export const AUTHOR_NAME = '杨慎龙';
```

**函数/变量** - camelCase
```typescript
function calculateBlogStats() { }
let currentFilter = 'all';
```

**CSS 类名** - kebab-case (BEM 变体)
```css
.cta-button { }
.cta-button--primary { }
.cta-button--secondary { }
.cta-button__content { }
.cta-button__glow { }
```

---

## 格式化规范 (Prettier)

```json
{
  "semi": true,              // 使用分号
  "singleQuote": false,      // 双引号
  "tabWidth": 2,             // 2 空格缩进
  "useTabs": false,          // 不使用 tab
  "trailingComma": "es5",    // 尾随逗号
  "printWidth": 100,         // 每行 100 字符
  "arrowParens": "always",   // 箭头函数参数始终加括号
  "endOfLine": "lf"          // LF 换行符
}
```

### EditorConfig 特殊规则
- **Astro/HTML 文件**: 使用 tab 缩进 (2 宽度)
- **其他文件** (JS/TS/CSS/JSON): 使用空格缩进 (2 宽度)

---

## TypeScript 规范

### 严格模式
项目使用 `astro/tsconfigs/strict` 配置，包括：
- `strictNullChecks: true`
- 无 `any` 类型 (ESLint 警告)
- 完整类型推断

### 类型定义位置
- **复杂类型**: `src/types/` 目录
- **简单类型**: 在使用处定义

```typescript
// 简单类型 - 在使用处定义
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

// 复杂类型 - 放在 src/types/
export interface BlogActivity {
  date: string;
  type: ActivityType;
  postId: string;
  postTitle: string;
  wordCount?: number;
  tags?: string[];
}
```

### 类型断言
优先使用类型断言而非 `as any`:
```typescript
// ❌ 避免
const el = element as any;

// ✅ 推荐
const el = element as HTMLElement;
```

---

## 组件开发规范

### Astro 组件结构
```astro
---
/**
 * 组件描述
 * 功能说明
 */

interface Props {
  // 属性定义
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  children: any;
}

const {
  variant = 'primary',
  size = 'md',
  children
} = Astro.props;

// 样式类名组合
const baseClass = 'cta-button';
const variantClass = `cta-button--${variant}`;
const allClasses = [baseClass, variantClass].filter(Boolean).join(' ');
---

<!-- 模板内容 -->
<element class={allClasses}>
  {children}
</element>

<style>
  /* 组件样式 */
</style>
```

### 样式优先级
1. **全局设计令牌** (`src/styles/global.css`)
   - 使用 `var(--color-*)`, `var(--font-*)`, `var(--space-*)`
   - 不要硬编码颜色/尺寸

2. **组件局部样式** (`<style>` 标签)
   - 仅限组件内部使用
   - 避免使用 `!important`

3. **全局样式覆盖** (`:global()`)
   - 仅在必要时使用
   - 必须在 `<style is:global>` 中声明

---

## 设计系统使用

### 颜色变量
```css
/* 背景色 */
--color-bg-primary: #050505;
--color-bg-secondary: #0a0a0a;

/* 文本色 */
--color-text-primary: rgba(255, 255, 255, 0.95);
--color-text-secondary: rgba(255, 255, 255, 0.7);
--color-text-tertiary: rgba(255, 255, 255, 0.5);

/* 强调色 (RGB 格式) */
--color-accent-primary: 99, 102, 241;   /* Indigo */
--color-accent-secondary: 168, 85, 247; /* Purple */
--color-accent-tertiary: 255, 79, 0;    /* Orange */
```

### 使用示例
```css
.button {
  background: linear-gradient(
    135deg,
    rgba(var(--color-accent-primary), 0.8),
    rgba(var(--color-accent-secondary), 0.8)
  );
  color: var(--color-text-primary);
  padding: var(--space-md) var(--space-xl);
}
```

### Glassmorphism 卡片
```css
.glass-card {
  background: rgba(255, 255, 255, var(--glass-opacity-bg));
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-subtle);
}
```

---

## 路径别名

```typescript
@/*                  → src/*
@components/*        → src/components/*
@layouts/*           → src/layouts/*
@pages/*             → src/pages/*
@styles/*            → src/styles/*
@assets/*            → src/assets/*
@content/*           → src/content/*
```

---

## 错误处理规范

### 组件内错误处理
```astro
---
// ✅ 优雅降级
const data = await fetchData().catch(() => null);

if (!data) {
  return <div class="error">加载失败</div>;
}
---
```

### 事件处理错误
```typescript
try {
  await performAction();
} catch (error) {
  console.error('操作失败:', error);
  // 显示用户友好的错误信息
  showErrorMessage('操作失败，请重试');
}
```

### 控制台使用
```typescript
// ✅ 允许
console.warn('警告信息');
console.error('错误信息');

// ❌ 避免
console.log('调试信息'); // 使用后删除
```

---

## 注释规范

### 文件头注释 (中文)
```typescript
/**
 * 组件名称
 * 组件描述
 * 功能说明
 */
```

### 复杂逻辑注释 (中文)
```typescript
// 提取所有唯一标签
const allTags = new Set<string>();

// 计算最大计数用于标签云大小
const maxCount = Math.max(...Array.from(tagCounts.values()));
```

### TODO 注释
```typescript
// TODO: 添加错误处理
// FIXME: 修复移动端布局问题
```

---

## 性能优化

### 图片优化
```astro
<Image
  src="/images/hero.png"
  alt="Hero Image"
  width={1920}
  height={1080}
  loading="eager"
/>
```

### 组件懒加载
```astro
---
const LazyComponent = await import('./HeavyComponent.astro');
---
<LazyComponent.default />
```

### 脚本优化
```astro
<script>
  // 客户端交互
  // 保持脚本最小化
</script>

<script is:inline>
  // 仅在必要时使用
</script>
```

---

## 可访问性

### 语义化 HTML
```astro
<nav>...</nav>
<main>...</main>
<aside>...</aside>
<footer>...</footer>
```

### ARIA 属性
```html
<button
  aria-label="关闭弹窗"
  aria-expanded={isOpen}
>
  <svg>...</svg>
</button>
```

### 键盘导航
```css
button:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```

---

## 响应式设计

### 断点系统
```css
/* Desktop (默认) */

@media (max-width: 1200px) {
  /* Large Tablet */
}

@media (max-width: 1024px) {
  /* Tablet */
}

@media (max-width: 768px) {
  /* Mobile */
}

@media (max-width: 480px) {
  /* Small Mobile */
}
```

### 移动优先策略
```css
.component {
  /* 移动端样式 */
}

@media (min-width: 768px) {
  .component {
    /* 平板及以上样式 */
  }
}
```

---

## Git 提交规范 (建议)

```
feat: 添加新功能
fix: 修复 bug
style: 样式调整 (不影响功能)
refactor: 代码重构
perf: 性能优化
docs: 文档更新
test: 测试相关
chore: 构建/工具相关
```

---

## 常见任务

### 添加新组件
1. 在 `src/components/` 创建 `.astro` 文件
2. 定义 `Props` 接口
3. 使用设计令牌编写样式
4. 导入并使用组件

### 修改全局样式
1. 编辑 `src/styles/global.css`
2. 更新设计令牌（如果需要）
3. 验证所有页面兼容性

### 添加新页面
1. 在 `src/pages/` 创建 `.astro` 文件
2. 导入必要的组件和布局
3. 使用 `<style is:global>` 添加页面级样式

### 修复 lint 错误
```bash
npm run lint:fix
```

---

## 重要提醒

1. **不要使用 `any` 类型**
2. **不要硬编码颜色/尺寸** - 使用设计令牌
3. **不要删除已有的测试** (如果添加了测试)
4. **运行 `npm run lint` 和 `npm run type-check` 后再提交**
5. **组件文件名使用 PascalCase** (如 `CTAButton.astro`)
6. **使用中文注释和描述**

---

## 项目特定约定

### 组件复用
- 优先使用现有组件 (`CTAButton`, `TechTag`, `SectionLabel`, `DecoNumber`)
- 新组件必须遵循相同的设计模式

### 数据获取
- 使用 `getCollection()` 获取博客文章
- 使用 `getEntry()` 获取单篇文章
- 使用 `await` 进行异步操作

### SEO 优化
- 每个页面必须有 `<title>` 和 `<meta name="description">`
- 使用语义化 HTML 标签
- 添加适当的 `<link>` 标签 (字体、预加载)

---

## 联系信息

- **作者**: 杨慎龙
- **邮箱**: xgg000303@163.com
- **GitHub**: https://github.com/yangshenlong
