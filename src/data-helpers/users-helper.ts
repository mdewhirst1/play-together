import { closeDBConnection, connetToDB } from "./generic-helper";
import { Components } from "../types";

export const getUserFromDB = (steamId: string) => {
  return new Promise<Components.Schemas.User>((resolve, reject) => {
    const db = connetToDB();
    db.get("SELECT * FROM users WHERE steamId = (?)", steamId, (err, row) => {
      if (err) {
        reject(err);
      }
      if (row && row.name && row.steamId) {
        resolve({
          name: row.name,
          steamId: row.steamId
        });
      }
      resolve();
    });
    closeDBConnection(db);
  });
};

export const addUserToDB = (steamId: string, name: string) => {
  return new Promise((resolve, reject) => {
    const db = connetToDB();
    db.run(
      "INSERT OR IGNORE INTO users (steamId, name) VALUES (?, ?)",
      [steamId, name],
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
