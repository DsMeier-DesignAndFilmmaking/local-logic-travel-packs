/**
 * Mapbox City Search Helper (Optional Future)
 * 
 * Alternative city search using Mapbox Geocoding API.
 * Can be used as a fallback or replacement for GeoDB Cities API.
 * 
 * To use: Replace the GeoDB call in /app/api/cities/route.ts with this helper.
 */

export type MapboxCitySuggestion = {
  name: string;
  region: string;
  country: string;
  fullName: string;
};

/**
 * Fetch city suggestions from Mapbox Geocoding API
 * 
 * @param query - User input string
 * @returns Array of city suggestions
 */
export async function fetchMapboxCities(query: string): Promise<MapboxCitySuggestion[]> {
  const MAPBOX_KEY = process.env.MAPBOX_KEY;
  
  if (!query || !MAPBOX_KEY) return [];

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?types=place&limit=8&access_token=${MAPBOX_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error('Mapbox API error:', res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    
    return (data.features || []).map((f: any) => ({
      fullName: f.place_name,
      name: f.text,
      region: f.context?.[0]?.text || '',
      country: f.context?.[1]?.text || '',
    }));
  } catch (error) {
    console.error('Error fetching Mapbox cities:', error);
    return [];
  }
}
