import { describe, it, expect } from "vitest";
import { calculateBlogStats } from "./stats-calculator";

describe("stats-calculator", () => {
  describe("calculateBlogStats", () => {
    it("should return 0 for empty map", () => {
      const emptyMap = new Map();
      const result = calculateBlogStats(emptyMap);
      expect(result.totalPosts).toBe(0);
      expect(result.activeDays).toBe(0);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.averagePostsPerWeek).toBe(0);
    });

    it("should calculate stats correctly for single day", () => {
      const activityMap = new Map([
        ["2026-01-15", { count: 5, publications: 3, updates: 2, posts: [] }],
      ]);
      const result = calculateBlogStats(activityMap);
      expect(result.totalPosts).toBe(3);
      expect(result.activeDays).toBe(1);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it("should calculate consecutive streak correctly", () => {
      const activityMap = new Map([
        ["2026-01-15", { count: 5, publications: 3, updates: 2, posts: [] }],
        ["2026-01-14", { count: 3, publications: 2, updates: 1, posts: [] }],
        ["2026-01-13", { count: 2, publications: 1, updates: 1, posts: [] }],
      ]);
      const result = calculateBlogStats(activityMap);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.totalPosts).toBe(6);
    });

    it("should handle gaps in activities", () => {
      const activityMap = new Map([
        ["2026-01-15", { count: 5, publications: 3, updates: 2, posts: [] }],
        ["2026-01-13", { count: 2, publications: 1, updates: 1, posts: [] }],
        ["2026-01-12", { count: 1, publications: 1, updates: 0, posts: [] }],
      ]);
      const result = calculateBlogStats(activityMap);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(2);
    });

    it("should calculate weekly average correctly", () => {
      const activityMap = new Map([
        ["2026-01-15", { count: 5, publications: 3, updates: 2, posts: [] }],
        ["2026-01-14", { count: 3, publications: 2, updates: 1, posts: [] }],
        ["2026-01-13", { count: 2, publications: 1, updates: 1, posts: [] }],
        ["2026-01-08", { count: 4, publications: 2, updates: 2, posts: [] }],
        ["2026-01-07", { count: 2, publications: 1, updates: 1, posts: [] }],
      ]);
      const result = calculateBlogStats(activityMap);
      expect(result.averagePostsPerWeek).toBeGreaterThan(0);
    });
  });
});
