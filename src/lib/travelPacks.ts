import fs from 'fs';
import path from 'path';

export type TravelPack = {
  city: string;
  country: string;
  tier1: { title: string; items: string[] };
  tier2: { title: string; items: string[] };
  tier3: { title: string; items: string[] };
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
  const cityLower = cityName.trim().toLowerCase();
  const pack = packs.find(p => p.city.toLowerCase() === cityLower);

  if (!pack) {
    console.warn(`Travel pack not found for city: ${cityName}`);
    return null;
  }

  return pack;
}

export function getAllTravelCities(): string[] {
  const packs = loadTravelPacks();
  return packs.map(p => p.city);
}
