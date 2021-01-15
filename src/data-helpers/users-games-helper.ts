import { closeDBConnection, connectToDB } from "./generic-helper";
import { addGamesToDB } from "./games-helper";

export const checkUsersGamesInDB = (steamId: string) => {
  return new Promise<{ count: number; lastUpdated: any }>((resolve, reject) => {
    const db = connectToDB();
    db.get(
      "SELECT count(appId), last_updated FROM users_games WHERE steamId = (?)",
      steamId,
      (err, row) => {
        if (err) {
          reject(err);
        }
        resolve({
          count: row["count(appId)"],
          lastUpdated: row.last_updated
        });
      }
    );
    closeDBConnection(db);
  });
};

// add games to db if they are not already in there and then updates games owned by user
export const addUsersGamesToDB = async (games: any[], steamId: string) => {
  await addGamesToDB(games)
    .catch(err => console.log(err))
    .then(() => {
      return new Promise((resolve, reject) => {
        const db = connectToDB();
        games.forEach(game => {
          db.run(
            "INSERT OR REPLACE INTO users_games (steamId, appId) VALUES (?, ?)",
            [steamId, game[0]],
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
    })
    .catch(err => console.log(err));
};

//  get games in common for users
export const getGamesInCommonFromDB = async (steamIds: string[]) => {
  const sqlPart =
    "SELECT DISTINCT g.appId, g.name FROM games as g LEFT OUTER JOIN users_games AS ug ON ug.appId == g.appId WHERE ug.steamId IS (?) ";
  const sqlQuery = steamIds.map(() => sqlPart).join(" INTERSECT ");
  return new Promise<{ appId: string; name: string }[]>((resolve, reject) => {
    const db = connectToDB();
    db.all(sqlQuery, steamIds, (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
    closeDBConnection(db);
  });
};
