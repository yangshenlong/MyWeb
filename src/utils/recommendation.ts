/**
 * 文章推荐算法
 * 基于标签、分类和时间的相关度计算
 */

import type { CollectionEntry } from 'astro:content';

export interface RecommendationScore {
	post: CollectionEntry<'blog'>;
	score: number;
	reasons: string[];
}

/**
 * 计算文章相关度分数
 * @param currentPost 当前文章
 * @param allPosts 所有文章列表
 * @param limit 返回数量限制
 * @returns 推荐文章列表
 */
export function getRelatedPosts(
	currentPost: CollectionEntry<'blog'>,
	allPosts: CollectionEntry<'blog'>[],
	limit = 4
): CollectionEntry<'blog'>[] {
	// 过滤掉当前文章
	const otherPosts = allPosts.filter((post) => post.id !== currentPost.id);

	// 计算每篇文章的相关度分数
	const scores: RecommendationScore[] = otherPosts.map((post) => {
		let score = 0;
		const reasons: string[] = [];

		// 1. 标签匹配 (最重要)
		const currentTags = new Set(currentPost.data.tags || []);
		const postTags = new Set(post.data.tags || []);
		const commonTags = [...currentTags].filter((tag) => postTags.has(tag));

		if (commonTags.length > 0) {
			// 每个共同标签增加 30 分
			score += commonTags.length * 30;
			reasons.push(`共同标签: ${commonTags.join(', ')}`);
		}

		// 2. 分类匹配
		if (
			currentPost.data.category &&
			currentPost.data.category === post.data.category
		) {
			score += 20;
			reasons.push(`相同分类: ${currentPost.data.category}`);
		}

		// 3. 时间相似度 (最近的文章优先)
		const currentDate = new Date(currentPost.data.pubDate).getTime();
		const postDate = new Date(post.data.pubDate).getTime();
		const daysDiff = Math.abs(currentDate - postDate) / (1000 * 60 * 60 * 24);

		// 90天内发布的文章额外加分
		if (daysDiff <= 90) {
			score += Math.max(0, 10 - daysDiff / 10);
			reasons.push('最近发布');
		}

		// 4. 作者匹配 (如果有多个作者)
		if (
			currentPost.data.author &&
			post.data.author &&
			currentPost.data.author === post.data.author
		) {
			score += 5;
			reasons.push('相同作者');
		}

		return { post, score, reasons };
	});

	// 按分数排序
	scores.sort((a, b) => b.score - a.score);

	// 如果分数相同，随机打乱以增加多样性
	const threshold = 50; // 分数阈值
	let i = 0;
	while (i < scores.length - 1) {
		const current = scores[i];
		const next = scores[i + 1];

		// 如果相邻文章分数接近（相差小于10分），随机交换顺序
		if (
			Math.abs(current.score - next.score) < 10 &&
			current.score > threshold
		) {
			if (Math.random() > 0.5) {
				[scores[i], scores[i + 1]] = [scores[i + 1], scores[i]];
			}
		}
		i++;
	}

	// 返回 top N
	return scores.slice(0, limit).map((item) => item.post);
}

/**
 * 获取随机文章推荐
 * @param currentPost 当前文章
 * @param allPosts 所有文章列表
 * @param limit 返回数量限制
 * @returns 随机推荐文章列表
 */
export function getRandomPosts(
	currentPost: CollectionEntry<'blog'>,
	allPosts: CollectionEntry<'blog'>[],
	limit = 4
): CollectionEntry<'blog'>[] {
	// 过滤掉当前文章并打乱
	const otherPosts = allPosts
		.filter((post) => post.id !== currentPost.id)
		.sort(() => Math.random() - 0.5);

	return otherPosts.slice(0, limit);
}

/**
 * 获取最新文章
 * @param allPosts 所有文章列表
 * @param limit 返回数量限制
 * @returns 最新文章列表
 */
export function getLatestPosts(
	allPosts: CollectionEntry<'blog'>[],
	limit = 4
): CollectionEntry<'blog'>[] {
	return [...allPosts]
		.sort(
			(a, b) =>
				new Date(b.data.pubDate).getTime() -
				new Date(a.data.pubDate).getTime()
		)
		.slice(0, limit);
}

/**
 * 获取热门标签
 * @param allPosts 所有文章列表
 * @param limit 返回数量限制
 * @returns 热门标签列表
 */
export function getPopularTags(
	allPosts: CollectionEntry<'blog'>[],
	limit = 10
): string[] {
	const tagCounts = new Map<string, number>();

	allPosts.forEach((post) => {
		(post.data.tags || []).forEach((tag) => {
			tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
		});
	});

	return [...tagCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([tag]) => tag);
}
