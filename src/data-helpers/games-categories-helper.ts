import { closeDBConnection, connectToDB } from "./generic-helper";
import { Category } from "../types";
import { addCategoryToDB } from "./category-helper";

export const addGameCategoriesToDB = async (
  appId: string,
  categories: Category[]
) => {
  await addCategoryToDB(categories)
    .catch(err => console.log(err))
    .then(() => {
      return new Promise((resolve, reject) => {
        const db = connectToDB();
        categories.forEach(category => {
          db.run(
            "INSERT OR IGNORE INTO games_categories (appid, categoryid) VALUES (?, ?)",
            [appId, category.id],
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
    });
};

export const checkGameCategoriesFromDB = (appId: string) => {
  return new Promise((resolve, reject) => {
    const db = connectToDB();
    db.get(
      "SELECT category.id, category.description FROM categories as category LEFT OUTER JOIN games_categories AS gc ON gc.categoryid == category.id WHERE gc.appId IS (?) ",
      appId,
      (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(!!row);
      }
    );
    closeDBConnection(db);
  });
};

export const getGamesWithCategoriesFromDB = (
  appIds: string[],
  categoryIds: number[]
) => {
  return new Promise<string[]>((resolve, reject) => {
    const db = connectToDB();
    db.all(
      "SELECT DISTINCT appid FROM games_categories WHERE appid IN (" +
        appIds.map(() => "?").join(",") +
        ") AND categoryid IN (" +
        categoryIds.map(() => "?").join(",") +
        ") ",
      [...appIds, ...categoryIds],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        const result = rows.map(row => row.appid.toString());
        resolve(result);
      }
    );
    closeDBConnection(db);
  });
};

export const getGamesWithAllCategoriesFromDB = (
  appIds: string[],
  categoryIds: number[]
) => {
  const sqlString =
    "SELECT games.appId FROM games as games LEFT OUTER JOIN games_categories AS gc ON gc.appid == games.appId where gc.categoryid == ?";
  const sqlBuilder = categoryIds.map(() => sqlString).join(" INTERSECT ");
  return new Promise<string[]>((resolve, reject) => {
    const db = connectToDB();
    db.all(
      "SELECT games.appId FROM games as games LEFT OUTER JOIN games_categories AS gc ON gc.appid == games.appId where games.appid in (" +
        appIds.map(() => "?").join(",") +
        ") INTERSECT " +
        sqlBuilder,
      [...appIds, ...categoryIds],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        const result = rows.map(row => row.appId.toString());
        resolve(result);
      }
    );
    closeDBConnection(db);
  });
};
