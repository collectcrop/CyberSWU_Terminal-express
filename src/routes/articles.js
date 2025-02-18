// routes/articles.js
const express = require('express');
const Article = require('../models/Article');
const router = express.Router();

// 获取所有文章的 API
router.get('/api/knowledge', async (req, res) => {
  try {
    const articles = await Article.find().populate('children');
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: '获取数据失败', error: err });
  }
});

// 递归处理文章及其子项
const saveArticleWithChildren = async (articleData) => {
  const { title, content, children } = articleData;

  // 创建新的文章
  const newArticle = new Article({
    title,
    content,
    children: [], // 初始化子文章数组
  });

  try {
    // 如果有子项，递归保存
    if (children && children.length > 0) {
      for (const child of children) {
        const savedChild = await saveArticleWithChildren(child); // 递归保存子文章
        newArticle.children.push(savedChild);
      }

      // await newArticle.save();
    }

    return newArticle;
  } catch (err) {
    throw err;
  }
};

router.post('/api/knowledge', async (req, res) => {
  const articlesData = req.body;

  // 判断传入的是单个文章还是多个文章（数组）
  if (Array.isArray(articlesData)) {
    try {
      // 如果是目录数组，逐个保存每个目录
      const savedArticles = [];
      for (const articleData of articlesData) {
        const savedArticle = await saveArticleWithChildren(articleData);
        await savedArticle.save();
        savedArticles.push(savedArticle);
      }

      // 返回所有保存的文章
      res.status(201).json(savedArticles);
    } catch (err) {
      res.status(400).json({ message: '创建目录失败', error: err });
    }
  } else {
    // 如果是单个目录对象，直接保存
    try {
      const savedArticle = await saveArticleWithChildren(articlesData);
      await savedArticle.save();
      res.status(201).json(savedArticle);
    } catch (err) {
      res.status(400).json({ message: '创建目录失败', error: err });
    }
  }
});

module.exports = router;