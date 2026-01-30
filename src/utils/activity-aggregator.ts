import { getCollection } from 'astro:content';
import type { BlogActivitySummary } from '../types/activity';

export interface ActivityAggregatorOptions {
  startDate?: Date;
  endDate?: Date;
  includeUpdates?: boolean;
  timezone?: string;
  weeks?: number;
}

export async function aggregateBlogActivity(
  options: ActivityAggregatorOptions = {}
): Promise<Map<string, BlogActivitySummary>> {
  const {
    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    endDate = new Date(),
    includeUpdates = true,
    timezone = 'Asia/Shanghai'
  } = options;

  const posts = await getCollection('blog');
  const activityMap = new Map<string, BlogActivitySummary>();

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = formatDateKey(current, timezone);
    activityMap.set(dateStr, {
      date: dateStr,
      count: 0,
      publications: 0,
      updates: 0,
      posts: []
    });
    current.setDate(current.getDate() + 1);
  }

  for (const post of posts) {
    const pubDate = new Date(post.data.pubDate);
    
    if (pubDate >= startDate && pubDate <= endDate) {
      const pubDateStr = formatDateKey(pubDate, timezone);
      const existing = activityMap.get(pubDateStr);
      if (existing) {
        existing.count++;
        existing.publications++;
        existing.posts.push({
          date: pubDateStr,
          type: 'publication',
          postId: post.id,
          postTitle: post.data.title,
          tags: post.data.tags
        });
      }
    }

    if (includeUpdates && post.data.updatedDate) {
      const updateDate = new Date(post.data.updatedDate);
      if (updateDate.getTime() !== pubDate.getTime() && 
          updateDate >= startDate && updateDate <= endDate) {
        const updateDateStr = formatDateKey(updateDate, timezone);
        const existing = activityMap.get(updateDateStr);
        if (existing) {
          existing.count++;
          existing.updates++;
          existing.posts.push({
            date: updateDateStr,
            type: 'update',
            postId: post.id,
            postTitle: post.data.title,
            tags: post.data.tags
          });
        }
      }
    }
  }

  return activityMap;
}

function formatDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}
