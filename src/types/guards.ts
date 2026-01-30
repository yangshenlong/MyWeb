/**
 * 类型守卫（Type Guards）
 * 用于运行时类型检查和类型断言
 */

import type { Author, BlogPost, Project, SocialLink } from './index.js';

/**
 * 检查是否为作者对象
 * @param obj - 待检查的对象
 * @returns 是否为作者对象
 */
export function isAuthor(obj: unknown): obj is Author {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof obj.name === 'string'
  );
}

/**
 * 检查是否为博客文章
 * @param obj - 待检查的对象
 * @returns 是否为博客文章
 */
export function isBlogPost(obj: unknown): obj is BlogPost {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'slug' in obj &&
    'title' in obj &&
    'description' in obj &&
    'content' in obj &&
    'publishDate' in obj &&
    'tags' in obj &&
    'author' in obj &&
    Array.isArray((obj as BlogPost).tags) &&
    isAuthor((obj as BlogPost).author)
  );
}

/**
 * 检查是否为项目对象
 * @param obj - 待检查的对象
 * @returns 是否为项目对象
 */
export function isProject(obj: unknown): obj is Project {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'slug' in obj &&
    'title' in obj &&
    'description' in obj &&
    'thumbnail' in obj &&
    'tags' in obj &&
    'featured' in obj
  );
}

/**
 * 检查是否为社交链接
 * @param obj - 待检查的对象
 * @returns 是否为社交链接
 */
export function isSocialLink(obj: unknown): obj is SocialLink {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'url' in obj &&
    'icon' in obj &&
    typeof obj.name === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.icon === 'string'
  );
}

/**
 * 检查是否为字符串
 * @param value - 待检查的值
 * @returns 是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 检查是否为数字
 * @param value - 待检查的值
 * @returns 是否为数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 检查是否为布尔值
 * @param value - 待检查的值
 * @returns 是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 检查是否为数组
 * @param value - 待检查的值
 * @returns 是否为数组
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 检查是否为对象（非 null、非数组）
 * @param value - 待检查的值
 * @returns 是否为对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 检查是否为函数
 * @param value - 待检查的值
 * @returns 是否为函数
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * 检查是否为日期对象
 * @param value - 待检查的值
 * @returns 是否为日期对象
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 检查是否为有效日期字符串
 * @param value - 待检查的值
 * @returns 是否为有效日期字符串
 */
export function isValidDateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * 检查是否为 Promise
 * @param value - 待检查的值
 * @returns 是否为 Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isObject(value) && 'then' in value && isFunction(value.then))
  );
}

/**
 * 检查是否为错误对象
 * @param value - 待检查的值
 * @returns 是否为错误对象
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * 检查是否为空字符串
 * @param value - 待检查的值
 * @returns 是否为空字符串
 */
export function isEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length === 0;
}

/**
 * 检查是否为非空字符串
 * @param value - 待检查的值
 * @returns 是否为非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * 检查是否为空数组
 * @param value - 待检查的值
 * @returns 是否为空数组
 */
export function isEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length === 0;
}

/**
 * 检查是否为非空数组
 * @param value - 待检查的值
 * @returns 是否为非空数组
 */
export function isNonEmptyArray<T = unknown>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * 检查是否为空对象
 * @param value - 待检查的值
 * @returns 是否为空对象
 */
export function isEmptyObject(value: unknown): boolean {
  return isObject(value) && Object.keys(value).length === 0;
}

/**
 * 检查是否为 null 或 undefined
 * @param value - 待检查的值
 * @returns 是否为 null 或 undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 检查是否为非 nullish 值
 * @param value - 待检查的值
 * @returns 是否为非 nullish 值
 */
export function isNonNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 检查是否为有效的 URL 字符串
 * @param value - 待检查的值
 * @returns 是否为有效 URL
 */
export function isValidUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查是否为有效的邮箱地址
 * @param value - 待检查的值
 * @returns 是否为有效邮箱
 */
