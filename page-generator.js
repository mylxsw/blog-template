const fs = require('fs-extra');
const path = require('path');
const MarkdownParser = require('./markdown-parser');
const handlebars = require('handlebars');
const { compile } = require('handlebars');
const config = require('./config');

const X_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 2h4.96l4.38 5.72L17.88 2H22l-7.41 8.45L22 22h-4.96l-4.64-6.06L6.12 22H2l7.73-8.88L3 2Z"/></svg>';

const SOCIAL_ICON_SVGS = {
    github: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.865 10.934c.575.106.785-.25.785-.555c0-.274-.01-1.182-.016-2.146c-3.2.695-3.875-1.541-3.875-1.541c-.523-1.33-1.278-1.685-1.278-1.685c-1.046-.714.08-.699.08-.699c1.158.082 1.768 1.188 1.768 1.188c1.03 1.765 2.705 1.255 3.366.96c.104-.757.402-1.256.732-1.545c-2.555-.291-5.238-1.277-5.238-5.686c0-1.256.448-2.284 1.183-3.09c-.118-.29-.512-1.46.112-3.046c0 0 .965-.309 3.164 1.182a10.9 10.9 0 0 1 2.879-.388c.979.004 1.964.133 2.879.388c2.198-1.491 3.162-1.182 3.162-1.182c.626 1.586.232 2.756.114 3.046c.736.806 1.182 1.834 1.182 3.09c0 4.42-2.687 5.392-5.252 5.679c.414.357.782 1.062.782 2.14c0 1.546-.014 2.793-.014 3.173c0 .308.208.667.79.553A11.503 11.503 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"/></svg>',
    x: X_ICON_SVG,
    twitter: X_ICON_SVG,
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21.447 2.104a1.5 1.5 0 0 0-1.566-.197L2.65 9.32c-1.265.55-1.2 2.39.093 2.839l4.79 1.66l1.848 5.92a1.5 1.5 0 0 0 2.5.6l2.67-2.68l4.21 3.084c.996.73 2.402.168 2.65-1.059l3.07-15.52a1.5 1.5 0 0 0-.033-.86ZM9.23 12.46l9.01-5.52c.207-.127.425.158.24.325l-7.4 6.73a1 1 0 0 0-.311.6l-.29 2.33c-.03.24-.356.264-.43.032L9.23 12.46Z"/></svg>',
    wechat: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 3.5c-3.59 0-6.5 2.6-6.5 5.8c0 1.85 1.06 3.49 2.72 4.51l-.44 2.4l2.58-1.43c.49.1 1 .15 1.54.15c3.59 0 6.5-2.6 6.5-5.81c0-3.2-2.91-5.82-6.4-5.82Zm-2.4 5.12a1.02 1.02 0 1 1 0-2.04a1.02 1.02 0 0 1 0 2.04Zm4.8 0a1.02 1.02 0 1 1 0-2.04a1.02 1.02 0 0 1 0 2.04Z"/><path d="M22 14.4c0-3.01-2.82-5.45-6.2-5.45c-.27 0-.54.01-.8.04c.81 1.02 1.3 2.27 1.3 3.61c0 3.72-3.35 6.75-7.5 6.75c-.2 0-.39-.01-.58-.02C9.4 20.63 11.6 22 14.2 22c.48 0 .94-.04 1.39-.11l2.4 1.34l-.38-2.21C19.84 20.04 22 17.47 22 14.4Zm-7.65.57a.9.9 0 1 1 0-1.8a.9.9 0 0 1 0 1.8Zm3.85 0a.9.9 0 1 1 0-1.8a.9.9 0 0 1 0 1.8Z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 4.75A2.75 2.75 0 0 1 5.75 2h12.5A2.75 2.75 0 0 1 21 4.75v14.5A2.75 2.75 0 0 1 18.25 22H5.75A2.75 2.75 0 0 1 3 19.25V4.75Zm2.387.75l6.173 4.254L17.733 5.5H5.387Zm13.863 1.383l-6.934 4.773a1.25 1.25 0 0 1-1.432 0L3.95 6.883V19.25c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25V6.883Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5ZM3 8.75h3.96v11.5H3V8.75Zm6.04 0H13v1.58h.05c.55-1 1.88-2.05 3.87-2.05c4.14 0 4.9 2.72 4.9 6.26v5.71h-3.96v-5.07c0-1.21-.02-2.77-1.69-2.77c-1.69 0-1.95 1.32-1.95 2.68v5.16H9.04V8.75Z"/></svg>',
    rss: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.75 17a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0Zm-4.5-6.375c6.206 0 11.25 5.044 11.25 11.25h-2.625c0-4.75-3.875-8.625-8.625-8.625v-2.625Zm0-6.375C13.807 4.25 20.5 10.943 20.5 19.5h-2.625c0-7.222-5.878-13.125-13.125-13.125V4.25Z"/></svg>'
};

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

