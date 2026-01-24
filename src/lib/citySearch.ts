/**
 * City Search Helper
 * 
 * Fetches city suggestions from the API proxy route.
 * The API route handles the actual GeoDB Cities API call server-side.
 */

export type CitySuggestion = {
  name: string;
  region: string;
  country: string;
  fullName: string;
};

/**
 * Fetch city suggestions from the API
 * 
 * @param query - User input string
 * @returns Array of city suggestions
 */
export async function fetchCitySuggestions(query: string) {
  // ✅ HARD STOP if offline
  if (!navigator.onLine) {
    console.log('📴 Offline — skipping city API search');
    return [];
  }

  try {
    const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('City search failed:', err);
    return [];
  }
}

