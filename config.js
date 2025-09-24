module.exports = {
    site: {
        title: '人人链向未来',
        description: '不分职业背景，共同迈入去中心时代',
        author: 'mylxsw',
        url: 'http://localhost:8080', // RSS需要的站点URL
        copyrightYear: new Date().getFullYear()
    },
    pagination: {
        pageSize: 10,
    },
    navigation: {
        categories: {
            /**
             * 指定导航栏中直接展示的分类名称，按照数组顺序显示。
             * 未列出的分类会被归入“更多”下拉菜单中。
             */
            topLevel: ['技术洞察', '去中心化', '产品观察'],
            /**
             * 自定义“更多”菜单的文案。
             */
            moreLabel: '更多',
            /**
             * 未指定分类的文章会被归入的默认分类名称。
             */
            defaultCategoryName: '其它',
            /**
             * 可选：为分类页配置背景图。
             * key 可以是分类名称或 slug。
             */
            backgrounds: {
                // '技术洞察': '/assets/categories/tech.jpg'
            }
        }
    },
    seo: {
        /**
         * sitemap 与 robots 等文件使用的默认更新频率
         */
        changeFrequency: 'weekly',
        /**
         * sitemap 中首页的优先级
         */
        homePriority: 1.0,
        /**
         * sitemap 中普通页面的默认优先级
         */
        defaultPriority: 0.6
    },
    advertising: {
        /**
         * Google AdSense 等广告联盟要求的 ads.txt 中的发布者 ID。
         * 请替换为真实 ID。
         */
        publisherId: 'pub-0000000000000000'
    }
};
