import { closeDBConnection, connectToDB } from "./generic-helper";
import { Components } from "../types";

//adds games to db if they are not already in there
export const addGamesToDB = (games: Components.Schemas.Game[]) => {
  return new Promise((resolve, reject) => {
    const db = connectToDB();
    games.forEach(game => {
      db.run(
        "INSERT OR REPLACE INTO games (appId, name) VALUES (?, ?)",
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

export const addGameDetailsToDB = (appId: string, price: string) => {
  return new Promise((resolve, reject) => {
    const db = connectToDB();
    db.run(
      "UPDATE games SET price = ? WHERE appId = ?",
      [price, appId],
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

export const getGameDetailsFromDB = (appId: string) => {
  return new Promise<{ price: string }>((resolve, reject) => {
    const db = connectToDB();
    db.get(
      "SELECT games.price FROM games WHERE appId = ?",
      [appId],
      (err: any, row: any) => {
        if (err) {
          reject(err);
        }
        resolve(row);
      }
    );
    closeDBConnection(db);
  });
};
