// src/types/travel.ts
export type MicroSituation = {
    title: string;
    actions: string[];
    whatToDoInstead?: string;
  };
  
  export type ProblemCard = {
    headline: string;
    icon?: string;
    microSituations: MicroSituation[];
  };
  
  export type TravelPackTier = {
    title: string;
    cards: ProblemCard[];
  };
  
  export type TravelPack = {
    city: string;
    country: string;
    description?: string;
    downloadedAt?: string;
    offlineReady?: boolean;
    tiers: {
      tier1: TravelPackTier;
      tier2?: TravelPackTier;
    };
  };