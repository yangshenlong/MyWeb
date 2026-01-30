/**
 * 结构化数据 (JSON-LD) 工具函数
 * 用于生成 Schema.org 标准的结构化数据
 */

interface ImageMetadata {
  src: string;
  width: number;
  height: number;
  format: string;
}

export interface BreadcrumbItem {
	name: string;
	item?: string;
}

export interface Person {
	name: string;
	url?: string;
	email?: string;
	image?: string;
}

export interface Organization {
	name: string;
	url?: string;
	logo?: string;
}

/**
 * 生成网站结构化数据
 */
export function generateWebSiteSchema(name: string, description: string, url: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name,
		description,
		url,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${url}?search={search_term_string}`,
			'query-input': 'required name=search_term_string',
		},
	};
}

/**
 * 生成网页结构化数据
 */
export function generateWebPageSchema(title: string, description: string, url: string, dateModified?: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: title,
		description,
		url,
		dateModified: dateModified || new Date().toISOString(),
		inLanguage: 'zh-CN',
	};
}

/**
 * 生成面包屑结构化数据
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[], baseUrl: string) {
	const itemList = items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.name,
		item: item.item ? new URL(item.item, baseUrl).href : undefined,
	}));

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: itemList,
	};
}

/**
 * 生成博客文章结构化数据
 */
export function generateBlogPostingSchema({
	title,
	description,
	url,
	image,
	datePublished,
	dateModified,
	author,
	tags,
	category,
}: {
	title: string;
	description: string;
	url: string;
	image?: string | ImageMetadata;
	datePublished: string | Date;
	dateModified?: string | Date;
	author?: Person;
	tags?: string[];
	category?: string;
}) {
	const getImageUrl = (img: string | ImageMetadata | undefined): string => {
		if (!img) return '';
		return typeof img === 'string' ? img : img.src;
	};

	const formatDate = (date: string | Date): string => {
		return new Date(date).toISOString();
	};

	const schema: any = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: title,
		description,
		image: getImageUrl(image),
		datePublished: formatDate(datePublished),
		dateModified: dateModified ? formatDate(dateModified) : formatDate(datePublished),
		url,
		inLanguage: 'zh-CN',
	};

	// 作者信息
	if (author) {
		schema.author = {
			'@type': 'Person',
			name: author.name,
			url: author.url,
		};
	}

	// 发布者信息
	schema.publisher = {
		'@type': 'Organization',
		name: author?.name || 'Blog',
		logo: {
			'@type': 'ImageObject',
			url: author?.image || '',
		},
	};

	// 标签
	if (tags && tags.length > 0) {
		schema.keywords = tags.join(', ');
	}

	// 分类
	if (category) {
		schema.articleSection = category;
	}

	// 主实体
	schema.mainEntityOfPage = {
		'@type': 'WebPage',
		'@id': url,
	};

	return schema;
}

/**
 * 生成人物结构化数据
 */
export function generatePersonSchema(person: Person) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: person.name,
		url: person.url,
		email: person.email,
		image: person.image,
	};
}

/**
 * 生成组织结构化数据
 */
export function generateOrganizationSchema(org: Organization) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: org.name,
		url: org.url,
		logo: org.logo,
	};
}

/**
 * 生成文章集合结构化数据
 */
export function generateCollectionSchema(pages: Array<{ title: string; url: string; datePublished: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Blog Posts',
		description: 'All blog posts',
		url: pages[0]?.url,
		hasPart: pages.map((page) => ({
			'@type': 'BlogPosting',
			headline: page.title,
			url: page.url,
			datePublished: page.datePublished,
		})),
	};
}
