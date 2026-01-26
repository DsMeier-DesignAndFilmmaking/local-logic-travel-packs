#!/usr/bin/env node
import { TravelPack } from '../src/lib/travelPacks';
import fs from 'fs';
import path from 'path';

const CITY_NAME = process.argv[2];
const OUTPUT_DIR = './data/travelPacks'; // Saving directly to your data folder

if (!CITY_NAME) {
  console.error('Error: City name required');
  process.exit(1);
}

async function generateTacticalPack(cityName: string): Promise<TravelPack> {
  const now = new Date().toISOString();

  // This now perfectly matches the TravelPack type in travelPacks.ts
  const pack: TravelPack = {
    city: cityName,
    country: 'Generated Tactical Asset',
    description: `Tactical intelligence for ${cityName}.`,
    imageUrl: `https://via.placeholder.com/600x400`,
    thumbnailUrl: `https://via.placeholder.com/150`,
    updatedAt: now,
    createdAt: now,
    downloadedAt: now,
    offlineReady: true,
    tiers: {
      tier1: {
        title: "Arrival Protocol",
        cards: [
          {
            headline: "Arrival Protocol",
            microSituations: [
              {
                title: "Exiting Airport",
                actions: [
                  "Follow green taxi signs", 
                  "Ignore unofficial fixers", 
                  "Download local transit app"
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return pack;
}

(async () => {
  try {
    const pack = await generateTacticalPack(CITY_NAME);
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const filePath = path.join(OUTPUT_DIR, `${CITY_NAME.toLowerCase().replace(/\s+/g, '_')}.json`);
    fs.writeFileSync(filePath, JSON.stringify(pack, null, 2));
    
    console.log(`✅ Asset Generated: ${filePath}`);
  } catch (error) {
    console.error('❌ Failed:', error);
  }
})();