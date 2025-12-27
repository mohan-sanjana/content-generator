/**
 * Simple Readwise Highlights Export Script
 * 
 * Usage:
 *   1. Replace YOUR_ACCESS_TOKEN_HERE with your actual Readwise access token
 *   2. Run: node scripts/export-readwise-highlights.js
 * 
 * This script exports all your highlights from Readwise and saves them to a JSON file.
 * 
 * API Reference: https://readwise.io/api_deets
 * Get your token: https://readwise.io/access_token
 */

// ============================================
// CONFIGURATION - Replace with your token
// ============================================
const ACCESS_TOKEN = 'brlwRelcWHIOe0YdDrBisCoRs607vUKJEKVS3rnaTqtN9ISpi8';

// ============================================
// Script Configuration
// ============================================
const OUTPUT_FILE = 'readwise-highlights-export.json';
const API_RESPONSES_FILE = 'readwise-api-responses.json';
const API_BASE_URL = 'https://readwise.io/api/v2/highlights/';
const PAGE_SIZE = 1000; // Max page size per Readwise API docs
const RATE_LIMIT_DELAY = 3000; // 3 seconds between requests (20 per minute = ~3 sec)

// ============================================
// Main Export Function
// ============================================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function exportHighlights() {
  // Validate token
  if (!ACCESS_TOKEN || ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
    console.error('❌ ERROR: Please set your Readwise access token!');
    console.error('');
    console.error('Edit this file and replace YOUR_ACCESS_TOKEN_HERE with your actual token.');
    console.error('You can find your access token at: https://readwise.io/access_token');
    process.exit(1);
  }

  console.log('🚀 Starting Readwise highlights export...');
  console.log(`📝 Token: ${ACCESS_TOKEN.substring(0, 10)}...${ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 4)}`);
  console.log(`⏱️  Rate limit: 20 requests/minute (adding ${RATE_LIMIT_DELAY/1000}s delay between requests)`);
  console.log('');

  const allHighlights = [];
  const apiResponses = []; // Store raw API responses
  let nextPageUrl = null;
  let pageCount = 0;
  let totalCount = null;

  try {
    do {
      pageCount++;
      
      // Build URL
      let url;
      if (nextPageUrl) {
        url = nextPageUrl;
      } else {
        const queryParams = new URLSearchParams();
        queryParams.append('page_size', PAGE_SIZE.toString());
        url = `${API_BASE_URL}?${queryParams.toString()}`;
      }
      
      console.log(`📄 Fetching page ${pageCount}...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        console.error(`Error details: ${errorText}`);
        
        if (response.status === 401) {
          console.error('');
          console.error('💡 This usually means your access token is invalid or expired.');
          console.error('   Please check your token at: https://readwise.io/access_token');
        } else if (response.status === 403) {
          console.error('');
          console.error('💡 This usually means your account does not have API access enabled.');
          console.error('   Please check your Readwise account settings and permissions.');
        } else if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          console.error('');
          console.error(`💡 Rate limit exceeded. Waiting ${waitTime/1000} seconds...`);
          await sleep(waitTime);
          continue; // Retry this page
        }
        
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Store raw API response with metadata
      apiResponses.push({
        page: pageCount,
        url: url,
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        response: data
      });

      // Extract highlights from response
      if (data.results && Array.isArray(data.results)) {
        allHighlights.push(...data.results);
        if (totalCount === null) {
          totalCount = data.count || data.results.length;
        }
        console.log(`   ✅ Found ${data.results.length} highlights (total: ${allHighlights.length}${totalCount ? `/${totalCount}` : ''})`);
      } else {
        console.warn(`   ⚠️  Unexpected response format`);
        console.warn(`   Response keys: ${Object.keys(data).join(', ')}`);
      }

      // Check for next page (Readwise uses 'next' URL)
      nextPageUrl = data.next || null;
      
      if (!nextPageUrl) {
        console.log('   ✅ No more pages');
      } else {
        // Rate limiting: wait before next request (20 requests per minute = 3 seconds)
        if (pageCount > 0) {
          console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY/1000}s before next request (rate limit)...`);
          await sleep(RATE_LIMIT_DELAY);
        }
      }

    } while (nextPageUrl);

    // Save to files
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(process.cwd(), OUTPUT_FILE);
    const apiResponsesPath = path.join(process.cwd(), API_RESPONSES_FILE);
    
    // Save highlights
    fs.writeFileSync(outputPath, JSON.stringify(allHighlights, null, 2), 'utf8');
    
    // Save raw API responses
    fs.writeFileSync(apiResponsesPath, JSON.stringify(apiResponses, null, 2), 'utf8');

    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Export complete!`);
    console.log(`   Total highlights: ${allHighlights.length}`);
    console.log(`   Highlights file: ${OUTPUT_FILE}`);
    console.log(`   API responses file: ${API_RESPONSES_FILE}`);
    console.log(`   Total API calls: ${apiResponses.length}`);
    console.log('='.repeat(60));

    // Display summary
    if (allHighlights.length > 0) {
      console.log('');
      console.log('📊 Summary:');
      
      // Group by category
      const categories = {};
      allHighlights.forEach(h => {
        const category = h.category || 'unknown';
        categories[category] = (categories[category] || 0) + 1;
      });
      
      console.log(`   Categories:`);
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`     - ${category}: ${count} highlights`);
        });

      // Group by book/title
      const books = {};
      allHighlights.forEach(h => {
        const bookTitle = h.book_id ? `Book ID: ${h.book_id}` : (h.title || 'Untitled');
        books[bookTitle] = (books[bookTitle] || 0) + 1;
      });
      
      console.log(`   Unique sources: ${Object.keys(books).length}`);
      console.log(`   Top sources:`);
      Object.entries(books)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([book, count]) => {
          console.log(`     - ${book}: ${count} highlights`);
        });

      // Show date range
      const dates = allHighlights
        .map(h => h.highlighted_at ? new Date(h.highlighted_at) : null)
        .filter(d => d !== null)
        .sort((a, b) => a - b);
      
      if (dates.length > 0) {
        const oldest = dates[0];
        const newest = dates[dates.length - 1];
        console.log(`   Date range: ${oldest.toLocaleDateString()} to ${newest.toLocaleDateString()}`);
      }
    }

  } catch (error) {
    console.error('');
    console.error('❌ Export failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the export
exportHighlights();

