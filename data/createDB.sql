--
-- File generated with SQLiteStudio v3.2.1 on Fri May 1 14:04:24 2020
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: games
DROP TABLE IF EXISTS games;
CREATE TABLE games (appId TEXT PRIMARY KEY, name STRING, categories STRING, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

-- Table: users
DROP TABLE IF EXISTS users;
CREATE TABLE users (name STRING, steamId TEXT PRIMARY KEY, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

-- Table: users_games
DROP TABLE IF EXISTS users_games;
CREATE TABLE users_games (steamId TEXT REFERENCES users (steamId) NOT NULL, appId TEXT REFERENCES games (appId) NOT NULL, last_updated DATETIME DEFAULT (CURRENT_TIMESTAMP));

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
