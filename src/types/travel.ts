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
  imageUrl?: string;      // Added for UI
  thumbnailUrl?: string;  // Added for UI
  updatedAt?: string;     // Added for versioning
  createdAt?: string;     // Added for versioning
  downloadedAt?: string;  // Essential for recovery logic
  offlineReady?: boolean; // Essential for PWA status
  tiers: {
    tier1: TravelPackTier;
    tier2?: TravelPackTier;
    tier3?: TravelPackTier;
    tier4?: TravelPackTier;
  };
};