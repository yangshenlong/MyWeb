/**
 * 共享类型定义
 * 项目中使用的通用类型定义
 */

import type { ImageMetadata } from 'astro';

/**
 * 作者信息
 */
export interface Author {
  name: string;
  email?: string;
  url?: string;
  avatar?: string | ImageMetadata;
}

/**
 * 博客文章
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  publishDate: Date;
  updateDate?: Date;
  tags: string[];
  category?: string;
  author: Author;
  heroImage?: string | ImageMetadata;
  draft?: boolean;
  featured?: boolean;
  readingTime?: number;
}

/**
 * 博客文章集合（从 Astro content 获取）
 */
export interface BlogPostCollection {
  id: string;
  slug: string;
  body: string;
  collection: string;
  data: {
    title: string;
    description: string;
    publishDate: Date;
    updateDate?: Date;
    tags: string[];
    category?: string;
    draft?: boolean;
    featured?: boolean;
    heroImage?: string | ImageMetadata;
  };
}

/**
 * 项目作品
 */
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  thumbnail: string | ImageMetadata;
  images?: Array<string | ImageMetadata>;
  tags: string[];
  demoUrl?: string;
  repoUrl?: string;
  featured: boolean;
  order?: number;
}

/**
 * 技能标签
 */
export interface Skill {
  name: string;
  category?: string;
  level?: number; // 1-5
  years?: number;
}

/**
 * 社交链接
 */
export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  ariaLabel?: string;
}

/**
 * 导航项
 */
export interface NavItem {
  title: string;
  href: string;
  ariaLabel?: string;
  children?: NavItem[];
}

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  ariaLabel?: string;
}

/**
 * 组件 Props 基础类型
 */
export interface ComponentProps {
  className?: string;
  ariaLabel?: string;
  id?: string;
}

/**
 * SEO 相关 Props
 */
export interface SEOProps {
  title: string;
  description: string;
  image?: string | ImageMetadata;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * 动画配置
 */
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

/**
 * 动画预设
 */
export interface AnimationPreset {
  fadeIn: AnimationConfig;
  slideUp: AnimationConfig;
  slideDown: AnimationConfig;
  slideLeft: AnimationConfig;
  slideRight: AnimationConfig;
  scale: AnimationConfig;
}

/**
 * Toast 消息类型
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast 配置
 */
export interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  title: string;
  excerpt: string;
  url: string;
  meta?: string;
}

/**
 * 评论配置（Giscus）
 */
export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: string;
  strict?: string;
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: 'top' | 'bottom';
  theme?: string;
  lang?: string;
}

/**
 * 阅读时间配置
 */
export interface ReadingTimeConfig {
  wordsPerMinute?: number;
  imagesPerMinute?: number;
}

/**
 * 代码块配置
 */
export interface CodeBlockConfig {
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  highlightLanguage?: boolean;
  collapsible?: boolean;
  maxLines?: number;
}

/**
 * 图片配置
 */
export interface ImageConfig {
  src: string | ImageMetadata;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  placeholder?: 'blur' | 'empty';
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

/**
 * 表单字段
 */
export interface FormField {
  name: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: (value: string) => boolean | string;
}

/**
 * 表单状态
 */
export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * API 响应基础类型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 分页数据
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 日期范围
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * 统计数据
 */
export interface Statistics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

/**
 * 用户活动
 */
export interface UserActivity {
  date: Date;
  count: number;
  type: 'commit' | 'post' | 'comment' | 'other';
}

/**
 * 推荐文章权重
 */
export interface RecommendationWeight {
  tagMatch: number;
  categoryMatch: number;
  recency: number;
}

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
}

/**
 * 阻尼滚动配置
 */
export interface ScrollConfig {
  smooth?: boolean;
  offset?: number;
  behavior?: ScrollBehavior;
}

/**
 * 媒体查询断点
 */
export interface Breakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

/**
 * 响应式值
 */
export type ResponsiveValue<T> = T | Partial<Record<keyof Breakpoints, T>>;

/**
 * 事件监听器选项
 */
export interface EventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}

/**
 * 动画方向
 */
export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'fade';

/**
 * 位置
 */
export type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * 对齐方式
 */
export type Alignment = 'start' | 'center' | 'end' | 'stretch';

/**
 * 尺寸
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * 颜色变体
 */
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

/**
 * 按钮变体
 */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

/**
 * 卡片阴影
 */
export type CardShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';
