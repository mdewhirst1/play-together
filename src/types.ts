export declare namespace Components {
  namespace Schemas {
    export interface User {
      name: string;
      games: Game[];
    }

    export interface PartyPooper {
      name: string;
    }

    export interface Game {
      name: string;
      appId: string;
      categories?: string | null;
      price?: string;
    }

    export interface SteamGame {
      name: string;
      appid: string;
    }

    export interface Category {
      id: number;
      description: string;
    }
  }
}

export interface Dictionary<T> {
  [id: string]: T;
}
