const fs = require('fs-extra');
const path = require('path');
const MarkdownParser = require('./markdown-parser');
const { compile } = require('handlebars');
const config = require('./config');

// 注册Handlebars辅助函数
require('handlebars').registerHelper('eq', function(a, b) {
    return a === b;
});

require('handlebars').registerHelper('range', function(start, end) {
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

    /**
     * 读取模板文件
     * @param {string} templateName - 模板文件名
     * @returns {string} 模板内容
     */
    getTemplate(templateName) {
        const templatePath = path.join(this.templatesDir, templateName);
        return fs.readFileSync(templatePath, 'utf-8');
    }

    /**
     * 生成单个页面
     * @param {string} filePath - Markdown文件路径
     */
    generatePage(filePath, options = {}) {
        const { baseDir = this.pagesDir, outputSubDir = '' } = options;
        // 解析Markdown文件
        const parsed = this.parser.parseFile(filePath);
        
        // 计算相对路径和输出路径
        const relativePath = path.relative(baseDir, filePath);
        const outputPath = this.getOutputPath(relativePath, outputSubDir);
        
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        fs.ensureDirSync(outputDir);
        
        // 编译模板
        const template = compile(this.getTemplate('post.html'));
        
        // 准备模板数据
        const { formatted: dateFormatted, iso: dateISO } = this.formatDate(parsed.attributes.date);
        const data = {
            title: parsed.attributes.title || '无标题',
            date: parsed.attributes.date || '',
            dateFormatted,
            dateISO,
            tags: parsed.attributes.tags || [],
            coverImage: parsed.attributes.coverImage || '', // 添加封面图属性
            content: parsed.html,
            site: this.config.site // 添加站点配置信息
        };
        
        // 生成HTML
        const html = template(data);
        
        // 写入文件
        fs.writeFileSync(outputPath, html);
        
        console.log(`Generated: ${outputPath}`);
    }

    /**
     * 根据相对路径计算输出路径
     * @param {string} relativePath - 相对于pages目录的路径
     * @returns {string} 输出文件路径
     */
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

    /**
     * 生成首页
     * @param {Array} posts - 文章信息数组
     * @param {number} page - 当前页码，默认为1
     * @param {number} pageSize - 每页文章数量，默认为5
     */
    generateIndex(posts, page = 1, pageSize = 5, availableTags = []) {
        // 按日期排序，最新的在前面
        const sortedPosts = posts.sort((a, b) => {
            const dateA = new Date(a.attributes.date || 0);
            const dateB = new Date(b.attributes.date || 0);
            return dateB - dateA;
        });
        
        // 计算分页信息
        const totalPosts = sortedPosts.length;
        const totalPages = Math.ceil(totalPosts / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalPosts);
        const pagePosts = sortedPosts.slice(startIndex, endIndex);
        
        const template = compile(this.getTemplate('index.html'));
        
        // 准备模板数据
        const data = {
            title: this.config.site.title,
            posts: pagePosts.map(post => ({
                title: post.attributes.title || '无标题',
                date: post.attributes.date || '',
                dateFormatted: this.formatDate(post.attributes.date).formatted,
                dateISO: this.formatDate(post.attributes.date).iso,
                tags: post.attributes.tags || [],
                coverImage: post.attributes.coverImage || '', // 添加封面图属性
                url: this.getRelativeUrl(post.filePath),
                excerpt: this.getExcerpt(post.html)
            })),
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                nextPage: page + 1,
                prevPage: page - 1
            },
            availableTags,
            site: this.config.site // 添加站点配置信息
        };
        
        // 生成HTML
        const html = template(data);
        
        // 确定输出路径
        let outputPath;
        if (page === 1) {
            outputPath = path.join(this.publicDir, 'index.html');
        } else {
            const pageDir = path.join(this.publicDir, 'page', String(page));
            fs.ensureDirSync(pageDir);
            outputPath = path.join(pageDir, 'index.html');
        }
        
        // 写入文件
        fs.writeFileSync(outputPath, html);
        
        console.log(`Generated: ${outputPath}`);
    }

    /**
     * 获取文章摘要
     * @param {string} html - HTML内容
     * @param {number} maxLength - 最大长度，默认200字符
     * @returns {string} 摘要文本
     */
    getExcerpt(html, maxLength = 200) {
        // 移除HTML标签并截取指定长度的字符
        const text = html.replace(/<[^>]*>/g, '').trim();
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * 获取相对于public目录的URL
     * @param {string} filePath - 文件路径
     * @returns {string} 相对URL
     */
    getRelativeUrl(filePath) {
        const relativePath = path.relative(this.pagesDir, filePath);
        const dir = path.dirname(relativePath);
        const name = path.basename(relativePath, '.md');
        return path.join('/', dir, `${name}.html`).replace(/\\/g, '/');
    }

    collectTags(posts) {
        const tagSet = new Set();
        posts.forEach(post => {
            const tags = Array.isArray(post.attributes.tags) ? post.attributes.tags : [];
            tags.forEach(tag => {
                if (typeof tag === 'string' && tag.trim()) {
                    tagSet.add(tag.trim());
                }
            });
        });
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    generateSearchIndex(posts) {
        const indexItems = posts.map(post => {
            const { formatted: dateFormatted, iso: dateISO } = this.formatDate(post.attributes.date);
            const tags = Array.isArray(post.attributes.tags) ? post.attributes.tags : [];
            const plainText = post.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            return {
                title: post.attributes.title || '无标题',
                url: this.getRelativeUrl(post.filePath),
                excerpt: this.getExcerpt(post.html, 220),
                tags,
                date: post.attributes.date || '',
                dateFormatted,
                dateISO,
                coverImage: post.attributes.coverImage || '',
                content: plainText
            };
        });

        const searchPath = path.join(this.publicDir, 'search.json');
        fs.writeFileSync(searchPath, JSON.stringify({ generatedAt: new Date().toISOString(), posts: indexItems }, null, 2));
        console.log(`Generated search index: ${searchPath}`);
    }

    /**
     * 生成所有页面
     */
    generateAll() {
        // 确保public目录存在
        fs.ensureDirSync(this.publicDir);
        
        // 获取所有Markdown文件
        const markdownFiles = this.parser.getMarkdownFiles(this.pagesDir);

        const systemDirExists = fs.existsSync(this.systemPagesDir) && fs.statSync(this.systemPagesDir).isDirectory();
        const posts = [];
        const systemPages = [];

        markdownFiles.forEach(filePath => {
            const isSystemPage = systemDirExists && !path.relative(this.systemPagesDir, filePath).startsWith('..');
            if (isSystemPage) {
                systemPages.push(filePath);
                return;
            }

            const parsed = this.parser.parseFile(filePath);
            posts.push({
                filePath: filePath,
                attributes: parsed.attributes,
                html: parsed.html
            });
            this.generatePage(filePath, { baseDir: this.pagesDir });
        });

        systemPages.forEach(filePath => {
            this.generatePage(filePath, { baseDir: this.systemPagesDir });
        });
        
        // 设置每页文章数量
        const pageSize = this.config.pagination.pageSize || 5;
        const totalPosts = posts.length;
        const totalPages = Math.ceil(totalPosts / pageSize);
        
        // 生成所有分页页面
        const availableTags = this.collectTags(posts);

        for (let page = 1; page <= totalPages; page++) {
            this.generateIndex(posts, page, pageSize, availableTags);
        }
        
        // 生成RSS文件
        this.generateRSS(posts);

        // 生成搜索索引
        this.generateSearchIndex(posts);
        
        // 复制静态资源
        this.copyAssets();
        
        console.log('All pages generated successfully!');
    }

    /**
     * 生成RSS文件
     * @param {Array} posts - 文章信息数组
     */
    generateRSS(posts) {
        // 按日期排序，最新的在前面，只取最新的20篇文章
        const sortedPosts = posts.sort((a, b) => {
            const dateA = new Date(a.attributes.date || 0);
            const dateB = new Date(b.attributes.date || 0);
            return dateB - dateA;
        }).slice(0, 20);

        // 准备RSS数据
        const rssData = {
            title: this.config.site.title,
            description: this.config.site.description || '一个基于Markdown的静态博客',
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

        // 生成RSS XML
        const rssTemplate = this.getRSSTemplate();
        const template = compile(rssTemplate);
        const rssXml = template(rssData);

        // 写入RSS文件
        const rssPath = path.join(this.publicDir, 'rss.xml');
        fs.writeFileSync(rssPath, rssXml);
        
        console.log(`Generated RSS: ${rssPath}`);
    }

    /**
     * 获取RSS模板
     * @returns {string} RSS模板内容
     */
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

    /**
     * 复制静态资源
     */
    copyAssets() {
        // 复制样式文件
        const stylesSourceDir = path.join(__dirname, 'styles');
        const stylesTargetDir = path.join(this.publicDir, 'styles');
        
        if (fs.existsSync(stylesSourceDir)) {
            fs.copySync(stylesSourceDir, stylesTargetDir);
            console.log('Styles copied successfully!');
        }
        
        // 复制其他静态资源（如果存在public/assets目录）
        const assetsSourceDir = path.join(__dirname, 'public');
        if (fs.existsSync(assetsSourceDir) && assetsSourceDir !== this.publicDir) {
            fs.copySync(assetsSourceDir, this.publicDir);
            console.log('Other assets copied successfully!');
        } else if (assetsSourceDir === this.publicDir) {
            console.log('Assets directory is the same as target directory, skipping copy.');
        }
    }
}

module.exports = PageGenerator;
