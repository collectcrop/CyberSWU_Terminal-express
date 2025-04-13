const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  index: {
    type: String, 
    unique: true,  // 确保每个文章有一个唯一的 id,用来作为路由
  },
  title: String,
  content: String,
  author: String,
  composedDate: Date,
  editDate: Date,
  children: [{ type: Object }],
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;