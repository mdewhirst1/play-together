import { closeDBConnection, connectToDB } from "./generic-helper";
import { Components } from "../types";
import Category = Components.Schemas.Category;
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
      "SELECT DISTINCT game.appId FROM games_categories as game LEFT OUTER JOIN categories AS category ON game.categoryid == category.id WHERE game.appId IN (" +
        appIds.map(() => "?").join(",") +
        ") AND category.id IN (" +
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
