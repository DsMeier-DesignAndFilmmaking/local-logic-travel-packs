/**
 * TypeScript type definitions for Travel Packs MVP
 * 
 * NOTE: The canonical TravelPack type is defined in @/types/travel.ts
 * This file contains legacy and alternative type definitions.
 */

/**
 * High-value offline-first travel pack structure
 * Used by transformTravelInsights and packPrioritization utilities
 */
export interface OfflineTravelPack {
  city: string;
  version: string;
  lastUpdated: string;
  context: string;
  mustKnowFirst: string[];
  neighborhoods: {
    name: string;
    whyItMatters: string;
    bestFor: string;
  }[];
  eatLikeALocal: string[];
  avoidTheseMistakes: string[];
  offlineTips: string[];
}

// Legacy types - kept for backward compatibility but not actively used
// The canonical TravelPack type is in @/types/travel.ts
export interface City {
  id: string;
  name: string;
  country: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  thumbnailUrl?: string;
}

export interface SimplePack {
  city: string;
  activities: string[];
  restaurants: string[];
  tips: string[];
}

export interface PackContent {
  itinerary?: ItineraryDay[];
  recommendations?: {
    restaurants?: Recommendation[];
    hotels?: Recommendation[];
    attractions?: Recommendation[];
  };
  tips?: string[];
  emergency?: {
    emergencyNumber?: string;
    police?: string;
    medical?: string;
    usEmbassy?: string;
  };
  [key: string]: unknown; // Allow additional content fields
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
}

export interface Activity {
  name: string;
  time: string;
  duration: string;
  location: string;
  notes?: string;
}

export interface Recommendation {
  name: string;
  type?: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  notes?: string;
}

export interface Pack {
  id: string;
  city: string;
  country: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  updatedAt?: string;
  createdAt?: string;
  content?: PackContent;
  metadata?: {
    generatedBy?: string;
    generatedAt?: string;
    version?: string;
    [key: string]: unknown;
  };
}

export interface DownloadStatus {
  packId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  downloadedAt?: string;
}
