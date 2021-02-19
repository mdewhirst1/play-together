import {
  addUserGameCountToDB,
  addUserToDB,
  getUserFromDB
} from "./data-helpers/users-helper";
import {
  addUsersGamesToDB,
  checkUsersGamesInDB,
  getGamesForUserFromDB
} from "./data-helpers/users-games-helper";
import Axios from "axios";
import { apiKey } from "../key.json";
import {
  getAppDetailsSteamUrl,
  getGamesSteamUrl,
  getPlayerSummaries,
  multiPlayerCategories
} from "./steam-api-helpers/consts";
import { Components, Dictionary } from "./types";
import User = Components.Schemas.User;
import PartyPooper = Components.Schemas.PartyPooper;
import {
  addGameCategoriesToDB,
  checkGameCategoriesFromDB,
  getGamesWithCategoriesFromDB
} from "./data-helpers/games-categories-helper";
import Game = Components.Schemas.Game;

const dateOffset = 24 * 60 * 60 * 1000; //1 days
const expiryDate = new Date();
expiryDate.setTime(expiryDate.getTime() - dateOffset);

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
        steamId: steamData.steamid,
        gameCount: 0,
        // eslint-disable-next-line @typescript-eslint/camelcase
        last_updated: new Date()
      };
    });
  }

  return user;
};

const checkUserGames = async (steamId: string, name: string) => {
  const userGames = await checkUsersGamesInDB(steamId);

  if (userGames.count > 0 && userGames.lastUpdated > expiryDate) {
    return true;
  }

  //no games or out of date info found checking steam api
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
        games.forEach((game: Components.Schemas.SteamGame, index: number) => {
          games[index] = [game.appid, game.name];
        });
        //update db
        console.log(`updating DB for ${name} ...`);
        await addUserGameCountToDB(steamId, steamRes.game_count);
        await addUsersGamesToDB(games, steamId);
        return true;
      }
      console.log(
        `no games found for ${name} in steam, please check profile public settings`
      );
      await addUserGameCountToDB(steamId, 0);
      return false;
    })
    .catch(err => console.log(err));
};

const getUsers = async (
  steamIds: string[]
): Promise<[Dictionary<PartyPooper>, Dictionary<User>]> => {
  const partyPoopers: Dictionary<PartyPooper> = {};
  const enrichedUserData: Dictionary<User> = {};
  for (const steamId of steamIds) {
    const userData = await getUser(steamId);
    let userGames;
    if (
      userData.gameCount > 0 ||
      (userData.gameCount === 0 && userData.last_updated < expiryDate)
    ) {
      //don't check users that have already been checked today and have 0 games
      userGames = await checkUserGames(steamId, userData.name);
    }
    if (!userGames) {
      //party pooper found!!!1!
      partyPoopers[steamId] = { name: userData.name };
    } else {
      const games = await getGamesForUserFromDB(steamId);
      enrichedUserData[steamId] = { name: userData.name, games };
    }
  }
  return [partyPoopers, enrichedUserData];
};

const checkGameCategories = async (game: Game) => {
  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const appId = game.appId;
  const gameName = game.name;
  //todo add date last updated check
  const details = await checkGameCategoriesFromDB(appId);
  if (!details) {
    //todo remove sleep. Was added to try and avoid "Too Many Requests" errors
    await sleep(1000);
    return Promise.resolve(
      await Axios.get(getAppDetailsSteamUrl, {
        params: {
          appids: appId
        }
      })
        .then(async res => {
          if (res.data[appId].success) {
            const steamDetails = res.data[appId].data;
            await addGameCategoriesToDB(appId, steamDetails.categories);
            console.log(`categories updated found for: ${gameName}`);
            return;
          }
          console.log(`no categories found for: ${gameName}`);
          //add a null category so we don't keep checking for categories
          await addGameCategoriesToDB(appId, [
            { id: 404, description: "not found" }
          ]);
          return;
        })
        .catch(e => {
          if (e.response && e.response.statusText) {
            console.error(e.response.statusText);
          } else {
            console.error(e);
          }
          console.error(`was unable to get categories for: ${gameName}`);
          return;
        })
    );
  }
};

