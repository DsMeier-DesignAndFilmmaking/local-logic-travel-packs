/**
 * Text-to-Speech Scripts
 * 
 * Generates concise, natural-sounding summaries for TTS
 * Reads summaries, not full articles
 */

import { SearchResult } from './offlineSearchEngine';

/**
 * Generate a concise summary for TTS from a search result
 */
export function generateTTSSummary(result: SearchResult, index?: number): string {
  const parts: string[] = [];

  // Optional: Add result number
  if (index !== undefined && index >= 0) {
    parts.push(`Result ${index + 1}`);
  }

  // Add card headline (without emoji for cleaner speech)
  const headline = result.cardHeadline.replace(/[\p{Emoji}]/gu, '').trim();
  if (headline) {
    parts.push(headline);
  }

  // Add micro situation title
  if (result.microSituationTitle) {
    parts.push(result.microSituationTitle);
  }

  // Add action (truncated if too long)
  const action = result.action;
  if (action) {
    // Limit action to first sentence or 150 characters
    const truncatedAction = action.length > 150
      ? action.substring(0, 150).split('.')[0] + '.'
      : action.split('.')[0] + (action.includes('.') ? '.' : '');
    parts.push(truncatedAction);
  }

  // Add whatToDoInstead if available (brief)
  if (result.whatToDoInstead) {
    const brief = result.whatToDoInstead.length > 100
      ? result.whatToDoInstead.substring(0, 100) + '...'
      : result.whatToDoInstead;
    parts.push(`Tip: ${brief}`);
  }

  return parts.join('. ') + '.';
}

/**
 * Generate TTS script for multiple results
 */
export function generateTTSResultsScript(
  results: SearchResult[],
  query?: string
): string {
  const parts: string[] = [];

  // Introduction
  if (query) {
    parts.push(`Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}".`);
  } else {
    parts.push(`Found ${results.length} result${results.length !== 1 ? 's' : ''}.`);
  }

  // Add each result
  results.forEach((result, index) => {
    const summary = generateTTSSummary(result, index);
    parts.push(summary);
    
    // Add pause between results (except last)
    if (index < results.length - 1) {
      parts.push(''); // Pause marker
    }
  });

  return parts.filter(p => p).join(' ');
}

/**
 * Generate a single result TTS script
 */
export function generateSingleResultScript(result: SearchResult): string {
  return generateTTSSummary(result);
}

/**
 * Generate TTS script with context
 */
export function generateContextualTTSScript(
  result: SearchResult,
  context?: {
    timeOfDay?: string;
    location?: string;
  }
): string {
  const parts: string[] = [];

  // Add context if available
  if (context?.timeOfDay) {
    parts.push(`For ${context.timeOfDay.replace('_', ' ')},`);
  }

  if (context?.location) {
    parts.push(`in ${context.location},`);
  }

  // Add result summary
  const summary = generateTTSSummary(result);
  parts.push(summary);

  return parts.join(' ');
}

/**
 * Clean text for better TTS pronunciation
 */
export function cleanTextForTTS(text: string): string {
  return text
    // Remove emojis
    .replace(/[\p{Emoji}]/gu, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Fix common abbreviations
    .replace(/\b€/g, 'euros')
    .replace(/\$(\d+)/g, '$1 dollars')
    .replace(/\b(\d+)km\b/gi, '$1 kilometers')
    .replace(/\b(\d+)m\b/gi, '$1 meters')
    // Fix time formats
    .replace(/(\d+):(\d+)/g, '$1 $2')
    // Remove special characters that might confuse TTS
    .replace(/[^\w\s.,!?;:()'-]/g, ' ')
    .trim();
}

/**
 * Split long text into chunks for better TTS
 */
export function chunkTextForTTS(text: string, maxLength: number = 200): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 2 <= maxLength) {
      currentChunk += (currentChunk ? '. ' : '') + trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmed;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }

  return chunks;
}
