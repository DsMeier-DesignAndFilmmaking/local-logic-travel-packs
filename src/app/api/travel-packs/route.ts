import { NextRequest, NextResponse } from 'next/server';
import { getTravelPackForCity } from '@/lib/travelPacks';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json(
      { error: 'City parameter is required' },
      { status: 400 }
    );
  }

  try {
    const pack = getTravelPackForCity(city);
    
    if (!pack) {
      return NextResponse.json(
        { error: `Travel pack not found for city: ${city}` },
        { status: 404 }
      );
    }

    return NextResponse.json(pack);
  } catch (error) {
    console.error('Error fetching travel pack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
