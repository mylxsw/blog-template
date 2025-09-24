const fs = require('fs-extra');
const path = require('path');
const MarkdownParser = require('./markdown-parser');
const handlebars = require('handlebars');
const { compile } = require('handlebars');
const config = require('./config');

handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

handlebars.registerHelper('range', function(start, end) {
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
});

class PageGenerator {
    constructor() {
        this.parser = new MarkdownParser();
        this.publicDir = path.join(__dirname, 'public');
        this.templatesDir = path.join(__dirname, 'templates');
        this.pagesDir = path.join(__dirname, 'pages');
        this.systemPagesDir = path.join(this.pagesDir, 'system');
        this.config = config;
    }

    formatDate(dateStr) {
        if (!dateStr) return { formatted: '', iso: '' };
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return { formatted: '', iso: '' };
        const formatted = d.toLocaleDateString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        return { formatted, iso: d.toISOString() };
    }

    getTemplate(templateName) {
        const templatePath = path.join(this.templatesDir, templateName);
        return fs.readFileSync(templatePath, 'utf-8');
    }

    slugify(value) {
        if (!value) return '';
        return value
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/-{2,}/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase();
    }

    normalizeTags(value) {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value
                .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
                .filter(Boolean);
        }
        if (typeof value === 'string') {
            return value
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean);
        }
        return [];
    }

    normalizeCategory(value) {
        if (!value) return '';
        if (typeof value !== 'string') return '';
        return value.trim();
    }

    normalizeSeoKeywords(value) {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value
                .map(keyword => (typeof keyword === 'string' ? keyword.trim() : ''))
                .filter(Boolean);
        }
        if (typeof value === 'string') {
            return value
                .split(',')
                .map(keyword => keyword.trim())
                .filter(Boolean);
        }
        return [];
    }

    getTagUrl(tagName) {
        const slug = this.slugify(tagName);
        return `/tags/${slug}/`;
    }

    getCategoryUrl(categoryName) {
        const slug = this.slugify(categoryName);
        return `/categories/${slug}/`;
    }

    getTagsWithUrls(tags = []) {
        return this.normalizeTags(tags).map(name => ({
            name,
            slug: this.slugify(name),
            url: this.getTagUrl(name)
        }));
    }

    getCategoryForPost(category) {
        const name = this.normalizeCategory(category);
        if (!name) return null;
        return {
            name,
            slug: this.slugify(name),
            url: this.getCategoryUrl(name)
        };
    }

    getOutputPath(relativePath, outputSubDir = '') {
        const dir = path.dirname(relativePath);
        const name = path.basename(relativePath, '.md');
        const segments = [this.publicDir];
        if (outputSubDir) {
            segments.push(outputSubDir);
        }
        if (dir && dir !== '.' && dir !== path.sep) {
            segments.push(dir);
        }
        return path.join(...segments, `${name}.html`);
    }

    getRelativeUrl(filePath, baseDir = this.pagesDir, outputSubDir = '') {
        const relativePath = path.relative(baseDir, filePath);
        const dir = path.dirname(relativePath);
        const name = path.basename(relativePath, '.md');
        const segments = [];
        if (outputSubDir) {
            segments.push(outputSubDir);
        }
        if (dir && dir !== '.' && dir !== path.sep) {
            segments.push(dir);
        }
        segments.push(`${name}.html`);
        return `/${segments.join('/').replace(/\\/g, '/')}`;
    }

    getExcerpt(html, maxLength = 200) {
        const text = html.replace(/<[^>]*>/g, '').trim();
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }

    collectTags(posts) {
        const tagMap = new Map();
        posts.forEach(post => {
            const tags = this.normalizeTags(post.attributes.tags);
            tags.forEach(tag => {
                if (!tagMap.has(tag)) {
                    tagMap.set(tag, {
                        name: tag,
                        slug: this.slugify(tag),
                        url: this.getTagUrl(tag),
                        count: 0
                    });
                }
                tagMap.get(tag).count += 1;
            });
        });
        return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    }

    collectCategories(posts) {
        const categoryMap = new Map();
        posts.forEach(post => {
            const categoryName = this.normalizeCategory(post.attributes.category);
            if (!categoryName) return;
            const slug = this.slugify(categoryName);
            if (!categoryMap.has(slug)) {
                categoryMap.set(slug, {
                    name: categoryName,
                    slug,
                    url: this.getCategoryUrl(categoryName),
                    count: 0
                });
            }
            categoryMap.get(slug).count += 1;
        });
        return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    }

    buildNavigation(categories, options = {}) {
        const topLevel = this.config.navigation?.categories?.topLevel || [];
        const moreLabel = this.config.navigation?.categories?.moreLabel || '更多';
        const usedSlugs = new Set();
        const primary = [];
        const more = [];

        topLevel.forEach(name => {
            const category = categories.find(cat => cat.name === name);
            if (category && !usedSlugs.has(category.slug)) {
                primary.push(category);
                usedSlugs.add(category.slug);
            }
        });

        categories.forEach(category => {
            if (usedSlugs.has(category.slug)) return;
            more.push(category);
            usedSlugs.add(category.slug);
        });

        if (primary.length === 0 && more.length > 0) {
            const fallback = more.splice(0, Math.min(3, more.length));
            primary.push(...fallback);
        }

        return {
            activePage: options.activePage || '',
            activeCategorySlug: options.activeCategorySlug || '',
            categories: {
                primary,
                more,
                moreLabel,
                hasCategories: primary.length > 0 || more.length > 0
            }
        };
    }

    buildListingItem(post, { includeExcerpt = true } = {}) {
        const { formatted: dateFormatted, iso: dateISO } = this.formatDate(post.attributes.date);
        const tags = this.getTagsWithUrls(post.attributes.tags);
        const category = this.getCategoryForPost(post.attributes.category);
        return {
            title: post.attributes.title || '无标题',
            url: this.getRelativeUrl(post.filePath),
            coverImage: post.attributes.coverImage || '',
            excerpt: includeExcerpt ? this.getExcerpt(post.html) : '',
            dateFormatted,
            dateISO,
            tags,
            category
        };
    }

    getRecommendedPosts(currentPost, allPosts, limit = 3) {
        const currentTags = new Set(this.normalizeTags(currentPost.attributes.tags));
        const candidates = allPosts
            .filter(post => post.filePath !== currentPost.filePath)
            .map(post => {
                const tags = this.normalizeTags(post.attributes.tags);
                const overlap = tags.reduce((acc, tag) => acc + (currentTags.has(tag) ? 1 : 0), 0);
                const dateValue = new Date(post.attributes.date || 0).getTime();
                return { post, overlap, dateValue };
            })
            .sort((a, b) => {
                if (b.overlap !== a.overlap) return b.overlap - a.overlap;
                return b.dateValue - a.dateValue;
            });

        const recommended = [];
        const used = new Set();

        candidates.forEach(candidate => {
            if (recommended.length >= limit) return;
            recommended.push(this.buildListingItem(candidate.post, { includeExcerpt: false }));
            used.add(candidate.post.filePath);
        });

        if (recommended.length < limit) {
            const additional = allPosts
                .filter(post => post.filePath !== currentPost.filePath && !used.has(post.filePath))
                .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
            additional.forEach(post => {
                if (recommended.length >= limit) return;
                recommended.push(this.buildListingItem(post, { includeExcerpt: false }));
            });
        }

        return recommended.slice(0, limit);
    }

    generatePostPage(post, allPosts, categories) {
        const template = compile(this.getTemplate('post.html'));
        const { formatted: dateFormatted, iso: dateISO } = this.formatDate(post.attributes.date);
        const category = this.getCategoryForPost(post.attributes.category);
        const navigation = this.buildNavigation(categories, {
            activeCategorySlug: category?.slug || ''
        });
        const seoKeywords = this.normalizeSeoKeywords(post.attributes.seo);
        const recommendedPosts = this.getRecommendedPosts(post, allPosts);
        const hasRecommendations = recommendedPosts.length > 0;
        const metaDescription = this.getExcerpt(post.html, 160);

        const data = {
            title: post.attributes.title || '无标题',
            date: post.attributes.date || '',
            dateFormatted,
            dateISO,
            tags: this.getTagsWithUrls(post.attributes.tags),
            coverImage: post.attributes.coverImage || '',
            content: post.html,
            site: this.config.site,
            navigation,
            category,
            seoKeywords,
            recommendedPosts,
            hasRecommendations,
            metaDescription
        };

        const relativePath = path.relative(this.pagesDir, post.filePath);
        const outputPath = this.getOutputPath(relativePath);
        fs.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, template(data));
        console.log(`Generated: ${outputPath}`);
    }

    generateSystemPage(page, categories) {
        const template = compile(this.getTemplate('post.html'));
        const { formatted: dateFormatted, iso: dateISO } = this.formatDate(page.attributes.date);
        const navigation = this.buildNavigation(categories, {
            activePage: path.basename(page.filePath, '.md')
        });

        const data = {
            title: page.attributes.title || '无标题',
            date: page.attributes.date || '',
            dateFormatted,
            dateISO,
            tags: this.getTagsWithUrls(page.attributes.tags),
            coverImage: page.attributes.coverImage || '',
            content: page.html,
            site: this.config.site,
            navigation,
            category: null,
            seoKeywords: this.normalizeSeoKeywords(page.attributes.seo),
            recommendedPosts: [],
            hasRecommendations: false,
            metaDescription: this.getExcerpt(page.html, 160)
        };

        const relativePath = path.relative(this.systemPagesDir, page.filePath);
        const outputPath = this.getOutputPath(relativePath);
        fs.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, template(data));
        console.log(`Generated: ${outputPath}`);
    }

    generateIndex(posts, page = 1, pageSize = 5, availableTags = [], categories = []) {
        const sortedPosts = [...posts].sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
        const totalPosts = sortedPosts.length;
        const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalPosts);
        const pagePosts = sortedPosts.slice(startIndex, endIndex);

        const template = compile(this.getTemplate('index.html'));
        const navigation = this.buildNavigation(categories, { activePage: page === 1 ? 'home' : '' });

        const data = {
            title: this.config.site.title,
            posts: pagePosts.map(post => this.buildListingItem(post)),
            pagination: {
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                nextPage: page + 1,
                prevPage: page - 1
            },
            availableTags,
            hasTagFilters: availableTags.length > 0,
            site: this.config.site,
            navigation
        };

        let outputPath;
        if (page === 1) {
            outputPath = path.join(this.publicDir, 'index.html');
        } else {
            const pageDir = path.join(this.publicDir, 'page', String(page));
            fs.ensureDirSync(pageDir);
            outputPath = path.join(pageDir, 'index.html');
        }

        fs.writeFileSync(outputPath, template(data));
        console.log(`Generated: ${outputPath}`);
    }

    generateListingPage({ title, heading, posts, outputPath, navigation }) {
        const template = compile(this.getTemplate('listing.html'));
        const data = {
            title,
            heading,
            posts,
            hasPosts: posts.length > 0,
            site: this.config.site,
            navigation
        };
        fs.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, template(data));
        console.log(`Generated: ${outputPath}`);
    }

    generateTagPages(tags, posts, categories) {
        tags.forEach(tag => {
            const taggedPosts = posts
                .filter(post => this.normalizeTags(post.attributes.tags).includes(tag.name))
                .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
            if (!taggedPosts.length) return;

            const heading = {
                title: `#${tag.name}`,
                description: `共 ${tag.count} 篇与该标签相关的文章`,
                type: 'tag'
            };
            const outputDir = path.join(this.publicDir, 'tags', tag.slug);
            const outputPath = path.join(outputDir, 'index.html');
            const navigation = this.buildNavigation(categories, {});

            this.generateListingPage({
                title: `${tag.name} · 标签 · ${this.config.site.title}`,
                heading,
                posts: taggedPosts.map(post => this.buildListingItem(post)),
                outputPath,
                navigation
            });
        });
    }

    generateCategoryPages(categories, posts) {
        categories.forEach(category => {
            const categoryPosts = posts
                .filter(post => this.normalizeCategory(post.attributes.category) === category.name)
                .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
            if (!categoryPosts.length) return;

            const heading = {
                title: category.name,
                description: `收录了 ${category.count} 篇文章`,
                type: 'category'
            };
            const outputDir = path.join(this.publicDir, 'categories', category.slug);
            const outputPath = path.join(outputDir, 'index.html');
            const navigation = this.buildNavigation(categories, { activeCategorySlug: category.slug });

            this.generateListingPage({
                title: `${category.name} · 分类 · ${this.config.site.title}`,
                heading,
                posts: categoryPosts.map(post => this.buildListingItem(post)),
                outputPath,
                navigation
            });
        });
    }

    generateRSS(posts) {
        const sortedPosts = [...posts]
            .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0))
            .slice(0, 20);

        const rssData = {
            title: this.config.site.title,
            description: this.config.site.description || '一基于Markdown的静态博客',
            link: this.config.site.url || 'http://localhost:8080',
            language: 'zh-cn',
            lastBuildDate: new Date().toUTCString(),
            pubDate: new Date().toUTCString(),
            items: sortedPosts.map(post => {
                const postUrl = `${this.config.site.url || 'http://localhost:8080'}${this.getRelativeUrl(post.filePath)}`;
                return {
                    title: post.attributes.title || '无标题',
                    description: this.getExcerpt(post.html, 200),
                    link: postUrl,
                    guid: postUrl,
                    pubDate: post.attributes.date ? new Date(post.attributes.date).toUTCString() : new Date().toUTCString(),
                    author: this.config.site.author || 'Anonymous'
                };
            })
        };

        const rssTemplate = this.getRSSTemplate();
        const template = compile(rssTemplate);
        const rssXml = template(rssData);

        const rssPath = path.join(this.publicDir, 'rss.xml');
        fs.writeFileSync(rssPath, rssXml);
        console.log(`Generated RSS: ${rssPath}`);
    }

    getRSSTemplate() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{{title}}</title>
    <description>{{description}}</description>
    <link>{{link}}</link>
    <atom:link href="{{link}}/rss.xml" rel="self" type="application/rss+xml" />
    <language>{{language}}</language>
    <lastBuildDate>{{lastBuildDate}}</lastBuildDate>
    <pubDate>{{pubDate}}</pubDate>
    <ttl>1440</ttl>
    {{#each items}}
    <item>
      <title><![CDATA[{{title}}]]></title>
      <description><![CDATA[{{description}}]]></description>
      <link>{{link}}</link>
      <guid isPermaLink="true">{{guid}}</guid>
      <pubDate>{{pubDate}}</pubDate>
      <author>{{author}}</author>
    </item>
    {{/each}}
  </channel>
</rss>`;
    }

    generateSearchIndex(posts) {
        const indexItems = posts.map(post => {
            const { formatted: dateFormatted, iso: dateISO } = this.formatDate(post.attributes.date);
            const tags = this.normalizeTags(post.attributes.tags);
            const plainText = post.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            return {
                title: post.attributes.title || '无标题',
                url: this.getRelativeUrl(post.filePath),
                excerpt: this.getExcerpt(post.html, 220),
                tags,
                tagLinks: tags.map(name => ({
                    name,
                    slug: this.slugify(name),
                    url: this.getTagUrl(name)
                })),
                date: post.attributes.date || '',
                dateFormatted,
                dateISO,
                coverImage: post.attributes.coverImage || '',
                category: this.getCategoryForPost(post.attributes.category),
                content: plainText
            };
        });

        const searchPath = path.join(this.publicDir, 'search.json');
        fs.writeFileSync(searchPath, JSON.stringify({ generatedAt: new Date().toISOString(), posts: indexItems }, null, 2));
        console.log(`Generated search index: ${searchPath}`);
    }

    generateSitemap({ posts, categories, tags, totalPages, systemPages }) {
        const urls = [];
        const siteUrl = (this.config.site.url || 'http://localhost:8080').replace(/\/$/, '');
        const changefreq = this.config.seo?.changeFrequency || 'weekly';
        const homePriority = this.config.seo?.homePriority || 1.0;
        const defaultPriority = this.config.seo?.defaultPriority || 0.6;

        const today = new Date().toISOString().split('T')[0];
        urls.push({
            loc: `${siteUrl}/`,
            lastmod: today,
            changefreq,
            priority: homePriority
        });

        for (let page = 2; page <= totalPages; page++) {
            urls.push({
                loc: `${siteUrl}/page/${page}/`,
                lastmod: today,
                changefreq,
                priority: defaultPriority
            });
        }

        posts.forEach(post => {
            const loc = `${siteUrl}${this.getRelativeUrl(post.filePath)}`;
            const lastmod = post.attributes.date ? new Date(post.attributes.date).toISOString().split('T')[0] : today;
            urls.push({
                loc,
                lastmod,
                changefreq,
                priority: defaultPriority
            });
        });

        categories.forEach(category => {
            urls.push({
                loc: `${siteUrl}${category.url}`,
                lastmod: today,
                changefreq,
                priority: defaultPriority
            });
        });

        tags.forEach(tag => {
            urls.push({
                loc: `${siteUrl}${tag.url}`,
                lastmod: today,
                changefreq,
                priority: defaultPriority
            });
        });

        systemPages.forEach(page => {
            const loc = `${siteUrl}${this.getRelativeUrl(page.filePath, this.systemPagesDir)}`;
            urls.push({
                loc,
                lastmod: today,
                changefreq,
                priority: defaultPriority
            });
        });

        const sitemapEntries = urls
            .map(entry => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`)
            .join('\n');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>`;
        const sitemapPath = path.join(this.publicDir, 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemap);
        console.log(`Generated sitemap: ${sitemapPath}`);
    }

    generateRobots() {
        const siteUrl = (this.config.site.url || 'http://localhost:8080').replace(/\/$/, '');
        const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
        const robotsPath = path.join(this.publicDir, 'robots.txt');
        fs.writeFileSync(robotsPath, robotsContent);
        console.log(`Generated robots.txt: ${robotsPath}`);
    }

    generateAdsTxt() {
        const publisherId = this.config.advertising?.publisherId || 'pub-0000000000000000';
        const content = `# Google AdSense verification\ngoogle.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
        const adsPath = path.join(this.publicDir, 'ads.txt');
        fs.writeFileSync(adsPath, content);
        console.log(`Generated ads.txt: ${adsPath}`);
    }

    copyAssets() {
        const stylesSourceDir = path.join(__dirname, 'styles');
        const stylesTargetDir = path.join(this.publicDir, 'styles');

        if (fs.existsSync(stylesSourceDir)) {
            fs.copySync(stylesSourceDir, stylesTargetDir);
            console.log('Styles copied successfully!');
        }

        const assetsSourceDir = path.join(__dirname, 'public');
        if (fs.existsSync(assetsSourceDir) && assetsSourceDir !== this.publicDir) {
            fs.copySync(assetsSourceDir, this.publicDir);
            console.log('Other assets copied successfully!');
        } else if (assetsSourceDir === this.publicDir) {
            console.log('Assets directory is the same as target directory, skipping copy.');
        }
    }

    generateAll() {
        fs.ensureDirSync(this.publicDir);

        const markdownFiles = this.parser.getMarkdownFiles(this.pagesDir);
        const systemDirExists = fs.existsSync(this.systemPagesDir) && fs.statSync(this.systemPagesDir).isDirectory();
        const posts = [];
        const systemPages = [];

        markdownFiles.forEach(filePath => {
            const isSystemPage = systemDirExists && !path.relative(this.systemPagesDir, filePath).startsWith('..');
            const parsed = this.parser.parseFile(filePath);
            const attributes = { ...parsed.attributes };
            attributes.tags = this.normalizeTags(attributes.tags);
            attributes.category = this.normalizeCategory(attributes.category);
            attributes.seo = this.normalizeSeoKeywords(attributes.seo);

            const pageData = {
                filePath,
                attributes,
                html: parsed.html
            };

            if (isSystemPage) {
                systemPages.push(pageData);
            } else {
                posts.push(pageData);
            }
        });

        const categories = this.collectCategories(posts);
        const availableTags = this.collectTags(posts);
        const pageSize = this.config.pagination.pageSize || 5;
        const totalPosts = posts.length;
        const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

        posts.forEach(post => {
            this.generatePostPage(post, posts, categories);
        });

        systemPages.forEach(page => {
            this.generateSystemPage(page, categories);
        });

        for (let page = 1; page <= totalPages; page++) {
            this.generateIndex(posts, page, pageSize, availableTags, categories);
        }

        this.generateTagPages(availableTags, posts, categories);
        this.generateCategoryPages(categories, posts);
        this.generateRSS(posts);
        this.generateSearchIndex(posts);
        this.generateSitemap({ posts, categories, tags: availableTags, totalPages, systemPages });
        this.generateRobots();
        this.generateAdsTxt();
        this.copyAssets();

        console.log('All pages generated successfully!');
    }
}

module.exports = PageGenerator;
