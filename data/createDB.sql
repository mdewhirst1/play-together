--
-- File generated with SQLiteStudio v3.2.1 on Fri Feb 19 17:29:59 2021
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: categories
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (id INTEGER PRIMARY KEY NOT NULL UNIQUE ON CONFLICT REPLACE, description STRING, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL) WITHOUT ROWID;

-- Table: games
DROP TABLE IF EXISTS games;
CREATE TABLE games (appId TEXT PRIMARY KEY NOT NULL UNIQUE ON CONFLICT REPLACE, name STRING, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL) WITHOUT ROWID;

-- Table: games_categories
DROP TABLE IF EXISTS games_categories;
CREATE TABLE games_categories (appid STRING REFERENCES games (appId) NOT NULL, categoryid INTEGER REFERENCES categories (id) NOT NULL, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, PRIMARY KEY (appid, categoryid) ON CONFLICT REPLACE);

-- Table: users
DROP TABLE IF EXISTS users;
CREATE TABLE users (name STRING, steamId TEXT PRIMARY KEY NOT NULL UNIQUE ON CONFLICT REPLACE, gameCount INTEGER DEFAULT (0), last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL) WITHOUT ROWID;

-- Table: users_games
DROP TABLE IF EXISTS users_games;
CREATE TABLE users_games (steamId TEXT REFERENCES users (steamId) NOT NULL, appId TEXT REFERENCES games (appId) NOT NULL, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, PRIMARY KEY (steamId, appId) ON CONFLICT REPLACE) WITHOUT ROWID;

-- Trigger: users last_updated update
DROP TRIGGER IF EXISTS "users last_updated update";
CREATE TRIGGER "users last_updated update" AFTER UPDATE ON users FOR EACH ROW WHEN NEW.last_updated = OLD.last_updated BEGIN UPDATE users SET last_updated = CURRENT_TIMESTAMP WHERE steamId = OLD.steamId; END;

-- Trigger: users_games last_updated update
DROP TRIGGER IF EXISTS "users_games last_updated update";
CREATE TRIGGER "users_games last_updated update" AFTER UPDATE ON users_games WHEN NEW.last_updated = OLD.last_updated BEGIN UPDATE users SET last_updated = CURRENT_TIMESTAMP WHERE steamId = OLD.steamId; END;

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
