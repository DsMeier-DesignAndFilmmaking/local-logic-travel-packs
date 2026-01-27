import fs from 'fs';
import path from 'path';
import { TravelPack, TravelPackTier, ProblemCard, MicroSituation } from '@/types/travel';

// Re-export types for backward compatibility (will be removed in future cleanup)
export type { TravelPack, TravelPackTier, ProblemCard, MicroSituation };

let travelPacksCache: TravelPack[] | null = null;

// Helper to load JSON files from the filesystem
function loadTravelPacks(): TravelPack[] {
  if (travelPacksCache) return travelPacksCache;

  const folderPath = path.join(process.cwd(), 'data', 'travelPacks');
  if (!fs.existsSync(folderPath)) {
    console.warn('⚠️ Travel Packs folder missing:', folderPath);
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
  const cityOnly = cityName.split(',')[0].trim().toLowerCase();
  
  let pack = packs.find(p => p.city.toLowerCase() === cityOnly);
  
  if (!pack) {
    pack = packs.find(p => {
      const packCityLower = p.city.toLowerCase();
      const allWordsMatch = cityOnly.split(/\s+/).every(word => packCityLower.includes(word));
      const startsWithMatch = packCityLower.startsWith(cityOnly) || cityOnly.startsWith(packCityLower);
      return allWordsMatch || startsWithMatch;
    });
  }

  if (!pack) {
    console.warn(`❌ Pack not found for: ${cityName}`);
    return null;
  }

  return pack;
}

export function getAllTravelCities(): string[] {
  const packs = loadTravelPacks();
  return packs.map(p => p.city);
}