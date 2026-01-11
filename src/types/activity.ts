export type ActivityType = 'publication' | 'update' | 'draft';

export interface BlogActivity {
  date: string;           // YYYY-MM-DD 格式
  type: ActivityType;
  postId: string;
  postTitle: string;
  wordCount?: number;
  tags?: string[];
}

export interface BlogActivitySummary {
  date: string;
  count: number;          // 当天活动总数
  publications: number;   // 新发布数量
  updates: number;        // 更新数量
  posts: BlogActivity[];  // 当天所有活动详情
}

export interface BlogStats {
  // 🏆 核心指标 (用户优先)
  totalPosts: number;     // 总文章数
  activeDays: number;     // 活跃天数
  
  // 扩展指标
  currentStreak: number;  // 当前连续天数
  longestStreak: number;  // 最长连续天数
  averagePostsPerWeek: number; // 周均发布
  
  // 额外信息
  totalUpdates: number;   // 更新次数
  postsThisYear: number;  // 本年发布
}
