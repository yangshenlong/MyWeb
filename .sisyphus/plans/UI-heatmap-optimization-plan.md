# UI布局优化与热力图系统重构计划

**创建日期**: 2026-01-11  
**作者**: Planner Agent  
**最后更新**: 2026-01-11 (根据用户反馈优化)

---

## 用户需求确认 ✅

| 需求项 | 选择 |
|--------|------|
| 统计指标优先级 | 🏆 **总文章数、活跃天数** (最重要) |
| 实施方式 | 📦 **分阶段实施** (先热力图 → 后UI优化) |
| 时区设置 | 🕐 Asia/Shanghai (UTC+8) |
| 数据统计范围 | 📊 pubDate + updatedDate (发布+更新) |

---

## 一、项目概述

### 1.1 当前状态分析

#### 热力图系统 (ContributionGraph.astro)
- ❌ **使用模拟数据** (第26-42行): `generateContributionData()` 函数生成随机数据
- ❌ **未连接真实博客数据**: 没有从 `getCollection('blog')` 获取实际文章数据
- ❌ **统计不准确**: 显示的总贡献、最长连续等数据均为随机生成
- ✅ **UI效果良好**: Glassmorphism风格完善，暗色主题适配良好

#### UI布局问题
- ⚠️ **单位不一致**: about.astro (line 269) 和 blog.astro (line 275) 使用 `180px` 固定值
- ⚠️ **玻璃模糊不一致**: HeaderArchitectural 使用 25px，GlassCard 使用 30px
- ⚠️ **间距系统不统一**: 各组件 grid gap 值不统一 (2em vs 2.5em vs 1.5em)
- ⚠️ **页脚样式重复**: 每个页面都定义了内联 `.arch-footer` 样式

### 1.2 目标

#### 阶段 1 (优先): 热力图系统
- ✅ 基于真实博客更新数据（pubDate, updatedDate）
- ✅ **重点显示**: 总文章数、活跃天数
- ✅ 显示博客活动（发布、更新）
- ✅ 准确的统计数据
- ✅ 悬停显示当天发布的文章列表
- ✅ 支持暗色/亮色主题

#### 阶段 2: UI布局优化
- 统一使用 `em` 单位
- 标准化玻璃模糊效果 (30px)
- 建立统一的间距系统
- 消除重复代码
- 创建可复用的 Section 组件

---

## 二、阶段1: 热力图系统重构

### 2.1 数据层实现

#### 2.1.1 类型定义

```typescript
// src/types/activity.ts (新建)
export type ActivityType = 'publication' | 'update' | 'draft';

export interface BlogActivity {
  date: string;           // YYYY-MM-DD 格式
  type: ActivityType;
  postId: string;
  postTitle: string;
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

#### 2.1.2 数据聚合工具

```typescript
// src/utils/activity-aggregator.ts (新建)

import { getCollection } from 'astro:content';

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

#### 2.1.3 统计计算工具

```typescript
// src/utils/stats-calculator.ts (新建)

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

### 2.2 热力图组件实现

```astro
---
// src/components/BlogActivityHeatmap.astro (新建)

import { getCollection } from 'astro:content';
import { aggregateBlogActivity } from '../utils/activity-aggregator';
import { calculateBlogStats } from '../utils/stats-calculator';

interface Props {
  collection?: string;
  weeks?: number;
  showStats?: boolean;
  includeUpdates?: boolean;
  theme?: 'light' | 'dark';
  class?: string;
}

const {
  collection = 'blog',
  weeks = 52,
  showStats = true,
  includeUpdates = true,
  theme = 'dark',
  class: className = ''
} = Astro.props;

// 获取并处理数据
const activityMap = await aggregateBlogActivity({ weeks, includeUpdates });
const stats = calculateBlogStats(activityMap);

// 转换为热力图格式
const activityData = Array.from(activityMap.entries())
  .filter(([_, data]) => data.count > 0)
  .map(([date, data]) => ({
    date,
    count: data.count,
    publications: data.publications,
    updates: data.updates,
    posts: data.posts
  }));

const maxCount = Math.max(...activityData.map(d => d.count), 1);

// 月份和星期标签
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// 获取每周的起始月份
function getWeekMonths(weeksCount: number): (number | null)[] {
  const result: (number | null)[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(
