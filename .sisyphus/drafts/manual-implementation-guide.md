# 手动实施指南：热力图系统与UI优化

**作者**: Planner Agent  
**创建日期**: 2026-01-11  
**目标**: 指导用户手动完成 `UI-heatmap-optimization-plan.md` 中的两阶段任务。

---

## 📅 阶段 1: 热力图系统重构 (预计 6-8 小时)

### 步骤 1.1: 创建类型定义 (30min)

**目标**: 定义博客活动和统计数据的数据结构。

**文件**: `src/types/activity.ts` (新建)

**代码**:
```typescript
export type ActivityType = 'publication' | 'update' | 'draft';

export interface BlogActivity {
  date: string;           // YYYY-MM-DD 格式
  type: ActivityType;
  postId: string;
  postTitle: string;
  wordCount?: number;
  tags?: string[];
}

export interface BlogActivitySummary {
  date: string;
  count: number;          // 当天活动总数
  publications: number;   // 新发布数量
  updates: number;        // 更新数量
  posts: BlogActivity[];  // 当天所有活动详情
}

export interface BlogStats {
  // 🏆 核心指标 (用户优先)
  totalPosts: number;     // 总文章数
  activeDays: number;     // 活跃天数
  
  // 扩展指标
  currentStreak: number;  // 当前连续天数
  longestStreak: number;  // 最长连续天数
  averagePostsPerWeek: number; // 周均发布
  
  // 额外信息
  totalUpdates: number;   // 更新次数
  postsThisYear: number;  // 本年发布
}
```

---

### 步骤 1.2: 创建数据聚合工具 (2h)

**目标**: 从 `astro:content` 提取真实博客数据，并按日期聚合。

**文件**: `src/utils/activity-aggregator.ts` (新建)

**代码**:
```typescript
import { getCollection } from 'astro:content';
import type { BlogActivitySummary } from '../types/activity';

export interface ActivityAggregatorOptions {
  startDate?: Date;
  endDate?: Date;
  includeUpdates?: boolean;
  timezone?: string;
}

export async function aggregateBlogActivity(
  options: ActivityAggregatorOptions = {}
): Promise<Map<string, BlogActivitySummary>> {
  const {
    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 默认1年
    endDate = new Date(),
    includeUpdates = true,
    timezone = 'Asia/Shanghai'  // 用户确认: 东八区
  } = options;

  const posts = await getCollection('blog');
  const activityMap = new Map<string, BlogActivitySummary>();

  // 初始化所有日期
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = formatDateKey(current, timezone);
    activityMap.set(dateStr, {
      date: dateStr,
      count: 0,
      publications: 0,
      updates: 0,
      posts: []
    });
    current.setDate(current.getDate() + 1);
  }

  // 聚合文章数据
  for (const post of posts) {
    const pubDate = new Date(post.data.pubDate);
    
    // 新发布
    if (pubDate >= startDate && pubDate <= endDate) {
      const pubDateStr = formatDateKey(pubDate, timezone);
      const existing = activityMap.get(pubDateStr);
      if (existing) {
        existing.count++;
        existing.publications++;
        existing.posts.push({
          date: pubDateStr,
          type: 'publication',
          postId: post.id,
          postTitle: post.data.title,
          tags: post.data.tags
        });
      }
    }

    // 更新日期
    if (includeUpdates && post.data.updatedDate) {
      const updateDate = new Date(post.data.updatedDate);
      if (updateDate.getTime() !== pubDate.getTime() && 
          updateDate >= startDate && updateDate <= endDate) {
        const updateDateStr = formatDateKey(updateDate, timezone);
        const existing = activityMap.get(updateDateStr);
        if (existing) {
          existing.count++;
          existing.updates++;
          existing.posts.push({
            date: updateDateStr,
            type: 'update',
            postId: post.id,
            postTitle: post.data.title,
            tags: post.data.tags
          });
        }
      }
    }
  }

  return activityMap;
}

function formatDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date); // 返回 YYYY-MM-DD 格式
}
```

---

### 步骤 1.3: 创建统计计算工具 (1.5h)

**目标**: 基于聚合数据计算核心指标（总数、连续天数等）。

**文件**: `src/utils/stats-calculator.ts` (新建)

