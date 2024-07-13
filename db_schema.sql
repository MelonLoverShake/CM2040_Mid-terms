
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME,
  publishedAt DATETIME,
  ModifiedAt DATETIME,
  PostHistory TEXT,
  Views INTEGER DEFAULT 0,
  userId INTEGER,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER,
  text TEXT NOT NULL,
  createdAt DATETIME,
  comment_user TEXT NOT NULL,
  FOREIGN KEY (postId) REFERENCES Posts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    author TEXT NOT NULL
);


INSERT INTO Settings (title, subtitle, author) VALUES
('Ruby-Blog', 'The Process of Being a Role-player', 'RubyTheGriffin');

INSERT INTO Users (username, password, email) VALUES
('Ruby14', '$2b$10$DTRI1.nU4qN4WhJhQxyrBO4AKQs4b0qkfsNhThwiPvlKIRMrIAVuy', 'ruby14@gmail.com');


COMMIT;
