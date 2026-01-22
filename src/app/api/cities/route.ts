import { NextRequest, NextResponse } from 'next/server';

// RapidAPI GeoDB first, Mapbox fallback
const GEO_API_HOST = process.env.GEODB_HOST;
const GEO_API_KEY = process.env.GEODB_KEY;
const MAPBOX_KEY = process.env.MAPBOX_KEY;

async function fetchGeoDBCities(query: string) {
  if (!GEO_API_KEY || !GEO_API_HOST) {
    throw new Error('GeoDB API not configured');
  }

  const url = `https://${GEO_API_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(query)}&limit=8`;
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': GEO_API_KEY,
      'X-RapidAPI-Host': GEO_API_HOST,
    },
  });

  if (!res.ok) {
    throw new Error(`GeoDB API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.data || []).map((c: any) => ({
    name: c.city,
    region: c.region,
    country: c.country,
    fullName: `${c.city}, ${c.region}, ${c.country}`,
  }));
}

async function fetchMapboxCities(query: string) {
  if (!MAPBOX_KEY) {
    throw new Error('Mapbox API not configured');
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?types=place&limit=8&access_token=${MAPBOX_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Mapbox API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.features || []).map((f: any) => ({
    name: f.text,
    region: f.context?.[0]?.text || '',
    country: f.context?.[1]?.text || '',
    fullName: f.place_name,
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // Try GeoDB first
    const cities = await fetchGeoDBCities(query);
    if (cities.length > 0) {
      return NextResponse.json(cities);
    }

    // Fallback to Mapbox if GeoDB returns no results
    if (MAPBOX_KEY) {
      const fallback = await fetchMapboxCities(query);
      return NextResponse.json(fallback);
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error('City API error:', err);
    
    // If GeoDB fails and Mapbox is available, try Mapbox
    if (MAPBOX_KEY) {
      try {
        const fallback = await fetchMapboxCities(query);
        return NextResponse.json(fallback);
      } catch (fallbackErr) {
        console.error('Mapbox fallback also failed:', fallbackErr);
      }
    }

    return NextResponse.json([]);
  }
}
