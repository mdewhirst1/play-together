import { closeDBConnection, connetToDB } from "./generic-helper";
import { Components } from "../types";

//adds games to db if they are not already in there
export const addGamesToDB = (games: Components.Schemas.Game[]) => {
  return new Promise((resolve, reject) => {
    const db = connetToDB();
    games.forEach(game => {
      db.run(
        "INSERT OR IGNORE INTO games (appId, name) VALUES (?, ?)",
        game,
        (err: any) => {
          if (err) {
            reject(err);
          }
        }
      );
    });
    resolve();
    closeDBConnection(db);
  });
};

//get game categories
export const getGameCategoriesFromDB = (appId: string) => {
  return new Promise<string[]>((resolve, reject) => {
    const db = connetToDB();
    db.get(
      "SELECT categories FROM games WHERE appId = (?)",
      appId,
      (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(JSON.parse(row.categories));
      }
    );
    closeDBConnection(db);
  });
};

export const UpdateGameInDB = (
  appId: string,
  name: string,
  categories: string
) => {
  return new Promise((resolve, reject) => {
    const db = connetToDB();
    db.run(
      "INSERT OR REPLACE INTO games (appId, name, categories) VALUES (?, ?, ?)",
      [appId, name, categories],
      (err: any) => {
        if (err) {
          reject(err);
        }
      }
    );
    resolve();
    closeDBConnection(db);
  });
};
