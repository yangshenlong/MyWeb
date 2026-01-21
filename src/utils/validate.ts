/**
 * 验证工具函数
 * 提供常用的数据验证功能
 */

/**
 * 验证结果类型
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 验证邮箱地址
 * @param email - 邮箱地址
 * @returns 是否有效
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid') // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证 URL
 * @param url - URL 字符串
 * @returns 是否有效
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('not-a-url') // false
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证是否为 HTTPS URL
 * @param url - URL 字符串
 * @returns 是否为 HTTPS
 */
export function isHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 验证手机号（中国大陆）
 * @param phone - 手机号
 * @returns 是否有效
 * @example
 * isValidPhone('13800138000') // true
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证身份证号（中国大陆）
 * @param id - 身份证号
 * @returns 是否有效
 */
export function isValidIdCard(id: string): boolean {
  const idRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  return idRegex.test(id);
}

/**
 * 验证邮政编码（中国大陆）
 * @param code - 邮政编码
 * @returns 是否有效
 */
export function isValidPostalCode(code: string): boolean {
  const postalRegex = /^[1-9]\d{5}$/;
  return postalRegex.test(code);
}

/**
 * 验证 IP 地址（IPv4）
 * @param ip - IP 地址
 * @returns 是否有效
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * 验证 IP 地址（IPv6）
 * @param ip - IP 地址
 * @returns 是否有效
 */
export function isValidIPv6(ip: string): boolean {
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$/; // 简化版本
  return ipv6Regex.test(ip);
}

/**
 * 验证端口号
 * @param port - 端口号
 * @returns 是否有效
 */
export function isValidPort(port: number | string): boolean {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  return Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * 验证 MAC 地址
 * @param mac - MAC 地址
 * @returns 是否有效
 */
export function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

/**
 * 验证十六进制颜色值
 * @param color - 颜色值
 * @returns 是否有效
 * @example
 * isValidHexColor('#FF0000') // true
 * isValidHexColor('#F00') // true
 * isValidHexColor('red') // false
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  return hexRegex.test(color);
}

/**
 * 验证日期格式
 * @param date - 日期字符串
 * @returns 是否有效
 */
export function isValidDate(date: string): boolean {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * 验证是否为过去日期
 * @param date - 日期
 * @returns 是否为过去
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
}

/**
 * 验证是否为未来日期
 * @param date - 日期
 * @returns 是否为未来
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
}

/**
 * 验证字符串长度
 * @param str - 字符串
 * @param min - 最小长度
 * @param max - 最大长度
 * @returns 是否有效
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * 验证是否只包含字母
 * @param str - 字符串
 * @returns 是否只包含字母
 */
export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * 验证是否只包含字母和数字
 * @param str - 字符串
 * @returns 是否只包含字母和数字
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * 验证是否只包含数字
 * @param str - 字符串
 * @returns 是否只包含数字
 */
export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * 验证是否为整数
 * @param num - 数字
 * @returns 是否为整数
 */
export function isInteger(num: number): boolean {
  return Number.isInteger(num);
}

/**
 * 验证是否为正数
 * @param num - 数字
 * @returns 是否为正数
 */
export function isPositive(num: number): boolean {
  return num > 0;
}

/**
 * 验证是否为负数
 * @param num - 数字
 * @returns 是否为负数
 */
export function isNegative(num: number): boolean {
  return num < 0;
}

/**
 * 验证数字范围
 * @param num - 数字
 * @param min - 最小值
 * @param max - 最大值
 * @returns 是否在范围内
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 验证结果
 * @example
 * validatePassword('abc123') // { valid: false, message: '密码太弱' }
 */
export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少为 8 位' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需包含小写字母' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需包含大写字母' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: '密码需包含数字' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: '密码需包含特殊字符' };
  }

  return { valid: true };
}

/**
 * 清理和验证用户输入
 * @param input - 用户输入
 * @returns 清理后的字符串
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 验证是否为空值
 * @param value - 任意值
 * @returns 是否为空
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 验证是否为数组
 * @param value - 任意值
 * @returns 是否为数组
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 验证是否为对象
 * @param value - 任意值
 * @returns 是否为对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 验证是否为函数
 * @param value - 任意值
 * @returns 是否为函数
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * 验证是否为 Promise
 * @param value - 任意值
 * @returns 是否为 Promise
 */
export function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise || (isObject(value) && 'then' in value && isFunction(value.then));
}

/**
 * 验证是否为 Blob
 * @param value - 任意值
 * @returns 是否为 Blob
 */
export function isBlob(value: unknown): value is Blob {
  return value instanceof Blob;
}

/**
 * 验证是否为 File
 * @param value - 任意值
 * @returns 是否为 File
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * 验证文件类型
 * @param file - 文件对象
 * @param allowedTypes - 允许的类型列表
 * @returns 是否符合类型
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => file.type.startsWith(type));
}

/**
 * 验证文件大小
 * @param file - 文件对象
 * @param maxSizeInMB - 最大大小（MB）
 * @returns 是否符合大小
 */
export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * 验证 JSON 字符串
 * @param str - JSON 字符串
 * @returns 是否为有效 JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证 UUID
 * @param uuid - UUID 字符串
 * @returns 是否为有效 UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 验证用户名
 * @param username - 用户名
 * @returns 验证结果
 */
export function validateUsername(username: string): ValidationResult {
  if (!isValidLength(username, 3, 20)) {
    return { valid: false, message: '用户名长度需为 3-20 位' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: '用户名只能包含字母、数字和下划线' };
  }

  if (/^\d/.test(username)) {
    return { valid: false, message: '用户名不能以数字开头' };
  }

  return { valid: true };
}

/**
 * 验证中文姓名
 * @param name - 姓名
 * @returns 是否有效
 */
export function isValidChineseName(name: string): boolean {
  const nameRegex = /^[\u4e00-\u9fa5]{2,4}$/;
  return nameRegex.test(name);
}

/**
 * 验证车牌号（中国大陆）
 * @param plate - 车牌号
 * @returns 是否有效
 */
export function isValidLicensePlate(plate: string): boolean {
  // 普通车牌
  const normalPlateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{5}$/;
  // 新能源车牌
  const newEnergyPlateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]$/;

  return normalPlateRegex.test(plate) || newEnergyPlateRegex.test(plate);
}
