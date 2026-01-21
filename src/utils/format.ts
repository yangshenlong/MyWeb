/**
 * 格式化工具函数
 * 提供日期、数字、文本等格式化功能
 */

/**
 * 日期格式化配置
 */
export type DateFormat =
  | 'full' // 2024年1月20日 星期六
  | 'long' // 2024年1月20日
  | 'medium' // 2024-01-20
  | 'short' // 01/20
  | 'relative'; // 3天前

/**
 * 格式化日期
 * @param date - 日期对象或时间戳
 * @param locale - 地区代码，默认为 'zh-CN'
 * @param format - 格式类型
 * @returns 格式化后的日期字符串
 * @example
 * formatDate(new Date()) // '2024年1月20日'
 * formatDate(new Date(), 'zh-CN', 'short') // '01/20'
 */
export function formatDate(
  date: Date | number | string,
  locale = 'zh-CN',
  format: DateFormat = 'long'
): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);

  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }

  const options: Intl.DateTimeFormatOptions = {
    full: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    },
    short: {
      month: '2-digit',
      day: '2-digit'
    }
  }[format];

  return dateObj.toLocaleDateString(locale, options);
}

/**
 * 格式化相对日期（如"3天前"）
 * @param date - 日期对象
 * @returns 相对日期字符串
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    年: 31536000,
    月: 2592000,
    周: 604800,
    天: 86400,
    小时: 3600,
    分钟: 60
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval}${unit}前`;
    }
  }

  return '刚刚';
}

/**
 * 格式化数字（添加千位分隔符）
 * @param num - 数字
 * @param locale - 地区代码，默认为 'zh-CN'
 * @returns 格式化后的数字字符串
 * @example
 * formatNumber(1234567) // '1,234,567'
 * formatNumber(1234.56, 'en-US') // '1,234.56'
 */
export function formatNumber(num: number, locale = 'zh-CN'): string {
  return num.toLocaleString(locale);
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的文件大小字符串
 * @example
 * formatFileSize(1536) // '1.5 KB'
 * formatFileSize(1048576) // '1 MB'
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const threshold = 1024;

  if (bytes < threshold) return `${bytes} B`;

  let unitIndex = 0;
  let size = bytes;

  while (size >= threshold && unitIndex < units.length - 1) {
    size /= threshold;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 格式化时长（秒转为可读格式）
 * @param seconds - 秒数
 * @returns 格式化后的时长字符串
 * @example
 * formatDuration(3661) // '1小时1分1秒'
 * formatDuration(125) // '2分5秒'
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);

  return parts.join('');
}

/**
 * 截断文本
 * @param text - 原始文本
 * @param maxLength - 最大长度
 * @param suffix - 后缀，默认为 '...'
 * @returns 截断后的文本
 * @example
 * truncateText('This is a long text', 10) // 'This is a...'
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 将文本转换为 URL 友好的 slug
 * @param text - 原始文本
 * @returns slug 字符串
 * @example
 * slugify('Hello World!') // 'hello-world'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 首字母大写
 * @param text - 原始文本
 * @returns 首字母大写的文本
 * @example
 * capitalize('hello world') // 'Hello world'
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * 标题格式化（每个单词首字母大写）
 * @param text - 原始文本
 * @returns 标题格式的文本
 * @example
 * titleCase('hello world') // 'Hello World'
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * 高亮搜索关键词
 * @param text - 原始文本
 * @param keyword - 关键词
 * @param highlightClass - 高亮 CSS 类名
 * @returns 带高亮标记的 HTML 字符串
 * @example
 * highlightSearch('This is a test', 'test', 'highlight')
 * // 'This is a <span class="highlight">test</span>'
 */
export function highlightSearch(
  text: string,
  keyword: string,
  highlightClass = 'highlight'
): string {
  if (!keyword.trim()) return text;

  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
}

/**
 * 格式化阅读时间
 * @param wordCount - 字数
 * @param wordsPerMinute - 每分钟阅读字数，默认为 200（中文）
 * @returns 阅读时间字符串
 * @example
 * formatReadingTime(800) // '4分钟'
 */
export function formatReadingTime(wordCount: number, wordsPerMinute = 200): string {
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes}分钟`;
}

/**
 * 格式化百分比
 * @param value - 数值
 * @param total - 总数
 * @param decimals - 小数位数，默认为 0
 * @returns 百分比字符串
 * @example
 * formatPercentage(75, 100) // '75%'
 * formatPercentage(1, 3, 2) // '33.33%'
 */
export function formatPercentage(value: number, total: number, decimals = 0): string {
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * 格式化货币
 * @param amount - 金额
 * @param currency - 货币代码，默认为 'CNY'
 * @param locale - 地区代码，默认为 'zh-CN'
 * @returns 格式化后的货币字符串
 * @example
 * formatCurrency(1234.56) // '¥1,234.56'
 */
export function formatCurrency(
  amount: number,
  currency = 'CNY',
  locale = 'zh-CN'
): string {
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency
  });
}
