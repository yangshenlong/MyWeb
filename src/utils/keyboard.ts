/**
 * 快捷键系统
 * 提供全局快捷键注册和管理
 */

import type { ShortcutConfig } from '../types/index.js';

/**
 * 快捷键管理器
 */
class ShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private enabled = true;

  /**
   * 注册快捷键
   * @param config - 快捷键配置
   * @returns 取消注册的函数
   */
  register(config: ShortcutConfig): () => void {
    const key = this.formatKey(config);

    if (this.shortcuts.has(key)) {
      console.warn(`快捷键 ${key} 已存在，将被覆盖`);
    }

    this.shortcuts.set(key, config);

    // 返回取消注册函数
    return () => this.unregister(key);
  }

  /**
   * 取消注册快捷键
   * @param key - 快捷键
   */
  unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  /**
   * 格式化快捷键
   * @param config - 快捷键配置
   * @returns 格式化后的快捷键字符串
   */
  private formatKey(config: ShortcutConfig): string {
    const parts: string[] = [];

    if (config.ctrl) parts.push('ctrl');
    if (config.shift) parts.push('shift');
    if (config.alt) parts.push('alt');
    if (config.meta) parts.push('meta');

    parts.push(config.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * 检查按键是否匹配快捷键
   * @param event - 键盘事件
   * @param config - 快捷键配置
   * @returns 是否匹配
   */
  private matches(event: KeyboardEvent, config: ShortcutConfig): boolean {
    const keyMatches = event.key.toLowerCase() === config.key.toLowerCase();
    const ctrlMatches = event.ctrlKey === (config.ctrl ?? false);
    const shiftMatches = event.shiftKey === (config.shift ?? false);
    const altMatches = event.altKey === (config.alt ?? false);
    const metaMatches = event.metaKey === (config.meta ?? false);

    return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
  }

  /**
   * 处理键盘事件
   * @param event - 键盘事件
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return;

    // 检查是否在输入框中
    const target = event.target as HTMLElement;
    const isInInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true';

    // 如果在输入框中且没有明确允许，则不触发快捷键
    if (isInInput) {
      // 某些快捷键在输入框中也应该生效（如 Esc）
      if (event.key !== 'Escape') return;
    }

    // 查找匹配的快捷键
    for (const config of this.shortcuts.values()) {
      if (this.matches(event, config)) {
        event.preventDefault();
        event.stopPropagation();
        config.handler();
        break;
      }
    }
  };

  /**
   * 启用快捷键系统
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用快捷键系统
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 清空所有快捷键
   */
  clear(): void {
    this.shortcuts.clear();
  }

  /**
   * 获取所有已注册的快捷键
   * @returns 快捷键配置数组
   */
  getAll(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 初始化快捷键系统
   */
  init(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * 销毁快捷键系统
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  }
}

// 创建全局实例
let shortcutManager: ShortcutManager | null = null;

/**
 * 获取快捷键管理器实例
 */
export function getShortcutManager(): ShortcutManager {
  if (!shortcutManager) {
    shortcutManager = new ShortcutManager();
    if (typeof document !== 'undefined') {
      shortcutManager.init();
    }
  }
  return shortcutManager;
}

/**
 * 注册快捷键
 * @param config - 快捷键配置
 * @returns 取消注册的函数
 * @example
 * registerShortcut({
 *   key: 'k',
 *   ctrl: true,
 *   description: '打开搜索',
 *   handler: () => openSearch()
 * })
 */
export function registerShortcut(config: ShortcutConfig): () => void {
  return getShortcutManager().register(config);
}

/**
 * 取消注册快捷键
 * @param key - 快捷键字符串（如 'ctrl+k'）
 */
export function unregisterShortcut(key: string): void {
  getShortcutManager().unregister(key);
}

/**
 * 格式化快捷键显示文本
 * @param config - 快捷键配置
 * @returns 格式化后的文本
 * @example
 * formatShortcut({ key: 'k', ctrl: true }) // 'Ctrl + K'
 */
export function formatShortcut(config: ShortcutConfig): string {
  const parts: string[] = [];

  if (config.ctrl) parts.push(isMac() ? '⌘' : 'Ctrl');
  if (config.shift) parts.push('Shift');
  if (config.alt) parts.push(isMac() ? 'Option' : 'Alt');
  if (config.meta) parts.push('⌘');

  // 格式化按键名
  let key = config.key;
  if (key === ' ') key = 'Space';
  key = key.charAt(0).toUpperCase() + key.slice(1);

  parts.push(key);

  return isMac() ? parts.join('') : parts.join(' + ');
}

/**
 * 检测是否为 Mac 系统
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
}

/**
 * 预定义的快捷键
 */
export const SHORTCUTS = {
  search: { key: 'k', ctrl: true, description: '打开搜索' },
  theme: { key: 't', ctrl: true, shift: true, description: '切换主题' },
  dark: { key: 'd', ctrl: true, shift: true, description: '切换暗色模式' },
  top: { key: 'home', ctrl: true, description: '返回顶部' },
  escape: { key: 'Escape', description: '关闭' },
  help: { key: '?', shift: true, description: '显示快捷键帮助' }
} as const;

/**
 * 快捷键提示组件需要的数据
 */
export interface ShortcutHelpItem {
  keys: string;
  description: string;
}

/**
 * 获取快捷键帮助列表
 * @param manager - 快捷键管理器
 * @returns 快捷键帮助列表
 */
export function getShortcutHelp(manager?: ShortcutManager): ShortcutHelpItem[] {
  const shortcuts = manager?.getAll() || getShortcutManager().getAll();

  return shortcuts.map((config) => ({
    keys: formatShortcut(config),
    description: config.description
  }));
}

// 导出类型
export type { ShortcutConfig };

// 导出单例（用于直接访问）
export { ShortcutManager };
