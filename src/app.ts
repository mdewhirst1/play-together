import { addUserToDB, getUserFromDB } from "./data-helpers/users-helper";
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
  getPlayerSummaries,
  multiPlayerCategories
} from "./steam-api-helpers/consts";
import { Components, Dictionary } from "./types";
import Category = Components.Schemas.Category;

const getUser = async (steamId: string) => {
  //try to get user from db
  const user = await getUserFromDB(steamId);

  if (!user) {
    return await Axios.get(getPlayerSummaries, {
      params: {
        key: apiKey,
        steamids: steamId
      }
    }).then(async res => {
      console.log(res.data.response.players[0]);
      const steamData = res.data.response.players[0];
      await addUserToDB(steamData.steamid, steamData.personaname);
      return {
        name: steamData.personaname,
        steamId: steamData.steamid
      };
    });
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
        //turn games into insert-able format
        const games = steamRes.games;
        games.forEach(
          (game: Components.Schemas.Game, index: string | number) => {
            games[index] = [game.appid, game.name];
          }
        );
        console.log(games);
        //update db
        return await addUsersGamesToDB(games, steamId).then(() => true);
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

const getGameCategories = async (appId: string): Promise<Category[]> => {
  const details = await getGameCategoriesFromDB(appId);
  if (!details) {
    return Promise.resolve(
      await Axios.get(getAppDetailsSteamUrl, {
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
        .catch(e => {
          console.log(e);
          return [];
        })
    );
  }
  return details;
};

const filterGamesByMultiplayer = async (commonGames: any) => {
  const commonMultiplayerGames = [];
  //todo maybe chunk requests into (100?) batches with a wait after each?
  for (const game of commonGames) {
    const categories = await getGameCategories(game.appId);
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

const combinations = (
  players: string[]
): { group: string[]; missing: string }[] => {
  //todo make this find combinations with more than 1 player removed
  const result: { group: string[]; missing: string }[] = [];
  players.forEach(playerFilter => {
    result.push({
      group: players.filter(player => player !== playerFilter),
      missing: playerFilter
    });
  });
  return result;
};

const main = async (steamIds: string[]) => {
  const [partyPoopers, players] = await getUsers(steamIds);

  if (Object.keys(partyPoopers).length > 0) {
    console.log("party poopers found:", partyPoopers);
  }

  if (Object.keys(players).length > 0) {
    console.log("found games for these users:", players);
  }

  if (Object.keys(players).length < 2) {
    console.log("need at least 2 non party poopers to find common games");
    return;
  }

  console.log("attempting to find common games for users...");
  const commonGames = await getGamesInCommonFromDB(Object.keys(players));
  if (commonGames.length < 1) {
    console.log("no common games found :(");
    return;
  }
  console.log(commonGames.length, "common games found:", commonGames);

  console.log("attempting to filter common games to multiplayer ones...");
  const commonMultiplayerGames = await filterGamesByMultiplayer(commonGames);
  if (commonMultiplayerGames.length < 1) {
    console.log("no common multiplayer games found :(");
    return;
  }
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

  if (Object.keys(players).length > 2) {
    console.log("attempting to find common games that 1 person doesn't have");
    const groupCombos = combinations(Object.keys(players));
    console.log(groupCombos);
  }

  //todo find games n-1 people have
  // if (Object.keys(players).length > 2) {
  //   console.log("attempting to find common games most people have");
  //   for (
  //     let groupSize = Object.keys(players).length - 1;
  //     groupSize >= 2;
  //     groupSize--
  //   ) {
  //     console.log(
  //       `attempting to find common games owned by ${groupSize} people`
  //     );
  //     console.log(combinations(Object.keys(players), groupSize));
  //   }
  // }
  //todo add party games to results?
};

//this bit will grab steam ids from the command line
const steamIds: string[] = [];
for (let j = 2; j < process.argv.length; j++) {
  console.log(j + " -> " + process.argv[j]);
  steamIds.push(process.argv[j]);
}

if (steamIds.length >= 2) {
  main(steamIds);
} else {
  console.log("Need at least two people to find common games");
}
