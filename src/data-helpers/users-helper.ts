import { closeDBConnection, connectToDB } from "./generic-helper";

export const getUserFromDB = (steamId: string) => {
  return new Promise<{ name: string; steamId: string }>((resolve, reject) => {
    const db = connectToDB();
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
    const db = connectToDB();
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
