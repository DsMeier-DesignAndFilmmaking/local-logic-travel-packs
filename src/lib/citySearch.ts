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
export async function fetchCitySuggestions(query: string): Promise<CitySuggestion[]> {
  if (!query) return [];

  try {
    const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
    return [];
  }
}
