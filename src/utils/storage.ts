/**
 * 本地存储工具函数
 * 提供类型安全的 localStorage 和 sessionStorage 操作
 */

/**
 * 存储错误类型
 */
export class StorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * 安全地解析 JSON
 * @param json - JSON 字符串
 * @param defaultValue - 解析失败时的默认值
 * @returns 解析后的对象或默认值
 */
function safeParse<T>(json: string | null, defaultValue: T): T {
  if (json === null) return defaultValue;

  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * LocalStorage 工具类
 * 提供类型安全的 localStorage 操作
 * @example
 * LocalStorage.set('user', { name: 'Alice' })
 * const user = LocalStorage.get<User>('user')
 * LocalStorage.remove('user')
 */
export class LocalStorage {
  /**
   * 获取存储的数据
   * @param key - 存储键名
   * @param defaultValue - 默认值
   * @returns 存储的值或默认值
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue ?? null;

    try {
      const item = window.localStorage.getItem(key);
      return safeParse<T>(item, defaultValue ?? (null as T));
    } catch (error) {
      console.warn(`Failed to get from localStorage: ${key}`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * 设置存储数据
   * @param key - 存储键名
   * @param value - 要存储的值
   * @returns 是否成功
   */
  static set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set to localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * 移除存储数据
   * @param key - 存储键名
   * @returns 是否成功
   */
  static remove(key: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * 清空所有存储数据
   * @returns 是否成功
   */
  static clear(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage', error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   * @param key - 存储键名
   * @returns 是否存在
   */
  static has(key: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * 获取所有键
   * @returns 键数组
   */
  static keys(): string[] {
    if (typeof window === 'undefined') return [];

    try {
      return Object.keys(window.localStorage);
    } catch {
      return [];
    }
  }

  /**
   * 获取存储大小（字节）
   * @returns 存储大小
   */
  static size(): number {
    if (typeof window === 'undefined') return 0;

    try {
      let size = 0;
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          size += window.localStorage[key].length + key.length;
        }
      }
      return size;
    } catch {
      return 0;
    }
  }
}

/**
 * SessionStorage 工具类
 * 提供类型安全的 sessionStorage 操作
 * @example
 * SessionStorage.set('temp', { data: 'test' })
 * const temp = SessionStorage.get<{ data: string }>('temp')
 */
export class SessionStorage {
  /**
   * 获取存储的数据
   * @param key - 存储键名
   * @param defaultValue - 默认值
   * @returns 存储的值或默认值
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue ?? null;

    try {
      const item = window.sessionStorage.getItem(key);
      return safeParse<T>(item, defaultValue ?? (null as T));
    } catch (error) {
      console.warn(`Failed to get from sessionStorage: ${key}`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * 设置存储数据
   * @param key - 存储键名
   * @param value - 要存储的值
   * @returns 是否成功
   */
  static set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;

    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set to sessionStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * 移除存储数据
   * @param key - 存储键名
   * @returns 是否成功
   */
  static remove(key: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from sessionStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * 清空所有存储数据
   * @returns 是否成功
   */
  static clear(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      window.sessionStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear sessionStorage', error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   * @param key - 存储键名
   * @returns 是否存在
   */
  static has(key: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return window.sessionStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * 获取所有键
   * @returns 键数组
   */
  static keys(): string[] {
    if (typeof window === 'undefined') return [];

    try {
      return Object.keys(window.sessionStorage);
    } catch {
      return [];
    }
  }
}

/**
 * Cookie 工具类
 * 提供操作 cookie 的方法
 * @example
 * Cookie.set('theme', 'dark', { days: 7 })
 * const theme = Cookie.get('theme')
 * Cookie.remove('theme')
 */
export class Cookie {
  /**
   * 设置 cookie
   * @param key - cookie 名称
   * @param value - cookie 值
   * @param options - 选项
   */
  static set(key: string, value: string, options: { days?: number; path?: string } = {}): void {
    if (typeof document === 'undefined') return;

    const { days = 7, path = '/' } = options;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `${key}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=${path}`;
  }

  /**
   * 获取 cookie
   * @param key - cookie 名称
   * @returns cookie 值或 null
   */
  static get(key: string): string | null {
    if (typeof document === 'undefined') return null;

    const encodedKey = encodeURIComponent(key);
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const parts = cookie.trim().split('=');
      const cookieKey = parts[0];
      const cookieValue = parts.slice(1).join('=');
      if (cookieKey === encodedKey) {
        return decodeURIComponent(cookieValue);
      }
    }

    return null;
  }

  /**
   * 移除 cookie
   * @param key - cookie 名称
   * @param path - 路径
   */
  static remove(key: string, path = '/'): void {
    if (typeof document === 'undefined') return;

    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
  }

  /**
   * 检查 cookie 是否存在
   * @param key - cookie 名称
   * @returns 是否存在
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 获取所有 cookie
   * @returns cookie 键值对对象
   */
  static getAll(): Record<string, string> {
    if (typeof document === 'undefined') return {};

    const cookies: Record<string, string> = {};
    const cookieStrings = document.cookie.split(';');

    for (const cookie of cookieStrings) {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookies[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }

    return cookies;
  }
}
