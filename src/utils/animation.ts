/**
 * 动画配置系统
 * 统一管理所有动画参数
 */

import type { AnimationConfig, AnimationPreset } from '@types/index.js';

/**
 * 动画时长配置
 */
export const ANIMATION_DURATION = {
  instant: 0,
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 700
} as const;

/**
 * 动画缓动函数
 */
export const ANIMATION_EASING = {
  // 线性
  linear: 'linear',
  // 平滑
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 入场
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  // 出场
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  // 入场出场
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 弹跳
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  // 弹性
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
} as const;

/**
 * 动画预设
 */
export const animationPresets: AnimationPreset = {
  fadeIn: {
    duration: ANIMATION_DURATION.normal,
    easing: ANIMATION_EASING.smooth
  },
  slideUp: {
    duration: ANIMATION_DURATION.normal,
    easing: ANIMATION_EASING.easeOut
  },
  slideDown: {
    duration: ANIMATION_DURATION.normal,
    easing: ANIMATION_EASING.easeOut
  },
  slideLeft: {
    duration: ANIMATION_DURATION.normal,
    easing: ANIMATION_EASING.easeOut
  },
  slideRight: {
    duration: ANIMATION_DURATION.normal,
    easing: ANIMATION_EASING.easeOut
  },
  scale: {
    duration: ANIMATION_DURATION.normal,
    easing: ANIMATION_EASING.elastic
  }
};

/**
 * 检查用户是否偏好减少动画
 * @returns 是否应该减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 获取动画时长（考虑减少动画偏好）
 * @param duration - 默认时长
 * @returns 实际时长
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * 创建动画 CSS 变量
 * @param config - 动画配置
 * @returns CSS 变量字符串
 */
export function createAnimationVars(config: AnimationConfig): string {
  return `--animation-duration: ${config.duration}ms; --animation-easing: ${config.easing};`;
}

/**
 * 延迟动画配置
 * @param config - 原始配置
 * @param delay - 延迟时间
 * @returns 带延迟的配置
 */
export function withDelay(config: AnimationConfig, delay: number): AnimationConfig {
  return { ...config, delay };
}
