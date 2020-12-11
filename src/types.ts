export declare namespace Components {
  namespace Schemas {
    export interface User {
      name: string;
      steamId: string;
    }

    export interface Game {
      name: string;
      appid: string;
      categories?: string | null;
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
