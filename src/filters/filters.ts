import {
  getGamesWithAllCategoriesFromDB,
  getGamesWithCategoriesFromDB
} from "../data-helpers/games-categories-helper";
import {
  multiPlayerCategories,
  possiblePartyGames
} from "../steam-api-helpers/consts";

export const filterGamesByMultiplayer = async (commonGames: any[]) => {
  return await getGamesWithCategoriesFromDB(
    commonGames.map(game => game.appId),
    multiPlayerCategories.map(category => category.id)
  )
    .then(res => {
      return commonGames.filter(game => res.includes(game.appId));
    })
    .catch(e => {
      console.error(e);
      console.error("was unable to filter games to multiplayer ones");
      return [];
    });
};

export const filterGamesByPartyCategories = async (commonGames: any[]) => {
  return await getGamesWithAllCategoriesFromDB(
    commonGames.map(game => game.appId),
    possiblePartyGames.map(category => category.id)
  )
    .then(res => {
      return commonGames.filter(game => res.includes(game.appId));
    })
    .catch(e => {
      console.error(e);
      console.error("was unable to filter games to party ones");
      return [];
    });
};
