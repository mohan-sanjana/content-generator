// Readwise API client
// Uses official Readwise API: https://readwise.io/api_deets
// Endpoint: https://readwise.io/api/v2/highlights/
// Authentication: Token in Authorization header (format: "Token XXX")

import { HighlightRecord } from '@/types';

export interface ReadwiseHighlight {
  id: number;
  is_deleted?: boolean;
  text: string;
  title?: string;
  author?: string;
  source_url?: string;
  source_type?: string;
  category?: string;
  note?: string | null;
  location?: number;
  location_type?: string;
  highlighted_at?: string;
  highlight_url?: string;
  book_id?: number;
  url?: string | null;
  updated?: string;
  created_at?: string;
  tags?: Array<{ id: number; name: string }>;
}

export interface ReadwiseBook {
  user_book_id?: number;
  is_deleted?: boolean;
  title?: string;
  author?: string;
  readable_title?: string;
  source?: string;
  cover_image_url?: string;
  unique_url?: string;
  book_tags?: Array<{ id: number; name: string }>;
  category?: string;
  document_note?: string;
  summary?: string;
  readwise_url?: string;
  source_url?: string;
  external_id?: string;
  asin?: string | null;
  highlights?: ReadwiseHighlight[];
  // Also support direct highlight structure (if endpoint returns highlights directly)
  [key: string]: any; // Allow any additional fields
}

export interface ReadwiseHighlightsResponse {
  count: number;
  nextPageCursor: string | null;
  results: ReadwiseBook[];
}

export class ReadwiseClient {
  private accessToken: string;
  private baseUrl: string = 'https://readwise.io/api/v2';

  constructor(accessToken?: string) {
    // Support READWISE_ACCESS_TOKEN environment variable
    this.accessToken = accessToken || process.env.READWISE_ACCESS_TOKEN || '';
    
    console.log('[ReadwiseClient] Initializing...');
    console.log('[ReadwiseClient] Access Token provided in constructor:', accessToken ? 'Yes' : 'No');
    console.log('[ReadwiseClient] READWISE_ACCESS_TOKEN from env:', process.env.READWISE_ACCESS_TOKEN ? 'Yes' : 'No');
    console.log('[ReadwiseClient] Final Access Token:', this.accessToken ? `${this.accessToken.substring(0, 10)}...` : 'NOT SET');
    
    if (!this.accessToken) {
      console.warn('⚠️  No Readwise access token found. Will use mock data.');
      console.warn('💡 Set READWISE_ACCESS_TOKEN in your .env file');
      console.warn('💡 Get your token from: https://readwise.io/access_token');
    } else {
      console.log('[ReadwiseClient] ✅ Access Token found, will attempt real API calls');
    }
  }

