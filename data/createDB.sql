--
-- File generated with SQLiteStudio v3.2.1 on Fri Feb 12 16:45:22 2021
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: categories
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (id INTEGER PRIMARY KEY, description STRING, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

-- Table: games
DROP TABLE IF EXISTS games;
CREATE TABLE games (appId TEXT PRIMARY KEY, name STRING, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

-- Table: games_categories
DROP TABLE IF EXISTS games_categories;
CREATE TABLE games_categories (appid STRING REFERENCES games (appId) NOT NULL, categoryid INTEGER REFERENCES categories (id) NOT NULL, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

-- Table: users
DROP TABLE IF EXISTS users;
CREATE TABLE users (name STRING, steamId TEXT PRIMARY KEY, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

-- Table: users_games
DROP TABLE IF EXISTS users_games;
CREATE TABLE users_games (steamId TEXT REFERENCES users (steamId) NOT NULL, appId TEXT REFERENCES games (appId) NOT NULL, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
