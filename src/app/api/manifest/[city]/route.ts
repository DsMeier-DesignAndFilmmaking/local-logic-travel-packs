// src/app/api/manifest/[city]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { normalizeCityName } from '@/lib/cities';
import { getTravelPackForCity } from '@/lib/travelPacks';

/**
 * Dynamic Manifest Generator for City-Specific PWA Installations
 * 
 * Generates a unique manifest for each city to enable city-specific
 * "Add to Home Screen" installations on iOS.
 * 
 * Example: /api/manifest/bangkok
 * Returns manifest with:
 * - start_url: /packs/bangkok?source=a2hs
 * - scope: /packs/bangkok
 * - name: "Bangkok Travel Pack"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { city: string } }
) {
  try {
    const cityParam = params.city;
    
    if (!cityParam) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }

    // Normalize city name (e.g., "New York City" -> "new-york-city")
    const normalizedCity = normalizeCityName(cityParam);
    
    // Verify the city has a travel pack
    // Try both the normalized name and the original param
    const pack = getTravelPackForCity(cityParam) || getTravelPackForCity(normalizedCity);
    
    if (!pack) {
      return NextResponse.json(
        { error: `Travel pack not found for city: ${cityParam}` },
        { status: 404 }
      );
    }

    // Use the pack's actual city name for display
    const displayCityName = pack.city;
    
    // Generate city-specific manifest
    const manifest = {
      name: `${displayCityName} Travel Pack`,
      short_name: displayCityName,
      description: `Offline-first travel intelligence for ${displayCityName}`,
      id: `/packs/${normalizedCity}`,
      start_url: `/packs/${normalizedCity}?source=a2hs`,
      scope: `/packs/${normalizedCity}`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#FFFFFF',
      theme_color: '#0F172A',
      categories: ['travel', 'productivity'],
      icons: [
        {
          src: `/icons/${normalizedCity}-192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: `/icons/${normalizedCity}-192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: `/icons/${normalizedCity}-512.png`,
          sizes: '512x512',
          type: 'image/png'
        },
        // Fallback to default icons if city-specific icons don't exist
        {
          src: '/travel-pack-icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/travel-pack-icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    // Return manifest with proper content type
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