export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 检查键是否存在于对象中
 * @param obj - 对象
 * @param key - 键名
 * @returns 键是否存在
 */
export function hasKey<T extends object>(
  obj: T,
  key: string | number | symbol
): key is keyof T {
  return key in obj;
}

/**
 * 断言值不为 null 或 undefined
 * @param value - 值
 * @param message - 错误消息
 * @throws 如果值为 null 或 undefined
 */
export function assertNonNullish<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? `Expected value to be non-nullish, got ${value}`);
  }
}

/**
 * 断言值为指定类型
 * @param value - 值
 * @param guard - 类型守卫函数
 * @param message - 错误消息
 * @throws 如果值不符合类型
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message ?? `Expected value to pass type guard, got ${value}`);
  }
}

/**
 * 窄化联合类型
 * @param value - 值
 * @param candidates - 可能的候选值
 * @returns 是否为候选值之一
 */
export function isOneOf<T extends U, U>(value: T | U, candidates: readonly T[]): value is T {
  return candidates.includes(value as T);
}

/**
 * 检查是否为类数组对象
 * @param value - 待检查的值
 * @returns 是否为类数组对象
 */
export function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  return (
    isObject(value) &&
    'length' in value &&
    isNumber((value as Record<string, unknown>)['length']) &&
    (value as Record<string, unknown>)['length'] as number >= 0
  );
}

/**
 * 检查是否为可迭代对象
 * @param value - 待检查的值
 * @returns 是否为可迭代对象
 */
export function isIterable<T = unknown>(value: unknown): value is Iterable<T> {
  return isObject(value) && Symbol.iterator in value;
}

/**
 * 检查是否为纯对象（由 Object 构造函数创建或对象字面量）
 * @param value - 待检查的值
 * @returns 是否为纯对象
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * 检查是否为整数字符串
 * @param value - 待检查的值
 * @returns 是否为整数字符串
 */
export function isIntegerString(value: unknown): value is string {
  if (!isString(value)) return false;
  return /^-?\d+$/.test(value);
}

/**
 * 检查是否为浮点数字符串
 * @param value - 待检查的值
 * @returns 是否为浮点数字符串
 */
export function isFloatString(value: unknown): value is string {
  if (!isString(value)) return false;
  return /^-?\d+\.\d+$/.test(value);
}

/**
 * 检查是否为数字字符串
 * @param value - 待检查的值
 * @returns 是否为数字字符串
 */
export function isNumericString(value: unknown): value is string {
  return isIntegerString(value) || isFloatString(value);
}

/**
 * 检查是否为有效的 JSON 字符串
 * @param value - 待检查的值
 * @returns 是否为有效 JSON
 */
export function isJsonString(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查对象是否具有指定的属性
 * @param obj - 对象
 * @param keys - 属性键数组
 * @returns 是否具有所有指定属性
 */
export function hasProperties<T extends object>(
  obj: T,
  keys: (string | number | symbol)[]
): boolean {
  return keys.every((key) => key in obj);
}

/**
 * 检查是否为 DOM 元素
 * @param value - 待检查的值
 * @returns 是否为 DOM 元素
 */
export function isElement(value: unknown): value is Element {
  return value instanceof Element;
}

/**
 * 检查是否为 HTMLElement
 * @param value - 待检查的值
 * @returns 是否为 HTMLElement
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * 检查是否为事件对象
 * @param value - 待检查的值
 * @returns 是否为事件对象
 */
export function isEvent(value: unknown): value is Event {
  return value instanceof Event;
}

/**
 * 检查是否为节点列表
 * @param value - 待检查的值
 * @returns 是否为节点列表
 */
export function isNodeList(value: unknown): value is NodeList {
  return value instanceof NodeList;
}

/**
 * 检查是否为 HTML 集合
 * @param value - 待检查的值
 * @returns 是否为 HTML 集合
 */
export function isHTMLCollection(value: unknown): value is HTMLCollection {
  return value instanceof HTMLCollection;
}
