export declare namespace Components {
  namespace Schemas {
    export interface User {
      name: string;
      steamId: string;
    }

    export interface Game {
      name: string;
      appId: string;
      categories?: string | null;
    }
  }
}

export interface Dictionary<T> {
  [id: string]: T;
}
