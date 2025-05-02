

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    order INTEGER DEFAULT 0,    -- 前端渲染显示顺序
    parent_id INTEGER REFERENCES tags(id) ON DELETE SET NULL  -- 支持多级分类，可选
);
UPDATE tags SET "order" = id;

CREATE TABLE challenge_tags (
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (challenge_id, tag_id)
);

CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    score INTEGER DEFAULT 1000,                     -- 分值
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,  -- 一级分类
    subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,  -- 二级分类
    difficulty VARCHAR(20),
    attachment_name VARCHAR(255),
    attachment_url TEXT,
    dockerfile_path TEXT,         -- Dockerfile 所在路径
    author_id INTEGER REFERENCES users(id)         -- 出题者，外键关联 users 表
    ON DELETE SET NULL,                          -- 删除用户时，保留题目信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solved_count INTEGER DEFAULT 0,
);

CREATE TABLE solves (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,        -- 解题用户
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE, -- 题目 ID
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                 -- 解题时间
    UNIQUE(user_id, challenge_id)                                  -- 防止重复记录
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
    order INTEGER DEFAULT 0,    -- 前端渲染显示顺序
);
UPDATE categories SET "order" = id;

CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE flags (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  flag TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX unique_dynamic_flag_per_user
ON flags (challenge_id, user_id)
WHERE is_dynamic = true;

CREATE INDEX idx_flags_user ON flags(user_id);
CREATE INDEX idx_flags_challenge ON flags(challenge_id);

CREATE TABLE solves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  challenge_id INTEGER NOT NULL REFERENCES challenges(id),
  solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, challenge_id) -- 保证一个人解一个题只记一次
);





INSERT INTO tags (name) VALUES ('crypto');
INSERT INTO tags (name) VALUES ('pwn');
INSERT INTO tags (name) VALUES ('web');
INSERT INTO tags (name) VALUES ('reverse');
INSERT INTO tags (name) VALUES ('misc');
INSERT INTO tags (name) VALUES ('ai');

INSERT INTO categories (name) VALUES  ('crypto'), ('pwn'), ('web'),('reverse'),('misc'),('ai');
INSERT INTO subcategories (name, category_id) VALUES
  ('ret2libc', 2),
  ('ret2syscall', 2),
  ('格式化字符串漏洞', 2);

INSERT INTO challenges (
  title, description, score, category_id, subcategory_id, difficulty, attachment_url, dockerfile_path, author_id
) VALUES 
(
  'Ret2libc Basics',
  'Exploit a binary using ret2libc to get a shell.',
  500,
  2, -- pwn
  1, -- ret2libc
  'easy',
  'http://example.com/files/ret2libc.zip',
  '/dockerfiles/pwn/ret2libc/',
  2
),
(
  'Stack Overflow 101',
  'Basic ret2syscall challenge.',
  600,
  2, -- pwn
  2, -- ret2syscall
  'medium',
  'http://example.com/files/stackof.zip',
  '/dockerfiles/pwn/stackof/',
  2
);