handlebars.registerHelper('t', function(key, options) {
    const translations = options?.data?.root?.translations || {};
    const fallback = options?.hash?.fallback ?? key;
    const value = key.split('.').reduce((acc, part) => (
        acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined
    ), translations);
    return typeof value === 'string' ? value : fallback;
});

handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context ?? {});
});

class PageGenerator {
    constructor() {
        this.parser = new MarkdownParser();
        this.publicDir = path.join(__dirname, 'public');
        this.templatesDir = path.join(__dirname, 'templates');
        this.pagesDir = path.join(__dirname, 'pages');
        this.systemPagesDir = path.join(this.pagesDir, 'system');
        this.config = config;
        this.defaultCategoryName = this.config.navigation?.categories?.defaultCategoryName || '其它';
        this.categoryBackgroundMap = this.prepareCategoryBackgroundMap();
        this.languages = this.prepareLanguages();
        this.languageMap = new Map(this.languages.map(lang => [lang.code, lang]));
        this.defaultLanguage = this.languages.find(lang => lang.isDefault) || this.languages[0];
    }

    prepareCategoryBackgroundMap() {
        const backgrounds = this.config.navigation?.categories?.backgrounds || {};
        const map = new Map();
        Object.entries(backgrounds).forEach(([key, value]) => {
            if (typeof value !== 'string') return;
            const trimmed = value.trim();
            if (!trimmed) return;
            const slug = this.slugify(key);
            if (!slug) return;
            map.set(slug, trimmed);
        });
        return map;
    }

    prepareLanguages() {
        const i18nConfig = this.config.i18n || {};
        const languagesConfig = i18nConfig.languages || {};
        const entries = Object.entries(languagesConfig);
        const defaultCode = i18nConfig.defaultLanguage || (entries.length ? entries[0][0] : 'default');

        const languages = entries.length
            ? entries.map(([code, langConfig]) => this.normalizeLanguageConfig(code, langConfig, code === defaultCode))
            : [this.normalizeLanguageConfig(defaultCode, {}, true)];

        const defaultLanguage = languages.find(lang => lang.code === defaultCode) || languages[0];
        languages.forEach(lang => {
            if (lang.code === defaultLanguage.code) {
                lang.translations = this.mergeTranslations({}, lang.translations);
            } else {
                lang.translations = this.mergeTranslations(defaultLanguage.translations, lang.translations);
            }
        });

        return languages;
    }

    normalizeLanguageConfig(code, langConfig = {}, isDefault = false) {
        const label = typeof langConfig.label === 'string' && langConfig.label.trim() ? langConfig.label.trim() : code.toUpperCase();
        const locale = typeof langConfig.locale === 'string' && langConfig.locale.trim() ? langConfig.locale.trim() : (isDefault ? 'en-US' : 'en-US');
        const rawPrefix = typeof langConfig.routePrefix === 'string' ? langConfig.routePrefix.trim() : '';
        const prefix = rawPrefix || (isDefault ? '' : code);
        const sanitizedPrefix = prefix.replace(/^\/+|\/+$/g, '');
        const urlPrefixSegments = sanitizedPrefix ? sanitizedPrefix.split('/').filter(Boolean) : [];

        return {
            code,
            label,
            locale,
            isDefault,
            routePrefix: sanitizedPrefix,
            urlPrefixSegments,
            translations: langConfig.translations || {},
            navigation: {
                moreLabel: langConfig.navigation?.moreLabel
                    || this.config.navigation?.categories?.moreLabel
                    || 'More',
                defaultCategoryName: langConfig.navigation?.defaultCategoryName
                    || this.config.navigation?.categories?.defaultCategoryName
                    || this.defaultCategoryName,
                topLevel: Array.isArray(langConfig.navigation?.topLevel)
                    ? langConfig.navigation.topLevel
                    : (Array.isArray(this.config.navigation?.categories?.topLevel)
                        ? this.config.navigation.categories.topLevel
                        : [])
            }
        };
    }

    mergeTranslations(base = {}, extension = {}) {
        const merge = (target, source) => {
            if (!source || typeof source !== 'object') {
                return target;
            }
            Object.keys(source).forEach(key => {
                const sourceValue = source[key];
                if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
                    target[key] = merge(
                        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? target[key] : {},
                        sourceValue
                    );
                } else {
                    target[key] = sourceValue;
                }
            });
            return target;
        };

