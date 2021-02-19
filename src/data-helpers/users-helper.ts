import { closeDBConnection, connectToDB } from "./generic-helper";

export const getUserFromDB = (steamId: string) => {
  return new Promise<{
    name: string;
    steamId: string;
    gameCount: number;
    last_updated: Date;
  }>((resolve, reject) => {
    const db = connectToDB();
    db.get("SELECT * FROM users WHERE steamId = (?)", steamId, (err, row) => {
      if (err) {
        reject(err);
      }
      // eslint-disable-next-line @typescript-eslint/camelcase
      row.last_updated = new Date(row.last_updated);
      resolve(row);
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

export const addUserGameCountToDB = (steamId: string, gameCount: number) => {
  return new Promise((resolve, reject) => {
    const db = connectToDB();
    db.run(
      "UPDATE users SET gameCount = ? WHERE steamId = ?",
      [gameCount, steamId],
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
