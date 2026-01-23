/**
 * Offline-First Travel Pack Data Model
 * 
 * Core Principles:
 * - Voice must always work (offline STT first)
 * - Intelligence gracefully degrades
 * - Offline functionality is never blocked by connectivity
 * - Local pack data is always the source of truth
 * 
 * Design Rules:
 * - Voice capture is always available (offline STT first)
 * - Local pack data is always the source of truth
 * - Online AI enhances results but never replaces offline access
 * - No hard failures when internet is poor or unavailable
 * 
 * Optimized for:
 * - Voice-based queries (natural spoken language)
 * - Fast local search (fuzzy matching, keyword indexing)
 * - Human spoken language prioritized over SEO language
 */

export type TimeOfDay = 
  | 'early_morning'    // 5am - 9am
  | 'morning'          // 9am - 12pm
  | 'afternoon'        // 12pm - 5pm
  | 'evening'          // 5pm - 9pm
  | 'late_night'       // 9pm - 2am
  | 'night'            // 2am - 5am
  | 'anytime';         // No time restriction

export type UrgencyLevel = 
  | 'emergency'        // Immediate need (safety, medical, etc.)
  | 'urgent'           // Time-sensitive (hungry, tired, lost)
  | 'important'        // Should know soon
  | 'helpful';         // Nice to know

export interface OfflineFirstPackEntry {
  // Core identification
  id: string;                    // Unique identifier (e.g., "paris-late-night-food-001")
  
  // Primary content
  title: string;                 // Human-readable title (e.g., "Late Night Food Options")
  content: string;                // Primary guidance/answer to the problem
  
  // Problem context
  problem_it_solves: string;     // What problem this entry solves (e.g., "Finding food after 10pm")
  
  // Categorization
  tags: string[];                // Categories (e.g., ["food", "late-night", "budget"])
  
  // Temporal relevance
  time_of_day: TimeOfDay[];      // When this entry is relevant
  
  // Location context
  neighborhood?: string;          // Specific neighborhood/area (e.g., "Le Marais")
  area?: string;                 // Broader area (e.g., "City Center", "Airport")
  
  // Voice optimization
  spoken_phrases: string[];      // Natural voice queries travelers might say
                                  // Examples: "I'm hungry late at night", "Where can I eat after midnight"
  
  keywords: string[];            // For fuzzy matching (variations, synonyms, common misspellings)
                                  // Examples: ["late night", "midnight", "after hours", "24 hour"]
  
  // Metadata for search optimization
  urgency: UrgencyLevel;         // How urgent this problem typically is
  priority_score: number;        // 1-100, for ranking results
  
  // Optional enhancements
  alternatives?: string[];        // Alternative solutions
  warnings?: string[];            // Things to avoid
  cost_range?: 'free' | 'budget' | 'moderate' | 'expensive';
  accessibility?: string[];       // Accessibility notes (e.g., ["wheelchair-accessible", "no-stairs"])
  
  // City context
  city: string;                  // City this entry applies to
  country?: string;              // Country for broader context
  
  // Offline-first metadata
  version: string;                // Schema version
  last_updated?: string;          // ISO timestamp
}

/**
 * Complete offline-first travel pack structure
 */
export interface OfflineFirstTravelPack {
  city: string;
  country: string;
  version: string;
  last_updated: string;
  entries: OfflineFirstPackEntry[];
  
  // Indexed data for fast search (computed from entries)
  search_index?: {
    // Pre-computed indexes for O(1) lookups
    by_time_of_day: Record<TimeOfDay, string[]>;      // Entry IDs by time
    by_tag: Record<string, string[]>;                 // Entry IDs by tag
    by_urgency: Record<UrgencyLevel, string[]>;        // Entry IDs by urgency
    by_neighborhood: Record<string, string[]>;          // Entry IDs by neighborhood
    keyword_trie?: any;                                // For fuzzy keyword matching
  };
}

/**
 * Search query interface for voice/text queries
 */
export interface VoiceSearchQuery {
  query: string;                  // Raw voice/text input
  city: string;                   // City context
  time_of_day?: TimeOfDay;        // Current time context
  location?: string;              // Current location/neighborhood
  urgency_filter?: UrgencyLevel;  // Filter by urgency
  limit?: number;                 // Max results
}

/**
 * Search result with relevance scoring
 */
export interface VoiceSearchResult {
  entry: OfflineFirstPackEntry;
  relevance_score: number;        // 0-100, how well it matches query
  match_reason: string[];         // Why this result matched (for debugging/transparency)
}
