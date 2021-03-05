export const multiPlayerCategories = [
  {
    id: 1,
    description: "Multi-player"
  },
  {
    id: 9,
    description: "Co-op"
  },
  {
    id: 38,
    description: "Online Co-op"
  },
  {
    id: 44,
    description: "Remote Play Together"
  },
  {
    id: 39,
    description: "Shared/Split Screen Co-op"
  },
  {
    id: 24,
    description: "Shared/Split Screen"
  },
  {
    id: 37,
    description: "Shared/Split Screen PvP"
  }
];

//Party games are games only one person needs for everyone to play (eg the jackbox party pack)
//As steam doesn't have a party game category these are the closest
//However some games with these categories will not be party games
export const possiblePartyGames = [
  {
    id: 1,
    description: "Multi-player"
  },
  {
    id: 41,
    description: "Remote Play on Phone"
  },
  {
    id: 44,
    description: "Remote Play Together"
  }
];

export const getGamesSteamUrl =
  "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/";

export const getAppDetailsSteamUrl =
  "https://store.steampowered.com/api/appdetails";

export const getPlayerSummaries =
  "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/";
