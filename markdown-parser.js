const fs = require('fs-extra');
const path = require('path');
const fm = require('front-matter');
const markdownIt = require('markdown-it');

class MarkdownParser {
    constructor() {
        this.md = markdownIt({
            html: true,
            linkify: true,
            typographer: true
        });
    }

    /**
     * 解析Markdown文件，提取front-matter和内容
     * @param {string} filePath - Markdown文件路径
     * @returns {Object} 包含属性和内容的对象
     */
    parseFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = fm(content);
        
        // 移除正文中的第一个H1标题，避免与模板标题重复
        const bodyWithoutFirstH1 = this.removeFirstH1(parsed.body || '');
        
        return {
            attributes: parsed.attributes || {},
            body: parsed.body || '',
            html: this.md.render(bodyWithoutFirstH1)
        };
    }

    /**
     * 移除markdown内容中的第一个H1标题
     * @param {string} markdown - markdown内容
     * @returns {string} 移除第一个H1后的内容
     */
    removeFirstH1(markdown) {
        // 按行分割
        const lines = markdown.split('\n');
        let firstH1Found = false;
        const filteredLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 检查是否是H1标题 (# 开头，但不是 ## 或更多#)
            if (!firstH1Found && /^# [^#]/.test(line)) {
                firstH1Found = true;
                continue; // 跳过这一行
            }
            
            filteredLines.push(lines[i]);
        }
        
        return filteredLines.join('\n');
    }

    /**
     * 获取所有Markdown文件
     * @param {string} dir - 目录路径
     * @returns {Array} Markdown文件路径数组
     */
    getMarkdownFiles(dir) {
        const files = fs.readdirSync(dir);
        const markdownFiles = [];

        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 递归处理子目录
                markdownFiles.push(...this.getMarkdownFiles(fullPath));
            } else if (path.extname(file).toLowerCase() === '.md') {
                markdownFiles.push(fullPath);
            }
        });

        return markdownFiles;
    }
}

module.exports = MarkdownParser;