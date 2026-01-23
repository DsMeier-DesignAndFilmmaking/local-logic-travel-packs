import fs from 'fs';
import path from 'path';

// New problem-first structure
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
  tiers: {
    tier1: TravelPackTier;
    tier2?: TravelPackTier;
    tier3?: TravelPackTier;
    tier4?: TravelPackTier;
  };
};

let travelPacksCache: TravelPack[] | null = null;

function loadTravelPacks(): TravelPack[] {
  if (travelPacksCache) return travelPacksCache;

  const folderPath = path.join(process.cwd(), 'data', 'travelPacks');
  if (!fs.existsSync(folderPath)) {
    console.warn('Travel Packs folder does not exist:', folderPath);
    travelPacksCache = [];
    return travelPacksCache;
  }

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
  const packs: TravelPack[] = files.map(file => {
    const filePath = path.join(folderPath, file);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData) as TravelPack;
  });

  travelPacksCache = packs;
  return packs;
}

export function getTravelPackForCity(cityName: string): TravelPack | null {
  const packs = loadTravelPacks();
  
  // Extract just the city name (before first comma) and normalize
  const cityOnly = cityName.split(',')[0].trim().toLowerCase();
  
  // Try exact match first (case-insensitive)
  let pack = packs.find(p => p.city.toLowerCase() === cityOnly);
  
  // If no exact match, try fuzzy matching for common variations
  if (!pack) {
    // Handle common city name variations:
    // - "New York City" vs "New York" 
    // - "Kuala Lumpur" vs "Kuala Lumpur, Federal Territory of Kuala Lumpur"
    pack = packs.find(p => {
      const packCityLower = p.city.toLowerCase();
      const packCityWords = packCityLower.split(/\s+/);
      const searchWords = cityOnly.split(/\s+/);
      
      // Check if all search words are in pack city name
      const allWordsMatch = searchWords.every(word => packCityLower.includes(word));
      
      // Or check if pack city name starts with search term
      const startsWithMatch = packCityLower.startsWith(cityOnly) || cityOnly.startsWith(packCityLower);
      
      return allWordsMatch || startsWithMatch;
    });
  }

  if (!pack) {
    console.warn(`Travel pack not found for city: ${cityName} (searched as: ${cityOnly})`);
    return null;
  }

  return pack;
}

export function getAllTravelCities(): string[] {
  const packs = loadTravelPacks();
  return packs.map(p => p.city);
}
