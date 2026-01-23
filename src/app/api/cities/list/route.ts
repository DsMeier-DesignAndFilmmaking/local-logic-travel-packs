import { NextResponse } from 'next/server';
import { getAllTravelCities } from '@/lib/travelPacks';

/**
 * API endpoint to get list of all cities with available travel packs
 * Used for preloading all packs for offline access
 */
export async function GET() {
  try {
    const cities = getAllTravelCities();
    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching city list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