const filterGamesByMultiplayer = async (commonGames: any[]) => {
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

const main = async (steamIds: string[]) => {
  const [partyPoopers, players] = await getUsers(steamIds);

  if (Object.keys(players).length > 0) {
    console.log(
      "found games for these users:",
      Object.values(players).map(user => user.name)
    );
  }

  if (Object.keys(players).length < 2) {
    console.log("need at least 2 non party poopers to find common games");
    return;
  }

  let mostPeople = Math.round(Object.keys(players).length / 2);
  mostPeople = mostPeople >= 2 ? mostPeople : 2;
  console.log(
    `attempting to find common games that at least ${mostPeople} people have ...`
  );
  let gamesWithOwners: {
    appId: string;
    name: string;
    owners: string[];
  }[] = [];

  Object.keys(players).forEach(steamId => {
    const player = players[steamId];
    const games = player.games;
    games.forEach(game => {
      const foundIndex = gamesWithOwners.findIndex(x => x.appId === game.appId);
      if (foundIndex > 0) {
        gamesWithOwners[foundIndex].owners.push(player.name);
      } else {
        gamesWithOwners.push({
          appId: game.appId,
          name: game.name,
          owners: [player.name]
        });
      }
    });
  });

  //filter out games owned by less than half of players
  gamesWithOwners = gamesWithOwners.filter(
    game => game.owners.length >= mostPeople
  );

  if (gamesWithOwners.length < 1) {
    console.log("no common games found :(");
    return;
  }
  console.log(gamesWithOwners.length, "common games found.");

  console.log("fetching game details...");
  //todo this is the bit that is causing massive slow down in the filtering step, can it be improved
  let counter = 1;
  for (const game of gamesWithOwners) {
    console.log(
      `checking ${counter}/${gamesWithOwners.length} ${game.name} ...`
    );
    await checkGameCategories(game);
    counter++;
  }

  console.log("attempting to filter common games to multiplayer ones...");
  const commonMultiplayerGames = await filterGamesByMultiplayer(
    gamesWithOwners
  );

  if (commonMultiplayerGames.length < 1) {
    console.log("no common multiplayer games found :(");
    return;
  }

  //todo fix log to list all games, no truncation
  //todo improve formatting, only state owners once and include missing owners
  console.log(
    commonMultiplayerGames.length,
    "multi-player games found for:",
    Object.values(players).map(user => user.name)
  );

  if (Object.keys(partyPoopers).length > 0) {
    console.log(
      "no games found for these party poopers:",
      Object.values(partyPoopers).map(pooper => pooper.name),
      "shame"
    );
  }

  const multiplayerGamesByOwners: Dictionary<any[]> = {};
  commonMultiplayerGames.forEach(commonGame => {
    if (multiplayerGamesByOwners[commonGame.owners.length]) {
      multiplayerGamesByOwners[commonGame.owners.length].push(commonGame.name);
    } else {
      multiplayerGamesByOwners[commonGame.owners.length] = [commonGame.name];
    }
  });

  console.log(
    multiplayerGamesByOwners[Object.keys(players).length].length,
    "multiplayer games everyone owns: ",
    multiplayerGamesByOwners[Object.keys(players).length]
  );

  for (let i = Object.keys(players).length - 1; i >= mostPeople; i--) {
    console.log(
      multiplayerGamesByOwners[i].length,
      `multiplayer games owned by ${i} people: `,
      multiplayerGamesByOwners[i]
    );
  }

  //todo add party games to results? (games that only require one person to own eg jackbox games)
};

//this bit will grab steam ids from the command line
const steamIds: string[] = [];
for (let j = 2; j < process.argv.length; j++) {
  steamIds.push(process.argv[j]);
}

if (steamIds.length >= 2) {
  main(steamIds);
} else {
  console.log("Need at least two people to find common games");
}
