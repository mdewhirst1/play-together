import Axios from "axios";
import {
  getAppDetailsSteamUrl,
  getGamesSteamUrl
} from "../steam-api-helpers/consts";
import { addGameCategoriesToDB } from "../data-helpers/games-categories-helper";
import { addGameDetailsToDB } from "../data-helpers/games-helper";
import { Game, SteamGame } from "../types";
import { apiKey } from "../../key.json";
import { addUserGameCountToDB } from "../data-helpers/users-helper";
import { addUsersGamesToDB } from "../data-helpers/users-games-helper";

export const getGameDetailsFromSteam = async (
  game: Game
): Promise<{ price: string } | void | undefined> => {
  const appId = game.appId;
  const gameName = game.name;
  // console.log("debug", game);
  return Promise.resolve(
    await Axios.get(getAppDetailsSteamUrl, {
      params: {
        appids: appId,
        cc: "GBP"
      }
    })
      .then(async res => {
        if (res.data[appId].success) {
          const steamDetails = res.data[appId].data;
          await addGameCategoriesToDB(appId, steamDetails.categories);
          let price = null;
          if (
            steamDetails.price_overview &&
            steamDetails.price_overview.final_formatted
          ) {
            price = steamDetails.price_overview.final_formatted;
            await addGameDetailsToDB(appId, price);
          } else if (steamDetails.is_free) {
            await addGameDetailsToDB(appId, "Free");
          }
          console.log(`details updated for: ${gameName}`);
          return;
        }
        console.log(`no details found for: ${gameName}`);
        //add a null category so we don't keep trying to update
        await addGameCategoriesToDB(appId, [
          { id: 404, description: "not found" }
        ]);
        await addGameDetailsToDB(appId, "N/A");
        return;
      })
      .catch(e => {
        if (e.response && e.response.statusText) {
          console.error(e.response.statusText);
        } else {
          console.error(e);
        }
        console.error(`was unable to get details for: ${gameName}`);
        return;
      })
  );
};

export const getUserGamesFromSteam = async (
  steamId: string,
  playerName: string
) => {
  return await Axios.get(getGamesSteamUrl, {
    params: {
      key: apiKey,
      steamid: steamId,
      // eslint-disable-next-line @typescript-eslint/camelcase
      include_appinfo: 1
    }
  })
    .then(async res => {
      const steamRes = res.data.response;
      if (steamRes.game_count && steamRes.game_count > 0) {
        //turn games into insert-able format
        const games = steamRes.games;
        games.forEach((game: SteamGame, index: number) => {
          games[index] = [game.appid, game.name];
        });
        //update db
        console.log(`updating DB for ${playerName} ...`);
        await addUserGameCountToDB(steamId, steamRes.game_count);
        await addUsersGamesToDB(games, steamId);
        return true;
      }
      console.log(
        `no games found for ${playerName} in steam, please check profile privacy settings`
      );
      await addUserGameCountToDB(steamId, 0);
      return false;
    })
    .catch(err => console.log(err));
};
