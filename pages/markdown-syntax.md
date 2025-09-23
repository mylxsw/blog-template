---
title: Markdown语法指南
date: 2023-04-10
tags: [markdown, syntax, guide]
coverImage: https://images.unsplash.com/photo-1495640388908-05fa85288e61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80
---

# Markdown语法指南

这篇文章将介绍常用的Markdown语法。

## 标题

使用 `#` 来表示标题，支持1-6级标题：

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

## 列表

### 无序列表

- 项目1
- 项目2
- 项目3

### 有序列表

1. 第一项
2. 第二项
3. 第三项

## 链接和图片

[链接文本](https://example.com)

![图片描述](https://example.com/image.jpg)

## 强调

*斜体* 或 _斜体_
**粗体** 或 __粗体__
~~删除线~~

## 引用

> 这是一个引用块
> 可以跨越多行

## 代码

行内代码：`console.log('Hello')`

代码块：
```javascript
function hello() {
  console.log('Hello, World!');
}
```

## 表格

| 左对齐 | 居中对齐 | 右对齐 |
| :----- | :-----: | -----: |
| 内容1  | 内容2   | 内容3  |
| 内容4  | 内容5   | 内容6  |