import { closeDBConnection, connectToDB } from "./generic-helper";
import { Components } from "../types";
import Category = Components.Schemas.Category;

export const addCategoryToDB = (categories: Category[]) => {
  return new Promise((resolve, reject) => {
    const db = connectToDB();
    categories.forEach(category => {
      db.run(
        "INSERT OR IGNORE INTO categories (id, description) VALUES (?, ?)",
        [category.id, category.description],
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
