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
        this.config = config;
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
    generatePage(filePath) {
        // 解析Markdown文件
        const parsed = this.parser.parseFile(filePath);
        
        // 计算相对路径和输出路径
        const relativePath = path.relative(this.pagesDir, filePath);
        const outputPath = this.getOutputPath(relativePath);
        
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        fs.ensureDirSync(outputDir);
        
        // 编译模板
        const template = compile(this.getTemplate('post.html'));
        
        // 准备模板数据
        const data = {
            title: parsed.attributes.title || '无标题',
            date: parsed.attributes.date || '',
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
    getOutputPath(relativePath) {
        const dir = path.dirname(relativePath);
        const name = path.basename(relativePath, '.md');
        return path.join(this.publicDir, dir, `${name}.html`);
    }

    /**
     * 生成首页
     * @param {Array} posts - 文章信息数组
     * @param {number} page - 当前页码，默认为1
     * @param {number} pageSize - 每页文章数量，默认为5
     */
    generateIndex(posts, page = 1, pageSize = 5) {
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
     * @returns {string} 摘要文本
     */
    getExcerpt(html) {
        // 移除HTML标签并截取前200个字符
        const text = html.replace(/<[^>]*>/g, '').trim();
        return text.length > 200 ? text.substring(0, 200) + '...' : text;
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

    /**
     * 生成所有页面
     */
    generateAll() {
        // 确保public目录存在
        fs.ensureDirSync(this.publicDir);
        
        // 获取所有Markdown文件
        const markdownFiles = this.parser.getMarkdownFiles(this.pagesDir);
        
        // 存储文章信息用于生成首页
        const posts = [];
        
        // 生成每个页面
        markdownFiles.forEach(filePath => {
            const parsed = this.parser.parseFile(filePath);
            posts.push({
                filePath: filePath,
                attributes: parsed.attributes,
                html: parsed.html
            });
            this.generatePage(filePath);
        });
        
        // 设置每页文章数量
        const pageSize = this.config.pagination.pageSize || 5;
        const totalPosts = posts.length;
        const totalPages = Math.ceil(totalPosts / pageSize);
        
        // 生成所有分页页面
        for (let page = 1; page <= totalPages; page++) {
            this.generateIndex(posts, page, pageSize);
        }
        
        // 复制静态资源
        this.copyAssets();
        
        console.log('All pages generated successfully!');
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