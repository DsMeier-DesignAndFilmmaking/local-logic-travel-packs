/**
 * Script to generate placeholder city icons
 * 
 * This script documents which icons are needed and can be used
 * to generate placeholder icons from the base travel-pack-icon files.
 * 
 * Run: node scripts/generateCityIcons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cities = [
  'bangkok',
  'paris',
  'london',
  'dubai',
  'singapore',
  'new-york-city',
  'kuala-lumpur',
  'istanbul',
  'tokyo',
  'antalya',
];

const iconsDir = path.join(__dirname, '../public/icons');
const baseIcon192 = path.join(__dirname, '../public/travel-pack-icon-192.png');
const baseIcon512 = path.join(__dirname, '../public/travel-pack-icon-512.png');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created /public/icons directory');
}

// Check if base icons exist
if (!fs.existsSync(baseIcon192) || !fs.existsSync(baseIcon512)) {
  console.error('❌ Base icons not found. Please ensure travel-pack-icon-192.png and travel-pack-icon-512.png exist in /public');
  process.exit(1);
}

// Generate city-specific icons
let created = 0;
let existing = 0;

cities.forEach(city => {
  const icon192Path = path.join(iconsDir, `${city}-192.png`);
  const icon512Path = path.join(iconsDir, `${city}-512.png`);
  
  // Copy base icons as placeholders (can be replaced with city-specific icons later)
  if (!fs.existsSync(icon192Path)) {
    fs.copyFileSync(baseIcon192, icon192Path);
    console.log(`✅ Created ${city}-192.png`);
    created++;
  } else {
    console.log(`ℹ️  ${city}-192.png already exists`);
    existing++;
  }
  
  if (!fs.existsSync(icon512Path)) {
    fs.copyFileSync(baseIcon512, icon512Path);
    console.log(`✅ Created ${city}-512.png`);
    created++;
  } else {
    console.log(`ℹ️  ${city}-512.png already exists`);
    existing++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Created: ${created} icons`);
console.log(`   Existing: ${existing} icons`);
console.log(`\n💡 Note: These are placeholder icons. Replace with city-specific icons for better UX.`);
