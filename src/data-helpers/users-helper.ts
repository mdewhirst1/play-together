import { closeDBConnection, connetToDB } from "./generic-helper";

export const getUserFromDB = (steamId: string) => {
  return new Promise<{ name: string; steamId: string }>((resolve, reject) => {
    const db = connetToDB();
    db.get("SELECT * FROM users WHERE steamId = (?)", steamId, (err, row) => {
      if (err) {
        reject(err);
      }
      resolve({
        name: row.name,
        steamId: row.steamId
      });
    });
    closeDBConnection(db);
  });
};
