import { addUserToDB, getUserFromDB } from "./data-helpers/users-helper";
import {
  checkUsersGamesInDB,
  getGamesForUserFromDB
} from "./data-helpers/users-games-helper";
import Axios from "axios";
import { apiKey } from "../key.json";
import { getPlayerSummaries } from "./steam-api-helpers/consts";
import { Dictionary, Game, PartyPooper, User } from "./types";
import { checkGameCategoriesFromDB } from "./data-helpers/games-categories-helper";
import {
  filterGamesByMultiplayer,
  filterGamesByPartyCategories
} from "./filters/filters";
import { getGameDetailsFromDB } from "./data-helpers/games-helper";
import {
  getGameDetailsFromSteam,
  getUserGamesFromSteam
} from "./steamCalls/steamCalls";

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

const checkUserGames = async (steamId: string, playerName: string) => {
  const userGames = await checkUsersGamesInDB(steamId);

  if (userGames.count > 0 && userGames.lastUpdated > expiryDate) {
    return true;
  }

  //no games or out of date info found checking steam api
  return await getUserGamesFromSteam(steamId, playerName);
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

const checkGameCategories = async (game: Game): Promise<void> => {
  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const appId = game.appId;
  //todo add date last updated check
  const details = await checkGameCategoriesFromDB(appId);
  if (!details) {
    //todo remove sleep. Was added to try and avoid "Too Many Requests" errors
    await sleep(1000);
    await getGameDetailsFromSteam(game);
  }
};

const printGames = async (games: Game[], players: any[]) => {
  for (const game of games.sort((a, b) =>
    a.name > b.name ? 1 : b.name > a.name ? -1 : 0
  )) {
    const missing = players.filter(player => !game.owners!.includes(player));
    if (!game.price) {
      //fetch details from steam? or some check in db?
      await getGameDetailsFromSteam(game);
      game.price = (await getGameDetailsFromDB(game.appId)).price;
    }
    console.log(game.name);
    missing.length > 0
      ? console.log(
          missing,
          `need to get this, current price ${
            game.price ? `is ${game.price}` : "not found"
          } \n`
        )
      : "";
  }
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
  const gamesWithOwners: {
    appId: string;
    name: string;
    owners: string[];
  }[] = [];

  Object.keys(players).forEach(steamId => {
    const player = players[steamId];
    const games = player.games;
    games.forEach((game: Game) => {
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
  const gamesWithMostOwners = gamesWithOwners.filter(
    game => game.owners.length >= mostPeople
  );

  if (gamesWithMostOwners.length < 1) {
    console.log("no common games found :(");
    return;
  }
  console.log(gamesWithMostOwners.length, "common games found.");

  console.log("fetching game details...");
  //todo this is the bit that is causing massive slow down in the filtering step, can it be improved
  let counter = 1;
  for (const game of gamesWithMostOwners) {
    console.log(
      `checking ${counter}/${gamesWithMostOwners.length} ${game.name} ...`
    );
    await checkGameCategories(game);
    counter++;
  }

  console.log("attempting to filter common games to multiplayer ones...");
  const commonMultiplayerGames = await filterGamesByMultiplayer(
    gamesWithMostOwners
  );

  if (commonMultiplayerGames.length < 1) {
    console.log("no common multiplayer games found :(");
    return;
  }

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

  const multiplayerGamesByOwners: Dictionary<Game[]> = {};
  for (const commonGame of commonMultiplayerGames) {
    if (multiplayerGamesByOwners[commonGame.owners.length]) {
      multiplayerGamesByOwners[commonGame.owners.length].push({
        appId: commonGame.appId,
        name: commonGame.name,
        owners: commonGame.owners,
        price: (await getGameDetailsFromDB(commonGame.appId)).price
      });
    } else {
      multiplayerGamesByOwners[commonGame.owners.length] = [
        {
          appId: commonGame.appId,
          name: commonGame.name,
          owners: commonGame.owners,
          price: (await getGameDetailsFromDB(commonGame.appId)).price
        }
      ];
    }
  }

  for (let i = Object.keys(players).length; i >= mostPeople; i--) {
    console.log(
      multiplayerGamesByOwners[i].length,
      `multiplayer games owned by ${
        i === Object.keys(players).length ? "everyone" : `${i} people`
      }: `
    );
    await printGames(
      multiplayerGamesByOwners[i],
      Object.values(players).map(user => user.name)
    );
  }

  //find all games owned by any of players that have all categories from possiblePartyGames
  const partyGamesFound = await filterGamesByPartyCategories(gamesWithOwners);

  const formattedPartyGames: string[] = [];
  //format {name owners}
  partyGamesFound.forEach(partyGame => {
    if (!formattedPartyGames[partyGame.name]) {
      formattedPartyGames.push(partyGame.name);
    }
  });

  console.log(partyGamesFound.length, "possible party games found");
  console.log(
    "these games have the remote play together and multiplayer categories and may only require one person for all to play"
  );
  console.log(JSON.stringify(formattedPartyGames.sort(), null, 2));
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
