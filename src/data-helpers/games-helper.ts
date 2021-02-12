import { closeDBConnection, connectToDB } from "./generic-helper";
import { Components } from "../types";

//adds games to db if they are not already in there
export const addGamesToDB = (games: Components.Schemas.Game[]) => {
  return new Promise((resolve, reject) => {
    const db = connectToDB();
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
