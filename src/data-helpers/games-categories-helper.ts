import { closeDBConnection, connectToDB } from "./generic-helper";
import { Components } from "../types";
import Category = Components.Schemas.Category;
// import Game = Components.Schemas.Game;
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

export const getGameCategoriesFromDB = (appId: string) => {
  return new Promise<Category[]>((resolve, reject) => {
    const db = connectToDB();
    db.get(
      "SELECT category.id, category.description FROM categories as category LEFT OUTER JOIN games_categories AS gc ON gc.categoryid == category.id WHERE ug.appId IS (?) ",
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
