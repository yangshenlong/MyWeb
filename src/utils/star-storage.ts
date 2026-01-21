/**
 * 星标（收藏）存储工具
 * 使用 localStorage 存储用户收藏的文章
 */

const STORAGE_KEY = 'blog_starred_posts';

interface StarredPostData {
  starred: boolean;
  starredAt: string; // ISO timestamp
}

interface StarredPosts {
  [postSlug: string]: StarredPostData;
}

/**
 * 获取所有收藏的文章
 */
export function getStarredPosts(): StarredPosts {
  if (typeof window === 'undefined') return {};

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data) as StarredPosts;
  } catch {
    return {};
  }
}

/**
 * 设置文章收藏状态
 * @param postSlug - 文章 slug
 * @param starred - 是否收藏
 */
export function setStarredPost(postSlug: string, starred: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    const starredPosts = getStarredPosts();

    if (starred) {
      starredPosts[postSlug] = {
        starred: true,
        starredAt: new Date().toISOString()
      };
    } else {
      delete starredPosts[postSlug];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(starredPosts));

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('star-toggled', {
      detail: { postSlug, starred }
    }));
  } catch (error) {
    console.warn('Failed to save starred post:', error);
  }
}

/**
 * 切换文章收藏状态
 * @param postSlug - 文章 slug
 * @returns 新的收藏状态
 */
export function toggleStarredPost(postSlug: string): boolean {
  const currentState = isPostStarred(postSlug);
  const newState = !currentState;
  setStarredPost(postSlug, newState);
  return newState;
}

/**
 * 检查文章是否已收藏
 * @param postSlug - 文章 slug
 * @returns 是否已收藏
 */
export function isPostStarred(postSlug: string): boolean {
  const starredPosts = getStarredPosts();
  return starredPosts[postSlug]?.starred || false;
}

/**
 * 获取收藏的文章数量
 * @returns 收藏数量
 */
export function getStarredCount(): number {
  const starredPosts = getStarredPosts();
  return Object.values(starredPosts).filter(item => item.starred).length;
}

/**
 * 获取所有收藏的文章 slug 列表（按收藏时间倒序）
 * @returns 收藏的文章 slug 数组
 */
export function getStarredSlugs(): string[] {
  const starredPosts = getStarredPosts();
  return Object.entries(starredPosts)
    .filter(([_, data]) => data.starred)
    .sort(([, a], [, b]) => new Date(b.starredAt).getTime() - new Date(a.starredAt).getTime())
    .map(([slug]) => slug);
}

/**
 * 清空所有收藏
 */
export function clearAllStars(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('star-toggled', {
      detail: { postSlug: null, starred: false }
    }));
  } catch (error) {
    console.warn('Failed to clear starred posts:', error);
  }
}

/**
 * 监听收藏状态变化
 * @param callback - 回调函数
 * @returns 清理函数
 */
export function onStarChange(
  callback: (detail: { postSlug: string | null; starred: boolean }) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ postSlug: string | null; starred: boolean }>;
    callback(customEvent.detail);
  };

  window.addEventListener('star-toggled', handler);

  return () => {
    window.removeEventListener('star-toggled', handler);
  };
}
