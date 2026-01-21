/**
 * 触摸手势工具
 * 提供滑动、捏合、长按等手势检测
 */

/**
 * 点位置
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 滑动手势配置
 */
export interface SwipeConfig {
  /** 向左滑动回调 */
  onSwipeLeft?: () => void;
  /** 向右滑动回调 */
  onSwipeRight?: () => void;
  /** 向上滑动回调 */
  onSwipeUp?: () => void;
  /** 向下滑动回调 */
  onSwipeDown?: () => void;
  /** 滑动阈值（像素） */
  threshold?: number;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
}

/**
 * 捏合手势配置
 */
export interface PinchConfig {
  /** 捏合回调，参数为缩放比例 */
  onPinch?: (scale: number) => void;
  /** 捏合开始回调 */
  onPinchStart?: () => void;
  /** 捏合结束回调 */
  onPinchEnd?: () => void;
  /** 最小缩放比例 */
  minScale?: number;
  /** 最大缩放比例 */
  maxScale?: number;
}

/**
 * 长按手势配置
 */
export interface LongPressConfig {
  /** 长按回调 */
  onLongPress?: () => void;
  /** 长按时间（毫秒） */
  duration?: number;
  /** 触摸移动容差（像素） */
  moveTolerance?: number;
}

/**
 * 滑动手势管理器
 */
export class SwipeGesture {
  private startPoint: Point | null = null;
  private config: Required<SwipeConfig>;
  private element: HTMLElement;

  constructor(element: HTMLElement, config: SwipeConfig = {}) {
    this.element = element;
    this.config = {
      onSwipeLeft: config.onSwipeLeft || (() => {}),
      onSwipeRight: config.onSwipeRight || (() => {}),
      onSwipeUp: config.onSwipeUp || (() => {}),
      onSwipeDown: config.onSwipeDown || (() => {}),
      threshold: config.threshold || 50,
      preventDefault: config.preventDefault ?? true
    };

    this.init();
  }

  private init(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd);
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 1) {
      const touch = event.touches.item(0);
      if (touch) {
        this.startPoint = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (this.config.preventDefault) {
      event.preventDefault();
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.startPoint || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches.item(0);
    if (!touch) return;

    const endPoint = { x: touch.clientX, y: touch.clientY };

    const deltaX = endPoint.x - this.startPoint.x;
    const deltaY = endPoint.y - this.startPoint.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 判断是否为有效滑动
    if (Math.max(absDeltaX, absDeltaY) > this.config.threshold) {
      // 判断滑动方向
      if (absDeltaX > absDeltaY) {
        // 水平滑动
        if (deltaX > 0) {
          this.config.onSwipeRight();
        } else {
          this.config.onSwipeLeft();
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          this.config.onSwipeDown();
        } else {
          this.config.onSwipeUp();
        }
      }
    }

    this.startPoint = null;
  };

  /**
   * 销毁手势监听
   */
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}

/**
 * 捏合手势管理器
 */
export class PinchGesture {
  private startDistance = 0;
  private config: Required<PinchConfig>;
  private element: HTMLElement;
  private active = false;

  constructor(element: HTMLElement, config: PinchConfig = {}) {
    this.element = element;
    this.config = {
      onPinch: config.onPinch || (() => {}),
      onPinchStart: config.onPinchStart || (() => {}),
      onPinchEnd: config.onPinchEnd || (() => {}),
      minScale: config.minScale || 0.5,
      maxScale: config.maxScale || 3
    };

    this.init();
  }

  private init(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd);
  }

  private getDistance(touches: TouchList): number {
    const touch1 = touches.item(0);
    const touch2 = touches.item(1);

    if (!touch1 || !touch2) return 0;

    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 2) {
      this.startDistance = this.getDistance(event.touches);
      this.active = true;
      this.config.onPinchStart();
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.active || event.touches.length !== 2) return;

    event.preventDefault();

    const currentDistance = this.getDistance(event.touches);
    const scale = Math.max(
      this.config.minScale,
      Math.min(this.config.maxScale, currentDistance / this.startDistance)
    );

    this.config.onPinch(scale);
  };

  private handleTouchEnd = (): void => {
    if (this.active) {
      this.active = false;
      this.config.onPinchEnd();
    }
  };

  /**
   * 销毁手势监听
   */
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}

/**
 * 长按手势管理器
 */
export class LongPressGesture {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private startPoint: Point | null = null;
  private config: Required<LongPressConfig>;
  private element: HTMLElement;

  constructor(element: HTMLElement, config: LongPressConfig = {}) {
    this.element = element;
    this.config = {
      onLongPress: config.onLongPress || (() => {}),
      duration: config.duration || 500,
      moveTolerance: config.moveTolerance || 10
    };

    this.init();
  }

  private init(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove);
    this.element.addEventListener('touchend', this.handleTouchEnd);
    this.element.addEventListener('touchcancel', this.handleTouchEnd);
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startPoint = { x: touch.clientX, y: touch.clientY };

      this.timeoutId = setTimeout(() => {
        this.config.onLongPress();
        this.timeoutId = null;
      }, this.config.duration);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.startPoint || !this.timeoutId) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.startPoint.x);
    const deltaY = Math.abs(touch.clientY - this.startPoint.y);

    // 如果移动超过容差，取消长按
    if (deltaX > this.config.moveTolerance || deltaY > this.config.moveTolerance) {
      this.cancel();
    }
  };

  private handleTouchEnd = (): void => {
    this.cancel();
  };

  private cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.startPoint = null;
  }

  /**
   * 销毁手势监听
   */
  destroy(): void {
    this.cancel();
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}

/**
 * 检测设备是否支持触摸
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 阻止双击缩放
 */
export function preventDoubleClickZoom(element: HTMLElement): void {
  let lastTouchEnd = 0;

  element.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
}
