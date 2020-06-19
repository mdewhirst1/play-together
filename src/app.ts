import { getUserFromDB } from "./data-helpers/users-helper";
import {
  addUsersGamesToDB,
  checkUsersGamesInDB,
  getGamesInCommonFromDB
} from "./data-helpers/users-games-helper";
import Axios from "axios";
import { apiKey } from "../key.json";
import {
  getGameCategoriesFromDB,
  UpdateGameInDB
} from "./data-helpers/games-helper";
import {
  getAppDetailsSteamUrl,
  getGamesSteamUrl,
  multiPlayerCategories
} from "./steam-api-helpers/consts";
import { Components, Dictionary } from "./types";

const getUser = async (steamId: string) => {
  //try to get user from db
  const user = await getUserFromDB(steamId);

  if (!user) {
    //todo get from steam api and add to db
  }

  return user;
};

const checkUserGames = async (steamId: string) => {
  //try to find games in db
  const userGames = await checkUsersGamesInDB(steamId);

  //todo check last update on game
  if (userGames.count > 0) {
    return true;
  }

  //no games found checking steam api
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
        //turn games into insertable format
        const games = steamRes.games;
        games.forEach(
          (game: Components.Schemas.Game, index: string | number) => {
            games[index] = [game.appId, game.name];
          }
        );
        //update db
        await addUsersGamesToDB(games, steamId);
        return true;
      }
      // todo add a way to only check users that have no games once a day?
      return false;
    })
    .catch(err => console.log(err));
};

const getUsers = async (steamIds: string[]) => {
  const partyPoopers: Dictionary<{ name: string }> = {};
  const enrichedUserData: Dictionary<{ name: string }> = {};
  for (const steamId of steamIds) {
    const userData = await getUser(steamId);
    const userGames = await checkUserGames(steamId);
    if (!userGames) {
      //party pooper found!!!1!
      partyPoopers[steamId] = { name: userData.name };
    } else {
      enrichedUserData[steamId] = { name: userData.name };
      // enrichedUserData[steamId].games = userGames; todo is this needed?
    }
  }
  return [partyPoopers, enrichedUserData];
};

const getGameCategories = async (appId: string) => {
  const details = await getGameCategoriesFromDB(appId);
  if (!details) {
    return await Axios.get(getAppDetailsSteamUrl, {
      params: {
        appids: appId
      }
    })
      .then(res => {
        if (res.data[appId].success) {
          const steamDetails = res.data[appId].data;
          UpdateGameInDB(
            appId,
            steamDetails.name,
            JSON.stringify(steamDetails.categories)
          );
          return steamDetails.categories;
        }
        return [];
      })
      .catch(e => console.log(e));
  }
  return details;
};

const filterGamesByMultiplayer = async (commonGames: any) => {
  const commonMultiplayerGames = [];
  //todo maybe chunk requests into (100?) batches with a wait after each?
  for (const game of commonGames) {
    const categories: any[] = await getGameCategories(game.appId);
    //if categories contains one of the multiplayer categories add to list
    if (
      categories
        .map(category => category.id)
        .some(category =>
          multiPlayerCategories
            .map(multiPlayerCategory => multiPlayerCategory.id)
            .includes(category)
        )
    ) {
      commonMultiplayerGames.push(game);
    }
  }

  return commonMultiplayerGames;
};

const main = async (steamIds: string[]) => {
  const [partyPoopers, players] = await getUsers(steamIds);

  if (Object.keys(partyPoopers).length > 0) {
    console.log("party poopers found:", partyPoopers);
  }

  if (Object.keys(players).length > 0) {
    console.log("found games for these users:", players);
  }

  if (Object.keys(players).length > 1) {
    console.log("attempting to find common games for users...");
    const commonGames = await getGamesInCommonFromDB(Object.keys(players));
    if (commonGames.length > 0) {
      console.log(commonGames.length, "common games found:", commonGames);
      console.log("attempting to filter common games to multiplayer ones...");
      const commonMultiplayerGames = await filterGamesByMultiplayer(
        commonGames
      );
      if (commonMultiplayerGames.length > 0) {
        console.log(
          commonMultiplayerGames.length,
          "common multi-player games found for:",
          Object.values(players).map(user => user.name),
          commonMultiplayerGames
        );
        if (Object.keys(partyPoopers).length > 0) {
          console.log(
            "no games found for these party poopers:",
            Object.values(partyPoopers).map(pooper => pooper.name),
            "shame"
          );
        }
      } else {
        console.log("no common multiplayer games found :(");
      }
    } else {
      console.log("no common games found :(");
    }
  }

  //todo find games n-1 people have maybe when greater than 2?
  //todo add party games to results?

  if (steamIds.includes("76561198075241793")) {
    console.log("LOW SALT LEVELS DETECTED PLAY CS IMMEDIATELY !!!1!uno");
  }
};

main([
  // "76561197962348172", // BlueNovember
  // "76561197963604152", // Sarah
  "76561197991832554", // Dan
  // "76561198005421655", // Eagle
  // "76561198009777530", // Rob
  // "76561198026808627", // Crux
  "76561198040733783", // AggrievedSpark
  "76561198056906429", // Matthew
  // "76561198075241793", // David
  // "76561198075305674" // Shaun
  "76561198096214189" // Shelby
]);
