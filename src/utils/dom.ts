/**
 * DOM 操作工具函数
 * 提供常用的 DOM 操作和事件处理工具
 */

/**
 * 安全地获取 DOM 元素
 * @param selector - CSS 选择器
 * @param parent - 父元素，默认为 document
 * @returns 找到的元素或 null
 * @example
 * getElement('#my-element')
 * getElement('.my-class', parentElement)
 */
export function getElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * 获取所有匹配的 DOM 元素
 * @param selector - CSS 选择器
 * @param parent - 父元素，默认为 document
 * @returns 匹配的元素数组
 * @example
 * getElements('.my-class')
 */
export function getElements<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent: HTMLElement | Document = document
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/**
 * 为元素添加类名
 * @param element - 目标元素
 * @param classNames - 要添加的类名
 * @example
 * addClass(element, 'foo', 'bar')
 */
export function addClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.add(...classNames);
}

/**
 * 从元素移除类名
 * @param element - 目标元素
 * @param classNames - 要移除的类名
 * @example
 * removeClass(element, 'foo', 'bar')
 */
export function removeClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.remove(...classNames);
}

/**
 * 切换元素的类名
 * @param element - 目标元素
 * @param className - 要切换的类名
 * @param force - 是否强制添加/移除
 * @returns 类名是否存在
 * @example
 * toggleClass(element, 'active')
 */
export function toggleClass(
  element: HTMLElement,
  className: string,
  force?: boolean
): boolean {
  return element.classList.toggle(className, force);
}

/**
 * 检查元素是否包含指定类名
 * @param element - 目标元素
 * @param className - 要检查的类名
 * @returns 是否包含类名
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * 防抖函数
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 * @example
 * const debouncedSearch = debounce(() => search(), 300)
 * input.addEventListener('input', debouncedSearch)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 * @param func - 要节流的函数
 * @param limit - 限制时间（毫秒）
 * @returns 节流后的函数
 * @example
 * const throttledScroll = throttle(() => handleScroll(), 100)
 * window.addEventListener('scroll', throttledScroll)
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 平滑滚动到指定位置
 * @param target - 目标元素或 Y 坐标
 * @param offset - 偏移量，默认为 0
 * @example
 * smoothScrollTo(element, 100)
 * smoothScrollTo(0) // 滚动到顶部
 */
export function smoothScrollTo(
  target: number | HTMLElement,
  offset = 0
): void {
  const y = typeof target === 'number' ? target : target.offsetTop + offset;
  window.scrollTo({
    top: y,
    behavior: 'smooth'
  });
}

/**
 * 检查元素是否在视口中
 * @param element - 目标元素
 * @param threshold - 阈值（0-1），默认为 0
 * @returns 是否在视口中
 */
export function isInViewport(element: HTMLElement, threshold = 0): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const vertInView = rect.top <= windowHeight * (1 - threshold) && rect.top + rect.height >= 0;
  const horInView = rect.left <= windowWidth && rect.left + rect.width >= 0;

  return vertInView && horInView;
}

/**
 * 设置元素属性
 * @param element - 目标元素
 * @param attributes - 属性键值对
 * @example
 * setAttributes(element, { 'aria-label': 'Close', 'role': 'button' })
 */
export function setAttributes(
  element: HTMLElement,
  attributes: Record<string, string>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

/**
 * 获取元素的文本内容
 * @param element - 目标元素
 * @returns 文本内容
 */
export function getTextContent(element: HTMLElement): string {
  return element.textContent?.trim() || '';
}

/**
 * 设置元素的文本内容
 * @param element - 目标元素
 * @param text - 文本内容
 */
export function setTextContent(element: HTMLElement, text: string): void {
  element.textContent = text;
}

/**
 * 创建带命名空间的元素（用于 SVG）
 * @param tag - 标签名
 * @param attributes - 属性键值对
 * @returns 创建的元素
 */
export function createSVGElement(
  tag: string,
  attributes: Record<string, string> = {}
): SVGElement {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}