        const baseClone = merge({}, base || {});
        return merge(baseClone, extension || {});
    }

    getTranslation(language, key) {
        if (!language || !key) return undefined;
        return key.split('.').reduce((acc, part) => {
            if (!acc || typeof acc !== 'object') return undefined;
            if (!Object.prototype.hasOwnProperty.call(acc, part)) return undefined;
            return acc[part];
        }, language.translations || {});
    }

    translate(language, key, fallback = '', replacements = {}) {
        const template = this.getTranslation(language, key);
        let text = typeof template === 'string' ? template : (fallback || key);
        Object.entries(replacements || {}).forEach(([name, value]) => {
            const pattern = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
            text = text.replace(pattern, String(value));
        });
        return text;
    }

    splitSegments(value) {
        const segments = [];
        const process = (segment) => {
            if (segment === undefined || segment === null) return;
            if (Array.isArray(segment)) {
                segment.forEach(process);
                return;
            }
            const str = String(segment);
            if (!str) return;
            str.split(/[\\/]+/).forEach(part => {
                const trimmed = part.trim();
                if (trimmed) segments.push(trimmed);
            });
        };
        process(value);
        return segments;
    }

    buildLanguageOutputPath(language, ...segments) {
        const parts = [this.publicDir];
        const prefix = Array.isArray(language?.urlPrefixSegments) ? language.urlPrefixSegments : [];
        if (prefix.length) {
            parts.push(...prefix);
        }
        segments.forEach(segment => {
            const segParts = this.splitSegments(segment);
            if (segParts.length) {
                parts.push(...segParts);
            }
        });
        return path.join(...parts);
    }

    buildLanguageUrl(language, segments = [], { trailingSlash = false } = {}) {
        const prefix = Array.isArray(language?.urlPrefixSegments) ? language.urlPrefixSegments : [];
        const extra = this.splitSegments(segments);
        const combined = [...prefix, ...extra];
        if (!combined.length) {
            return trailingSlash ? '/' : '/';
        }
        let url = `/${combined.join('/')}`;
        if (trailingSlash) {
            url = url.replace(/\/?$/, '/');
        }
        return url;
    }

    getSiteUrl(language, segments = [], { trailingSlash = false } = {}) {
        const baseUrl = (this.config.site.url || 'http://localhost:8080').replace(/\/$/, '');
        const pathPart = this.buildLanguageUrl(language, segments, { trailingSlash });
        if (pathPart === '/') {
            return trailingSlash ? `${baseUrl}/` : baseUrl;
        }
        return `${baseUrl}${pathPart}`;
    }

    isLanguageSegment(segment, language) {
        if (!segment || !language) return false;
        const normalized = String(segment).trim().toLowerCase();
        if (!normalized) return false;
        if (normalized === String(language.code).toLowerCase()) return true;
        if (language.routePrefix && normalized === language.routePrefix.toLowerCase()) return true;
        const firstPrefix = Array.isArray(language.urlPrefixSegments) && language.urlPrefixSegments.length ? language.urlPrefixSegments[0].toLowerCase() : '';
        if (firstPrefix && normalized === firstPrefix) return true;
        return false;
    }

    resolveLanguage(filePath, declaredLang, { isSystemPage = false } = {}) {
        const declaredCode = typeof declaredLang === 'string' ? declaredLang.trim() : '';
        if (declaredCode && this.languageMap.has(declaredCode)) {
            return this.languageMap.get(declaredCode);
        }

        const relative = path.relative(this.pagesDir, filePath);
        const segments = relative.split(path.sep).filter(Boolean);
        if (isSystemPage) {
            if (segments.length > 1) {
                const candidate = segments[1];
                if (this.languageMap.has(candidate)) {
                    return this.languageMap.get(candidate);
                }
            }
        } else if (segments.length) {
            const candidate = segments[0];
            if (this.languageMap.has(candidate)) {
                return this.languageMap.get(candidate);
            }
        }

        return this.defaultLanguage;
    }

    getLanguageRelativePath(relativePath, language, { isSystemPage = false } = {}) {
        const segments = relativePath.split(path.sep).filter(Boolean);
        if (isSystemPage) {
            segments.shift();
        }
        if (segments.length && this.isLanguageSegment(segments[0], language)) {
            segments.shift();
        }
        return segments.join(path.sep);
    }

    buildLanguageSwitcher(currentLanguage) {
        if (!Array.isArray(this.languages) || this.languages.length <= 1) {
            return [];
        }
        return this.languages.map(language => ({
            code: language.code,
            label: language.label,
            url: this.buildLanguageUrl(language, [], { trailingSlash: true }),
            active: language.code === currentLanguage.code
        }));
    }

    getSocialIconMarkup(iconKey) {
        if (!iconKey) return '';
        const normalized = String(iconKey).toLowerCase();
        if (Object.prototype.hasOwnProperty.call(SOCIAL_ICON_SVGS, normalized)) {
            return SOCIAL_ICON_SVGS[normalized];
        }
        return '';
    }

    createBaseTemplateData(language, navigation, availableTags = []) {
        const tags = Array.isArray(availableTags) ? availableTags : [];
        const icpText = (this.config.footer?.icp?.text || '').trim();
        const icpLink = (this.config.footer?.icp?.link || '').trim();
        const analyticsHead = typeof this.config.analytics?.head === 'string' ? this.config.analytics.head : '';
        const analyticsBodyEnd = typeof this.config.analytics?.bodyEnd === 'string' ? this.config.analytics.bodyEnd : '';
        const footerNote = (this.config.footer?.note || '').trim();
        const rawSocial = Array.isArray(this.config.footer?.social) ? this.config.footer.social : [];
        const socialLinks = rawSocial
            .map(item => {
                if (!item || typeof item !== 'object') return null;
                const url = typeof item.url === 'string' ? item.url.trim() : '';
                if (!url) return null;
                const label = typeof item.label === 'string' ? item.label.trim() : '';
                const iconKey = typeof item.icon === 'string' ? item.icon.trim().toLowerCase() : '';
                const icon = this.getSocialIconMarkup(iconKey);
                const fallback = label ? label.charAt(0).toUpperCase() : (url.replace(/https?:\/\//i, '').charAt(0).toUpperCase() || '');
                return {
                    label,
                    url,
                    icon,
                    fallback,
                    iconKey
                };
            })
            .filter(Boolean);
        return {
            site: this.config.site,
            navigation,
            language: {
                code: language.code,
                locale: language.locale,
                label: language.label
            },
            translations: language.translations,
            availableTags: tags,
            hasTagFilters: tags.length > 0,
            assets: {
                rss: this.buildLanguageUrl(language, 'rss.xml'),
                sitemap: this.buildLanguageUrl(language, 'sitemap.xml'),
                search: this.buildLanguageUrl(language, 'search.json')
            },
            clientTranslations: language.translations,
            footer: {
                icp: {
                    text: icpText,
                    link: icpLink
                },
                note: footerNote,
                social: socialLinks
            },
            analytics: {
                head: analyticsHead,
                bodyEnd: analyticsBodyEnd
            }
        };
    }

    buildPagination(currentPage, totalPages, language) {
        const pages = [];
        for (let page = 1; page <= totalPages; page++) {
            const url = page === 1
                ? this.buildLanguageUrl(language, [], { trailingSlash: true })
                : this.buildLanguageUrl(language, ['page', String(page)], { trailingSlash: true });
            pages.push({
                number: page,
                url,
                isCurrent: page === currentPage
            });
        }

        const hasPrev = currentPage > 1;
        const hasNext = currentPage < totalPages;
        const prevUrl = hasPrev
            ? (currentPage - 1 === 1
                ? this.buildLanguageUrl(language, [], { trailingSlash: true })
                : this.buildLanguageUrl(language, ['page', String(currentPage - 1)], { trailingSlash: true }))
            : '';
        const nextUrl = hasNext
            ? this.buildLanguageUrl(language, ['page', String(currentPage + 1)], { trailingSlash: true })
            : '';

        return {
            currentPage,
            totalPages,
            hasPrev,
            hasNext,
            prevUrl,
            nextUrl,
            pages
        };
    }

    minifyHtml(html) {
        if (typeof html !== 'string' || !html.length) {
            return '';
        }
        const placeholders = [];
        const preservePattern = /<(pre|code|textarea|script)([\s\S]*?)<\/\1>/gi;
        let minified = html.replace(preservePattern, (match) => {
            const token = `___HTML_PLACEHOLDER_${placeholders.length}___`;
            placeholders.push({ token, content: match });
            return token;
        });

        minified = minified
            .replace(/\r?\n+/g, '\n')
            .replace(/>\s+</g, '><')
            .replace(/\s*\n\s*/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

        placeholders.forEach(({ token, content }) => {
            const tokenRegex = new RegExp(token, 'g');
            minified = minified.replace(tokenRegex, content);
        });

        return minified;
    }

    writeHtml(outputPath, html) {
        const finalHtml = this.minifyHtml(html);
        fs.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, finalHtml);
        console.log(`Generated: ${outputPath}`);
    }

    formatDate(dateStr, language) {
        if (!dateStr) return { formatted: '', iso: '' };
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return { formatted: '', iso: '' };
        const locale = language?.locale || this.defaultLanguage?.locale || 'en-US';
        const formatted = d.toLocaleDateString(locale, {
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

    getTagUrl(tagName, language) {
        const slug = this.slugify(tagName);
        return this.buildLanguageUrl(language, ['tags', slug], { trailingSlash: true });
    }

    getCategoryUrl(categoryName, language) {
        const slug = this.slugify(categoryName);
        return this.buildLanguageUrl(language, ['categories', slug], { trailingSlash: true });
    }

    getTagsWithUrls(tags = [], language) {
        return this.normalizeTags(tags).map(name => ({
            name,
            slug: this.slugify(name),
            url: this.getTagUrl(name, language)
        }));
    }

    getCategoryForPost(category, language) {
        const name = this.normalizeCategory(category);
        if (!name) return null;
        return {
            name,
            slug: this.slugify(name),
            url: this.getCategoryUrl(name, language),
            backgroundImage: this.categoryBackgroundMap.get(this.slugify(name)) || ''

        };
    }

    getOutputPath(relativePath, language, outputSubDir = '') {
        const dir = path.dirname(relativePath);
        const name = path.basename(relativePath, '.md');
        const segments = [];
        if (outputSubDir) {
            segments.push(...this.splitSegments(outputSubDir));
        }
        if (dir && dir !== '.' && dir !== path.sep) {
            segments.push(...dir.split(path.sep).filter(Boolean));
        }
        segments.push(`${name}.html`);
        return this.buildLanguageOutputPath(language, segments);
    }

    getRelativeUrl(relativePath, language, outputSubDir = '') {
        const dir = path.dirname(relativePath);
        const name = path.basename(relativePath, '.md');
        const segments = [];
        if (outputSubDir) {
            segments.push(...this.splitSegments(outputSubDir));
        }
        if (dir && dir !== '.' && dir !== path.sep) {
            segments.push(...dir.split(path.sep).filter(Boolean));
        }
        segments.push(`${name}.html`);
        return this.buildLanguageUrl(language, segments);
    }

    getExcerpt(html, maxLength = 200) {
        const text = html.replace(/<[^>]*>/g, '').trim();
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }

    collectTags(posts, language) {
        const tagMap = new Map();
        posts.forEach(post => {
            const tags = this.normalizeTags(post.attributes.tags);
            tags.forEach(tag => {
                if (!tagMap.has(tag)) {
                    tagMap.set(tag, {
                        name: tag,
                        slug: this.slugify(tag),
                        url: this.getTagUrl(tag, language),
                        count: 0
                    });
                }
                tagMap.get(tag).count += 1;
            });
        });
        const locale = language?.locale || this.defaultLanguage?.locale || undefined;
        return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name, locale));
    }

    collectCategories(posts, language) {
        const categoryMap = new Map();
        posts.forEach(post => {
            const categoryName = this.normalizeCategory(post.attributes.category);
            if (!categoryName) return;
            const slug = this.slugify(categoryName);
            if (!categoryMap.has(slug)) {
                categoryMap.set(slug, {
                    name: categoryName,
                    slug,
                    url: this.getCategoryUrl(categoryName, language),
                    count: 0,
                    backgroundImage: this.categoryBackgroundMap.get(slug) || ''
                });
            }
            categoryMap.get(slug).count += 1;
        });
        const locale = language?.locale || this.defaultLanguage?.locale || undefined;
        return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name, locale));
    }

    buildNavigation(categories, language, options = {}) {
        const topLevel = Array.isArray(language?.navigation?.topLevel)
            ? language.navigation.topLevel
            : (this.config.navigation?.categories?.topLevel || []);
        const moreLabel = language?.navigation?.moreLabel || this.config.navigation?.categories?.moreLabel || 'More';
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

        const defaultCategoryName = language?.navigation?.defaultCategoryName || this.defaultCategoryName;
        const defaultIndex = more.findIndex(category => category.name === defaultCategoryName);
        if (defaultIndex > -1) {
            const [defaultCategory] = more.splice(defaultIndex, 1);
            more.push(defaultCategory);
        }

        if (primary.length === 0 && more.length > 0) {
            const fallback = more.splice(0, Math.min(3, more.length));
            primary.push(...fallback);
        }

        const languages = this.buildLanguageSwitcher(language);
        const showLanguageSwitcher = this.config.i18n?.showLanguageSwitcher !== false
            && Array.isArray(languages)
            && languages.length > 1;

        return {
            activePage: options.activePage || '',
            activeCategorySlug: options.activeCategorySlug || '',
            categories: {
                primary,
                more,
                moreLabel,
                hasCategories: primary.length > 0 || more.length > 0,
                defaultCategoryName
            },
            homeUrl: this.buildLanguageUrl(language, [], { trailingSlash: true }),
            aboutUrl: this.buildLanguageUrl(language, 'about.html'),
            filterLabel: this.translate(language, 'nav.filter', 'Filter'),
            toggleMenuLabel: this.translate(language, 'nav.toggleMenu', 'Toggle menu'),
            languages: showLanguageSwitcher ? languages : languages.slice(0, 1),
            hasLanguageSwitcher: showLanguageSwitcher
        };
    }

    buildListingItem(post, language, { includeExcerpt = true } = {}) {
        const { formatted: dateFormatted, iso: dateISO } = this.formatDate(post.attributes.date, language);
        const tags = this.getTagsWithUrls(post.attributes.tags, language);
        const category = this.getCategoryForPost(post.attributes.category, language);
        return {
            title: post.attributes.title || this.translate(language, 'content.untitled', 'Untitled'),
            url: this.getRelativeUrl(post.relativePath, language),
            coverImage: post.attributes.coverImage || '',
            excerpt: includeExcerpt ? this.getExcerpt(post.html) : '',
            dateFormatted,
            dateISO,
            tags,
            category
        };
    }

    getRecommendedPosts(currentPost, allPosts, language, limit = 3) {
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
            recommended.push(this.buildListingItem(candidate.post, language, { includeExcerpt: false }));
            used.add(candidate.post.filePath);
        });

        if (recommended.length < limit) {
            const additional = allPosts
                .filter(post => post.filePath !== currentPost.filePath && !used.has(post.filePath))
                .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
            additional.forEach(post => {
                if (recommended.length >= limit) return;
                recommended.push(this.buildListingItem(post, language, { includeExcerpt: false }));
            });
        }

        return recommended.slice(0, limit);
    }

    generatePostPage(post, allPosts, categories, availableTags, language) {
        const template = compile(this.getTemplate('post.html'));
        const { formatted: dateFormatted, iso: dateISO } = this.formatDate(post.attributes.date, language);
        const category = this.getCategoryForPost(post.attributes.category, language);
        const navigation = this.buildNavigation(categories, language, {
            activeCategorySlug: category?.slug || ''
        });

        const seoKeywords = this.normalizeSeoKeywords(post.attributes.seo);
        const recommendedPosts = this.getRecommendedPosts(post, allPosts, language);
        const metaDescription = this.getExcerpt(post.html, 160);

        const baseData = this.createBaseTemplateData(language, navigation, availableTags);
        const data = {
            ...baseData,
            title: post.attributes.title || this.translate(language, 'content.untitled', 'Untitled'),
            date: post.attributes.date || '',
            dateFormatted,
            dateISO,
            tags: this.getTagsWithUrls(post.attributes.tags, language),
            coverImage: post.attributes.coverImage || '',
            content: post.html,
            category,
            seoKeywords,
            recommendedPosts,
            hasRecommendations: recommendedPosts.length > 0,
            metaDescription
        };

        const outputPath = this.getOutputPath(post.relativePath, language);
        this.writeHtml(outputPath, template(data));
    }

    generateSystemPage(page, categories, availableTags, language) {
        const template = compile(this.getTemplate('post.html'));
        const { formatted: dateFormatted, iso: dateISO } = this.formatDate(page.attributes.date, language);
        const navigation = this.buildNavigation(categories, language, {
            activePage: path.basename(page.relativePath, '.md')
        });

        const baseData = this.createBaseTemplateData(language, navigation, availableTags);
        const data = {
            ...baseData,
            title: page.attributes.title || this.translate(language, 'content.untitled', 'Untitled'),
            date: page.attributes.date || '',
            dateFormatted,
            dateISO,
            tags: this.getTagsWithUrls(page.attributes.tags, language),
            coverImage: page.attributes.coverImage || '',
            content: page.html,
            category: null,
            seoKeywords: this.normalizeSeoKeywords(page.attributes.seo),
            recommendedPosts: [],
            hasRecommendations: false,
            metaDescription: this.getExcerpt(page.html, 160)
        };

        const outputPath = this.getOutputPath(page.relativePath, language);
        this.writeHtml(outputPath, template(data));
    }

    generateIndex(posts, page = 1, pageSize = 5, availableTags = [], categories = [], language) {
        const sortedPosts = [...posts].sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
        const totalPosts = sortedPosts.length;
        const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalPosts);
        const pagePosts = sortedPosts.slice(startIndex, endIndex);

        const template = compile(this.getTemplate('index.html'));
        const navigation = this.buildNavigation(categories, language, { activePage: page === 1 ? 'home' : '' });
        const baseData = this.createBaseTemplateData(language, navigation, availableTags);

        const data = {
            ...baseData,
            title: this.config.site.title,
            posts: pagePosts.map(post => this.buildListingItem(post, language)),
            pagination: this.buildPagination(page, totalPages, language),
            hasPosts: pagePosts.length > 0
        };

        const outputPath = page === 1
            ? this.buildLanguageOutputPath(language, 'index.html')
            : this.buildLanguageOutputPath(language, ['page', String(page), 'index.html']);

        this.writeHtml(outputPath, template(data));
    }

    generateListingPage({ title, heading, posts, outputPath, navigation, availableTags, language }) {
        const template = compile(this.getTemplate('listing.html'));
        const baseData = this.createBaseTemplateData(language, navigation, availableTags);
        const data = {
            ...baseData,
            title,
            heading,
            posts,
            hasPosts: Array.isArray(posts) && posts.length > 0
        };
        this.writeHtml(outputPath, template(data));
    }

    generateTagPages(tags, posts, categories, allTags, language) {
        tags.forEach(tag => {
            const taggedPosts = posts
                .filter(post => this.normalizeTags(post.attributes.tags).includes(tag.name))
                .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
            if (!taggedPosts.length) return;

            const heading = {
                title: `#${tag.name}`,
                description: this.translate(language, 'tags.description', `${tag.count} posts`, { count: tag.count }),
                type: 'tag'
            };
            const outputPath = this.buildLanguageOutputPath(language, ['tags', tag.slug, 'index.html']);
            const navigation = this.buildNavigation(categories, language, {});

            const titleSuffix = this.translate(language, 'tags.pageTitleSuffix', 'Tags');
            this.generateListingPage({
                title: `${tag.name} · ${titleSuffix} · ${this.config.site.title}`,
                heading,
                posts: taggedPosts.map(post => this.buildListingItem(post, language)),
                outputPath,
                navigation,
                availableTags: Array.isArray(allTags) ? allTags : tags,
                language
            });
        });
    }

    generateCategoryPages(categories, posts, availableTags, language) {
        categories.forEach(category => {
            const categoryPosts = posts
                .filter(post => this.normalizeCategory(post.attributes.category) === category.name)
                .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0));
            if (!categoryPosts.length) return;

            const heading = {
                title: category.name,
                description: this.translate(language, 'categories.description', `${category.count} posts`, { count: category.count }),
                type: 'category',
                backgroundImage: category.backgroundImage || ''
            };
            const outputPath = this.buildLanguageOutputPath(language, ['categories', category.slug, 'index.html']);
            const navigation = this.buildNavigation(categories, language, { activeCategorySlug: category.slug });

            const titleSuffix = this.translate(language, 'categories.pageTitleSuffix', 'Categories');
            this.generateListingPage({
                title: `${category.name} · ${titleSuffix} · ${this.config.site.title}`,
                heading,
                posts: categoryPosts.map(post => this.buildListingItem(post, language)),
                outputPath,
                navigation,
                availableTags,
                language
            });
        });
    }

    generateRSS(posts, language) {
        const sortedPosts = [...posts]
            .sort((a, b) => new Date(b.attributes.date || 0) - new Date(a.attributes.date || 0))
            .slice(0, 20);

        const siteRoot = (this.config.site.url || 'http://localhost:8080').replace(/\/$/, '');
        const description = this.config.site.description || this.translate(language, 'messages.rssDescription', 'Static blog powered by Markdown');
        const rssData = {
            title: this.config.site.title,
            description,
            link: this.getSiteUrl(language, [], { trailingSlash: true }),
            feedUrl: this.getSiteUrl(language, 'rss.xml'),
            language: (language?.locale || 'en-US').toLowerCase(),
            lastBuildDate: new Date().toUTCString(),
            pubDate: new Date().toUTCString(),
            items: sortedPosts.map(post => {
                const relativeUrl = this.getRelativeUrl(post.relativePath, language);
                const postUrl = `${siteRoot}${relativeUrl}`;
                return {
                    title: post.attributes.title || this.translate(language, 'content.untitled', 'Untitled'),
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

        const rssPath = this.buildLanguageOutputPath(language, 'rss.xml');
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
    <atom:link href="{{feedUrl}}" rel="self" type="application/rss+xml" />
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

    generateSearchIndex(posts, language) {
        const indexItems = posts.map(post => {
            const { formatted: dateFormatted, iso: dateISO } = this.formatDate(post.attributes.date, language);
            const tags = this.normalizeTags(post.attributes.tags);
            const plainText = post.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            return {
                title: post.attributes.title || this.translate(language, 'content.untitled', 'Untitled'),
                url: this.getRelativeUrl(post.relativePath, language),
                excerpt: this.getExcerpt(post.html, 220),
                tags,
                tagLinks: tags.map(name => ({
                    name,
                    slug: this.slugify(name),
                    url: this.getTagUrl(name, language)
                })),
                date: post.attributes.date || '',
                dateFormatted,
                dateISO,
                coverImage: post.attributes.coverImage || '',
                category: this.getCategoryForPost(post.attributes.category, language),
                content: plainText
            };
        });

        const searchPath = this.buildLanguageOutputPath(language, 'search.json');
        fs.writeFileSync(searchPath, JSON.stringify({ generatedAt: new Date().toISOString(), posts: indexItems }, null, 2));
        console.log(`Generated search index: ${searchPath}`);
    }

    generateSitemap({ posts, categories, tags, totalPages, systemPages, language }) {
        const urls = [];
        const siteUrl = (this.config.site.url || 'http://localhost:8080').replace(/\/$/, '');
        const changefreq = this.config.seo?.changeFrequency || 'weekly';
        const homePriority = this.config.seo?.homePriority || 1.0;
        const defaultPriority = this.config.seo?.defaultPriority || 0.6;

        const today = new Date().toISOString().split('T')[0];
        const homePath = this.buildLanguageUrl(language, [], { trailingSlash: true });
        urls.push({
            loc: `${siteUrl}${homePath === '/' ? '' : homePath}`,
            lastmod: today,
            changefreq,
            priority: homePriority
        });

        for (let page = 2; page <= totalPages; page++) {
            const pagePath = this.buildLanguageUrl(language, ['page', String(page)], { trailingSlash: true });
            urls.push({
                loc: `${siteUrl}${pagePath}`,
                lastmod: today,
                changefreq,
                priority: defaultPriority
            });
        }

        posts.forEach(post => {
            const loc = `${siteUrl}${this.getRelativeUrl(post.relativePath, language)}`;
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
            const loc = `${siteUrl}${this.getRelativeUrl(page.relativePath, language)}`;
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
        const sitemapPath = this.buildLanguageOutputPath(language, 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemap);
        console.log(`Generated sitemap: ${sitemapPath}`);
        return this.getSiteUrl(language, 'sitemap.xml');
    }

    generateRobots(sitemapUrls = []) {
        const lines = ['User-agent: *', 'Allow: /', ''];
        const uniqueSitemaps = Array.from(new Set(sitemapUrls.filter(Boolean)));
        uniqueSitemaps.forEach(url => {
            lines.push(`Sitemap: ${url}`);
        });
        if (uniqueSitemaps.length === 0) {
            const siteUrl = (this.config.site.url || 'http://localhost:8080').replace(/\/$/, '');
            lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
        }
        const robotsContent = `${lines.join('\n')}\n`;
        const robotsPath = path.join(this.publicDir, 'robots.txt');
        fs.writeFileSync(robotsPath, robotsContent);
        console.log(`Generated robots.txt: ${robotsPath}`);
    }

    generateAdsTxt() {
        const adsConfig = this.config.advertising || {};
        const adsPath = path.join(this.publicDir, 'ads.txt');
        if (adsConfig.disabled) {
            if (fs.existsSync(adsPath)) {
                fs.removeSync(adsPath);
                console.log('Advertising disabled; existing ads.txt removed.');
            } else {
                console.log('Advertising disabled; ads.txt generation skipped.');
            }
            return;
        }

        const publisherId = typeof adsConfig.publisherId === 'string' ? adsConfig.publisherId.trim() : '';
        if (!publisherId) {
            if (fs.existsSync(adsPath)) {
                fs.removeSync(adsPath);
                console.log('No publisher ID configured; existing ads.txt removed.');
            } else {
                console.log('No publisher ID configured; ads.txt not generated.');
            }
            return;
        }

        const content = `# Google AdSense verification\ngoogle.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
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
        const contentByLanguage = new Map();
        this.languages.forEach(language => {
            contentByLanguage.set(language.code, { posts: [], systemPages: [] });
        });

        markdownFiles.forEach(filePath => {
            const relativeToPages = path.relative(this.pagesDir, filePath);
            const isSystemPage = systemDirExists && !path.relative(this.systemPagesDir, filePath).startsWith('..');
            const parsed = this.parser.parseFile(filePath);
            const language = this.resolveLanguage(filePath, parsed.attributes?.lang, { isSystemPage }) || this.defaultLanguage;
            const container = contentByLanguage.get(language.code) || contentByLanguage.get(this.defaultLanguage.code);
            const relativePath = this.getLanguageRelativePath(relativeToPages, language, { isSystemPage }) || path.basename(filePath);

            const attributes = { ...parsed.attributes };
            attributes.tags = this.normalizeTags(attributes.tags);
            attributes.category = this.normalizeCategory(attributes.category);
            attributes.seo = this.normalizeSeoKeywords(attributes.seo);
            attributes.lang = language.code;
            if (!isSystemPage && !attributes.category) {
                attributes.category = language.navigation?.defaultCategoryName || this.defaultCategoryName;
            }

            const pageData = {
                filePath,
                relativePath,
                attributes,
                html: parsed.html,
                language
            };

            if (isSystemPage) {
                container.systemPages.push(pageData);
            } else {
                container.posts.push(pageData);
            }
        });

        const sitemapUrls = [];

        this.languages.forEach(language => {
            const { posts = [], systemPages = [] } = contentByLanguage.get(language.code) || {};
            const categories = this.collectCategories(posts, language);
            const availableTags = this.collectTags(posts, language);
            const pageSize = this.config.pagination.pageSize || 5;
            const totalPosts = posts.length;
            const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

            posts.forEach(post => {
                this.generatePostPage(post, posts, categories, availableTags, language);
            });

            systemPages.forEach(page => {
                this.generateSystemPage(page, categories, availableTags, language);
            });

            for (let pageIndex = 1; pageIndex <= totalPages; pageIndex++) {
                this.generateIndex(posts, pageIndex, pageSize, availableTags, categories, language);
            }

            this.generateTagPages(availableTags, posts, categories, availableTags, language);
            this.generateCategoryPages(categories, posts, availableTags, language);
            this.generateRSS(posts, language);
            this.generateSearchIndex(posts, language);
            const sitemapUrl = this.generateSitemap({ posts, categories, tags: availableTags, totalPages, systemPages, language });
            if (sitemapUrl) {
                sitemapUrls.push(sitemapUrl);
            }
        });

        this.generateRobots(sitemapUrls);
        this.generateAdsTxt();
        this.copyAssets();

        console.log('All pages generated successfully!');
    }
}

module.exports = PageGenerator;
