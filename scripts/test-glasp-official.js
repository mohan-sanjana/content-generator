/**
 * Glasp API Test Script - Using Official Documentation Format
 * 
 * Run with: node scripts/test-glasp-official.js
 * 
 * This script uses the exact format from Glasp API documentation
 */

// Load token from .env file
let token = process.env.GLASP_API_KEY || process.env.GLASP_ACCESS_TOKEN || '';

if (!token) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^GLASP_(API_KEY|ACCESS_TOKEN)=(.*)$/);
        if (match) {
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (value && value !== 'your_glasp_api_key_here') {
            token = value;
          }
        }
      });
    }
  } catch (e) {
    // Ignore
  }
}

if (!token) {
  console.error('❌ ERROR: No access token found!');
  console.error('');
  console.error('Set your token in one of these ways:');
  console.error('1. Add to .env file: GLASP_API_KEY=your_token_here');
  console.error('2. Set environment variable: export GLASP_API_KEY=your_token');
  console.error('3. Edit this file and set token directly');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('Glasp API Test - Official Format');
console.log('='.repeat(60));
console.log(`Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
console.log('');

// Exact format from Glasp API documentation
const getAllHighlights = async (updatedAfter = null) => {
  let allHighlights = [];
  let nextPageCursor = null;

  do {
    const queryParams = new URLSearchParams();
    if (nextPageCursor) {
      queryParams.append("pageCursor", nextPageCursor);
    }
    if (updatedAfter) {
      queryParams.append("updatedAfter", updatedAfter);
    }
    try {
      console.log(`📤 Fetching page${nextPageCursor ? ` (cursor: ${nextPageCursor.substring(0, 20)}...)` : ' (first page)'}...`);
      
      const url = `https://api.glasp.co/v1/highlights/export?${queryParams.toString()}`;
      const fetchOptions = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log(`🔍 Fetch details:`);
      console.log(`   URL: ${url}`);
      console.log(`   Headers:`, JSON.stringify(fetchOptions.headers, null, 2));
      console.log(`   Full fetch options:`, JSON.stringify(fetchOptions, null, 2));
      
      // const response = await fetch(url, fetchOptions);
      const response = await fetch(
        `https://api.glasp.co/v1/highlights/export?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`);
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}`);
        console.error(`❌ Full error response:`, errorText);
        console.error(`❌ Error response length: ${errorText.length} characters`);
        
        // Try to parse as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          console.error(`❌ Parsed error JSON:`, JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.error(`❌ Error response is not JSON, raw text:`, errorText);
        }
        
        // Special handling for 403
        if (response.status === 403) {
          console.error('');
          console.error('🔍 403 Forbidden - Detailed Troubleshooting:');
          console.error('   1. Verify token is correct: Check .env file');
          console.error('   2. Check token permissions in Glasp settings');
          console.error('   3. Verify account has API access enabled');
          console.error('   4. Check if token needs to be regenerated');
          console.error('   5. Verify the token type (should be Access Token)');
          console.error('');
          console.error('💡 The error response above may contain specific details about what\'s missing.');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(`📊 Response structure:`, Object.keys(data));
      if (data.results) {
        console.log(`✅ Found ${data.results.length} highlights in this page`);
      }
      if (data.nextPageCursor) {
        console.log(`📄 Next page cursor: ${data.nextPageCursor.substring(0, 30)}...`);
      }
      
      if (data.results && data.results.length > 0) {
        const highlights = data.results.map((result) => result);
        allHighlights = allHighlights.concat(highlights);
        console.log(`📝 Total highlights so far: ${allHighlights.length}`);
      }
      
      nextPageCursor = data?.nextPageCursor || null;
      if (!nextPageCursor) {
        console.log('✅ No more pages');
        break;
      }
    } catch (error) {
      console.error("❌ Error fetching highlights:", error);
      break;
    }
  } while (nextPageCursor);
  
  return allHighlights;
};

// Main test function
async function runTest() {
  try {
    console.log('🔍 Test 1: Get all highlights from all time');
    console.log('-'.repeat(60));
    const allHighlights = await getAllHighlights();
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Successfully fetched ${allHighlights.length} highlights`);
    console.log('='.repeat(60));
    
    if (allHighlights.length > 0) {
      console.log('');
      console.log('📋 Sample highlight (first one):');
      console.log(JSON.stringify(allHighlights[0], null, 2));
    }
    
    console.log('');
    console.log('🔍 Test 2: Get highlights updated in last 24 hours');
    console.log('-'.repeat(60));
    const lastFetchedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newHighlights = await getAllHighlights(lastFetchedAt.toISOString());
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Found ${newHighlights.length} highlights updated in last 24 hours`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();