**代码**:
```typescript
import type { BlogStats } from '../types/activity';

export function calculateBlogStats(
  activityMap: Map<string, { count: number; publications: number; updates: number; posts: any[] }>
): BlogStats {
  const entries = Array.from(activityMap.entries())
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  // 🏆 核心指标
  const totalPosts = entries.reduce((sum, [_, data]) => sum + data.publications, 0);
  const activeDays = entries.length;

  // 扩展指标
  const totalUpdates = entries.reduce((sum, [_, data]) => sum + data.updates, 0);
  const daysInRange = activityMap.size;
  const averagePostsPerWeek = parseFloat(((totalPosts / daysInRange) * 7).toFixed(2));

  // 连续性统计
  const streakResult = calculateStreaks(entries);
  
  // 本年发布数
  const now = new Date();
  const thisYear = now.getFullYear();
  const postsThisYear = entries.filter(([dateStr]) => 
    dateStr.startsWith(thisYear.toString())
  ).reduce((sum, [_, data]) => sum + data.publications, 0);

  return {
    totalPosts,        // 🏆 核心
    activeDays,        // 🏆 核心
    currentStreak: streakResult.currentStreak,
    longestStreak: streakResult.longestStreak,
    averagePostsPerWeek,
    totalUpdates,
    postsThisYear
  };
}

function calculateStreaks(
  entries: [string, any][]
): { currentStreak: number; longestStreak: number } {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(entries[i - 1][0]);
      const currDate = new Date(entries[i][0]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    // 更新当前连续天数
    if (i === entries.length - 1) {
      currentStreak = tempStreak;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  return { currentStreak, longestStreak };
}
```

---

### 步骤 1.4: 实现热力图组件 (3h)

**目标**: 创建基于真实数据的可视化热力图。

**文件**: `src/components/BlogActivityHeatmap.astro` (新建)

**代码**:
*(请参考计划文件中的完整代码实现)*

---

### 步骤 1.5: 集成到页面 (30min)

**目标**: 将新组件替换旧组件。

**文件**: `src/pages/blog.astro` (修改)

**操作**:
1. 导入新组件：`import BlogActivityHeatmap from '../components/BlogActivityHeatmap.astro';`
2. 替换旧组件： `<BlogActivityHeatmap ... />`

---

## 📅 阶段 2: UI布局优化 (预计 5-6 小时)

### 步骤 2.1: 全局设计令牌 (1h)

**目标**: 建立统一的间距和样式系统。

**文件**: `src/styles/global.css` (修改)

**添加内容**:
```css
:root {
  /* 间距系统 */
  --space-xs: 0.25em; --space-sm: 0.5em; --space-md: 1em;
  --space-lg: 1.5em; --space-xl: 2em; --space-2xl: 3em;
  --space-3xl: 4em; --space-4xl: 6em; --space-5xl: 8em;

  /* 页面间距 */
  --section-padding-y: 8em;
  --section-padding-x: 4em;
  
  /* Grid Gap */
  --grid-gap: 2em;
  
  /* 玻璃效果 - 统一为30px */
  --glass-blur: 30px;
  --glass-opacity-bg: 0.02;
  --glass-opacity-border: 0.06;
}
```

---

### 步骤 2.2: 修复单位问题 (30min)

**目标**: 将固定像素值转换为计算值。

**文件**: `src/pages/about.astro` & `src/pages/blog.astro`

**修改**:
`padding: 180px ...` ➡️ `padding: calc(60px + 8em) ...`

---

### 步骤 2.3: 统一玻璃模糊 (30min)

**目标**: 所有玻璃效果使用相同参数。

**文件**: `src/components/HeaderArchitectural.astro`

**修改**:
`blur(25px)` ➡️ `blur(var(--glass-blur, 30px))`

---

### 步骤 2.4: 统一 Grid Gap (30min)

**文件**: `src/components/ProjectGridArchitectural.astro` & `src/pages/blog.astro`

**修改**:
`gap: 2.5em` / `gap: 1.5em` ➡️ `gap: var(--grid-gap, 2em)`

---

### 步骤 2.5: 创建 Section 组件 (1.5h)

**目标**: 统一页面分节的内边距。

**文件**: `src/components/Section.astro` (新建)

**代码**:
*(请参考计划文件中的完整代码实现)*

---

### 步骤 2.6: 统一页脚样式 (1h)

**目标**: 消除代码重复。

**文件**: `src/components/Footer.astro` (修改)

**操作**:
1. 将 `.arch-footer` 样式移动到 Footer 组件内
2. 从 `index.astro`, `about.astro`, `blog.astro` 删除重复样式

---

**按照此指南操作，即可分步完成所有优化任务！** 🚀
