/**
 * Script to generate city-specific icons and the root iOS icon.
 * This version FORCES an overwrite to ensure new designs are applied.
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

const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
const baseIcon192 = path.join(publicDir, 'travel-pack-icon-192.png');
const baseIcon512 = path.join(publicDir, 'travel-pack-icon-512.png');

// The specific file iOS Safari looks for in the root
const appleTouchTarget = path.join(publicDir, 'apple-touch-icon.png');

// 1. Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created /public/icons directory');
}

// 2. Check if base source icons exist
if (!fs.existsSync(baseIcon192) || !fs.existsSync(baseIcon512)) {
  console.error('❌ Base icons not found in /public. Ensure travel-pack-icon-192.png and 512.png exist.');
  process.exit(1);
}

console.log('🚀 Syncing new icon designs...');

// 3. Update the root apple-touch-icon.png (The "Cache Buster" target)
try {
  fs.copyFileSync(baseIcon512, appleTouchTarget);
  console.log('🍏 SUCCESS: Updated public/apple-touch-icon.png (Root iOS Icon)');
} catch (err) {
  console.error('❌ Error updating root apple-touch-icon.png:', err.message);
}

// 4. Update city-specific placeholders
let updated = 0;
cities.forEach(city => {
  const icon192Path = path.join(iconsDir, `${city}-192.png`);
  const icon512Path = path.join(iconsDir, `${city}-512.png`);
  
  try {
    fs.copyFileSync(baseIcon192, icon192Path);
    fs.copyFileSync(baseIcon512, icon512Path);
    updated += 2;
  } catch (err) {
    console.error(`❌ Error updating ${city}:`, err.message);
  }
});

console.log(`✅ Refreshed ${updated} city-specific icons.`);
console.log(`\n✨ DONE: All icons are now in sync with your newest designs.`);