  /**
   * Verify that the access token is valid
   */
  async verifyToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.accessToken}`,
        },
      });

      return response.status === 204;
    } catch (error) {
      console.error('[ReadwiseClient] Error verifying token:', error);
      return false;
    }
  }

  /**
   * Fetch all highlights from Readwise
   * Supports pagination and filtering
   * @param updatedAfter - Only fetch highlights updated after this date
   * @param category - Filter by category (e.g., "articles", "books", "tweets", "podcasts")
   * @param maxAgeDays - Only fetch highlights created within the last N days (default: 30)
   */
  async fetchHighlights(updatedAfter?: Date, category?: string, maxAgeDays: number = 30): Promise<ReadwiseHighlight[]> {
    if (!this.accessToken) {
      console.warn('⚠️  Readwise access token not provided. Using mock data.');
      console.warn('💡 To use real Readwise data, set READWISE_ACCESS_TOKEN in your .env file');
      return this.getMockHighlights();
    }

    console.log('[ReadwiseClient] Fetching highlights from Readwise API...');
    console.log('[ReadwiseClient] Using endpoint: https://readwise.io/api/v2/highlights/');
    console.log(`[ReadwiseClient] Filtering highlights created within last ${maxAgeDays} days`);

    // Calculate the minimum created_at date (maxAgeDays ago)
    // If maxAgeDays is 0 or negative, don't filter by date
    const minCreatedAt = maxAgeDays > 0 ? new Date() : null;
    if (minCreatedAt) {
      minCreatedAt.setDate(minCreatedAt.getDate() - maxAgeDays);
    }

    const allHighlights: ReadwiseHighlight[] = [];
    let nextPageCursor: string | null = null;
    let pageCount = 0;
    const maxPages = 100; // Safety limit

    try {
      do {
        pageCount++;
        
        // Build query parameters - use /highlights/ endpoint to get highlights directly
        const url = new URL(`${this.baseUrl}/highlights/`);
        if (nextPageCursor) {
          url.searchParams.set('pageCursor', nextPageCursor);
        }
        if (updatedAfter) {
          url.searchParams.set('updated__gt', updatedAfter.toISOString());
        }
        // Request more results per page (max is 1000, default is 100)
        url.searchParams.set('page_size', '1000');

        console.log(`[ReadwiseClient] Fetching page ${pageCount}...`);
        console.log(`[ReadwiseClient] Request URL: ${url.toString()}`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Token ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`[ReadwiseClient] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ReadwiseClient] ❌ API request failed: ${response.status}`);
          console.error(`[ReadwiseClient] Full error response:`, errorText);
          
          // Try to parse error as JSON
          try {
            const errorJson = JSON.parse(errorText);
            console.error(`[ReadwiseClient] Parsed error JSON:`, JSON.stringify(errorJson, null, 2));
          } catch (e) {
            console.error(`[ReadwiseClient] Error response is not JSON`);
          }
          
          if (response.status === 401) {
            console.error('[ReadwiseClient] ❌ 401 Unauthorized - Authentication failed');
            console.error('💡 Possible issues:');
            console.error('   1. Your access token is invalid or expired');
            console.error('   2. Token format is incorrect (should be "Token XXX")');
            console.error('   3. Get a new token from: https://readwise.io/access_token');
            throw new Error('Authentication failed (401). Please check your Readwise Access Token.');
          } else if (response.status === 403) {
            console.error('[ReadwiseClient] ❌ 403 Forbidden - Access denied');
            console.error('💡 Check your Readwise account settings and token permissions');
            throw new Error('Access forbidden (403). Check your Readwise token permissions.');
          } else if (response.status === 429) {
            console.error('[ReadwiseClient] ❌ Rate limit exceeded (429)');
            const retryAfter = response.headers.get('Retry-After');
            console.error(`💡 Wait ${retryAfter || '60'} seconds before retrying`);
            throw new Error(`Rate limit exceeded. Wait ${retryAfter || '60'} seconds.`);
          } else {
            throw new Error(`Readwise API error: ${response.status} - ${errorText.substring(0, 100)}`);
          }
        }

        // Get raw response text first to see exactly what we're getting
        const responseText = await response.text();
        console.log(`[ReadwiseClient] ========================================`);
        console.log(`[ReadwiseClient] RAW API RESPONSE (Page ${pageCount}):`);
        console.log(`[ReadwiseClient] ========================================`);
        console.log(responseText);
        console.log(`[ReadwiseClient] ========================================`);
        
        // Now parse it
        const data: ReadwiseHighlightsResponse = await JSON.parse(responseText);
        
        console.log(`[ReadwiseClient] ========================================`);
        console.log(`[ReadwiseClient] PARSED API RESPONSE (Page ${pageCount}):`);
        console.log(`[ReadwiseClient] ========================================`);
        console.log(JSON.stringify(data, null, 2));
        console.log(`[ReadwiseClient] ========================================`);
        
        console.log(`[ReadwiseClient] Response structure:`, Object.keys(data));
        console.log(`[ReadwiseClient] Found ${data.results?.length || 0} books/articles in this page`);
        console.log(`[ReadwiseClient] Total count: ${data.count}`);
        
        if (data.results && data.results.length > 0) {
          console.log(`[ReadwiseClient] First book/article structure:`, Object.keys(data.results[0]));
          console.log(`[ReadwiseClient] First book/article FULL object:`, JSON.stringify(data.results[0], null, 2));
          
          // Check what fields actually exist
          const firstBook = data.results[0];
          console.log(`[ReadwiseClient] First book fields check:`);
          console.log(`  - title: ${firstBook.title}`);
          console.log(`  - category: ${firstBook.category}`);
          console.log(`  - is_deleted: ${firstBook.is_deleted}`);
          console.log(`  - highlights: ${firstBook.highlights ? `array with ${firstBook.highlights.length} items` : 'missing'}`);
          if (firstBook.highlights && firstBook.highlights.length > 0) {
            console.log(`  - First highlight:`, JSON.stringify(firstBook.highlights[0], null, 2));
          }
        } else {
          console.warn(`[ReadwiseClient] ⚠️  No results array or empty results!`);
        }
        
        if (data.results && data.results.length > 0) {
          // Process highlights (direct structure from /highlights/ endpoint)
          let totalHighlightsInPage = 0;
          let filteredHighlightsInPage = 0;
          let skippedByDeleted = 0;
          let skippedByDate = 0;
          
          if (minCreatedAt) {
            console.log(`[ReadwiseClient] Minimum created_at date: ${minCreatedAt.toISOString()} (last ${maxAgeDays} days)`);
          } else {
            console.log(`[ReadwiseClient] Date filtering disabled (maxAgeDays: ${maxAgeDays})`);
          }
          
          // Process highlights directly (from /highlights/ endpoint)
          console.log(`[ReadwiseClient] Processing ${data.results.length} highlights from API response`);
          
          for (const highlight of data.results as any[]) {
            totalHighlightsInPage++;
            
            // Skip deleted highlights
            if (highlight.is_deleted) {
              skippedByDeleted++;
              continue;
            }
            
            // Filter by created_at date (must be within maxAgeDays)
            if (minCreatedAt) {
              const highlightCreatedAt = highlight.created_at ? new Date(highlight.created_at) : null;
              if (highlightCreatedAt) {
                if (highlightCreatedAt < minCreatedAt) {
                  skippedByDate++;
                  continue; // Skip highlights older than maxAgeDays
                }
              } else {
                // If no created_at, use highlighted_at as fallback
                const highlightedAt = highlight.highlighted_at ? new Date(highlight.highlighted_at) : null;
                if (highlightedAt && highlightedAt < minCreatedAt) {
                  skippedByDate++;
                  continue;
                }
              }
            }
            
            allHighlights.push(highlight as ReadwiseHighlight);
            filteredHighlightsInPage++;
          }
          
          console.log(`[ReadwiseClient] Summary:`);
          console.log(`  - Total highlights in page: ${totalHighlightsInPage}`);
          console.log(`  - Skipped highlights (deleted): ${skippedByDeleted}`);
          console.log(`  - Skipped highlights (too old): ${skippedByDate}`);
          console.log(`  - Extracted highlights: ${filteredHighlightsInPage}`);
          console.log(`  - Total highlights collected so far: ${allHighlights.length}`);
          
          if (allHighlights.length > 0) {
            console.log(`[ReadwiseClient] First highlight sample:`, JSON.stringify(allHighlights[0], null, 2));
          } else {
            console.warn(`[ReadwiseClient] ⚠️  No highlights extracted! Check filters above.`);
          }
        } else {
          console.warn(`[ReadwiseClient] ⚠️  No results in response!`);
        }

        // Check for next page (using nextPageCursor)
        nextPageCursor = data.nextPageCursor || null;
        if (!nextPageCursor) {
          console.log('[ReadwiseClient] ✅ No more pages to fetch');
          break;
        }
      } while (nextPageCursor && pageCount < maxPages);

      if (pageCount >= maxPages) {
        console.warn(`[ReadwiseClient] ⚠️  Reached maximum page limit (${maxPages}). There may be more highlights.`);
      }

      console.log(`[ReadwiseClient] ✅ Successfully fetched ${allHighlights.length} highlights from ${pageCount} page(s)`);
      return allHighlights;

    } catch (error) {
      console.error('[ReadwiseClient] ❌ Error fetching Readwise highlights:', error);
      
      if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('401') || error.message.includes('403'))) {
        throw error; // Don't fall back to mock data for auth/rate limit errors
      }
      
      console.warn('[ReadwiseClient] ⚠️  Falling back to mock data. Please check your Readwise API credentials.');
      return this.getMockHighlights();
    }
  }

  /**
   * Normalize Readwise highlight to our format
   */
  normalizeHighlight(readwise: ReadwiseHighlight): HighlightRecord {
    // Extract domain from source_url if available
    let sourceDomain = 'readwise.io';
    if (readwise.source_url) {
      try {
        sourceDomain = new URL(readwise.source_url).hostname;
      } catch (e) {
        // Invalid URL, use default
      }
    }

    // Extract tags from Readwise tags array
    const tags = readwise.tags?.map(t => t.name) || [];

    // Use created_at if available, otherwise use highlighted_at
    const createdAt = readwise.created_at 
      ? new Date(readwise.created_at)
      : (readwise.highlighted_at ? new Date(readwise.highlighted_at) : new Date());

    return {
      id: '', // Will be generated by DB
      glaspId: String(readwise.id), // Reuse glaspId field for Readwise ID
      url: readwise.source_url || readwise.url || '',
      title: readwise.title || 'Untitled',
      author: readwise.author || undefined,
      createdAt: createdAt,
      highlightText: readwise.text,
      note: readwise.note || undefined,
      tags: tags,
      sourceDomain: sourceDomain,
    };
  }

  /**
   * Mock highlights for development/testing
   */
  private getMockHighlights(): ReadwiseHighlight[] {
    return [
      {
        id: 1,
        text: 'Vector databases are becoming essential for AI applications that require semantic search.',
        title: 'Building Scalable AI Infrastructure',
        author: 'Jane Doe',
        source_url: 'https://example.com/ai-infrastructure',
        highlighted_at: new Date().toISOString(),
        category: 'articles',
        note: 'Key insight: Need to consider both performance and cost.',
        tags: [{ id: 1, name: 'AI' }, { id: 2, name: 'infrastructure' }],
      },
      {
        id: 2,
        text: 'The key to successful AI product launches is understanding the user journey before the AI interaction.',
        title: 'Product Strategy for AI Services',
        author: 'John Smith',
        source_url: 'https://example.com/product-management',
        highlighted_at: new Date().toISOString(),
        category: 'articles',
        note: 'Important for our roadmap planning.',
        tags: [{ id: 3, name: 'product-management' }, { id: 4, name: 'AI' }],
      },
    ];
  }
}

