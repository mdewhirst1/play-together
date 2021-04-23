import { closeDBConnection, connectToDB } from "./generic-helper";
import { Category } from "../types";

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
