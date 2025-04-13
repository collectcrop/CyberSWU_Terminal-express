// routes/articles.js
const express = require('express');
const Article = require('../models/Article');
const router = express.Router();

// 获取所有文章的 API
router.get('/api/knowledge', async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: '获取数据失败', error: err });
  }
});

// 获取特定文章
router.get('/api/knowledge/article/:id', async (req, res) => {
  const articleId = req.params.id;  // 从 URL 中获取 id

  try {
    // 获取所有树
    const knowledgeTrees = await Article.find();  // 假设每颗树作为一个文档存储在 Article 集合中

    // 递归查找目标文章
    const findArticleById = (node, targetId) => {
      if (node.index === targetId) {
        return node;  // 找到目标节点，返回
      }

      // 如果节点有子节点，则继续递归查找
      if (node.children) {
        for (const child of node.children) {
          const found = findArticleById(child, targetId);
          if (found) {
            return found;  // 如果找到，返回结果
          }
        }
      }

      return null;  // 如果没有找到，返回 null
    };

    // 遍历每颗树，递归查找目标文章
    let article = null;
    for (const tree of knowledgeTrees) {
      article = findArticleById(tree, articleId);
      if (article) {
        break;  // 找到目标文章后就跳出循环
      }
    }

    if (!article) {
      return res.status(404).send('Article not found');
    }
    res.json(article);  // 返回文章内容
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// 递归处理文章及其子项
const saveArticleWithChildren = async (articleData) => {
  const { title, content, children, index } = articleData;

  // 创建新的文章
  const newArticle = new Article({
    index,
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