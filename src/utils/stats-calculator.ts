import type { BlogStats, BlogActivitySummary } from "../types/activity";

export function calculateBlogStats(activityMap: Map<string, BlogActivitySummary>): BlogStats {
  const entries = Array.from(activityMap.entries())
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const totalPosts = entries.reduce((sum, [_, data]) => sum + data.publications, 0);
  const activeDays = entries.length;

  const totalUpdates = entries.reduce((sum, [_, data]) => sum + data.updates, 0);
  const daysInRange = activityMap.size;
  const averagePostsPerWeek =
    daysInRange > 0 ? parseFloat(((totalPosts / daysInRange) * 7).toFixed(2)) : 0;

  const streakResult = calculateStreaks(entries);

  const now = new Date();
  const thisYear = now.getFullYear();
  const postsThisYear = entries
    .filter(([dateStr]) => dateStr.startsWith(thisYear.toString()))
    .reduce((sum, [_, data]) => sum + data.publications, 0);

  return {
    totalPosts,
    activeDays,
    currentStreak: streakResult.currentStreak,
    longestStreak: streakResult.longestStreak,
    averagePostsPerWeek,
    totalUpdates,
    postsThisYear,
  };
}

function calculateStreaks(entries: [string, BlogActivitySummary][]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevEntry = entries[i - 1];
      const currEntry = entries[i];
      if (!prevEntry || !currEntry) continue;
      const prevDate = new Date(prevEntry[0]);
      const currDate = new Date(currEntry[0]);
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    if (i === entries.length - 1) {
      currentStreak = tempStreak;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  return { currentStreak, longestStreak };
}
