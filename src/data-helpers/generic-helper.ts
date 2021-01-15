import * as path from "path";
import sqlite3 from "sqlite3";

const dbPath = path.resolve(__dirname, "../../data/play-together-db.db");

export const connectToDB = () =>
  new sqlite3.Database(dbPath, err => {
    if (err) {
      console.error(err.message);
    }
  });

export const closeDBConnection = (db: sqlite3.Database) => {
  db.close(err => {
    if (err) {
      console.error(err);
    }
  });
};
