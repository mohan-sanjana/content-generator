/**
 * Simple Glasp Highlights Export Script
 * 
 * Usage:
 *   1. Replace YOUR_ACCESS_TOKEN_HERE with your actual Glasp access token
 *   2. Run: node scripts/export-glasp-highlights.js
 * 
 * This script exports all your highlights from Glasp and saves them to a JSON file.
 */

// ============================================
// CONFIGURATION - Replace with your token
// ============================================
const ACCESS_TOKEN = 'gt-fLx4c-PEs4mJCMAEFLJWFMG-AVj6chl7GOZn4b7oSqzCigLsRp';

// ============================================
// Script Configuration
// ============================================
const OUTPUT_FILE = 'glasp-highlights-export.json';
const API_BASE_URL = 'https://api.glasp.co/v1/highlights/export';

// ============================================
// Main Export Function
// ============================================

async function exportHighlights() {
  // Validate token
  if (!ACCESS_TOKEN || ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
    console.error('❌ ERROR: Please set your Glasp access token!');
    console.error('');
    console.error('Edit this file and replace YOUR_ACCESS_TOKEN_HERE with your actual token.');
    console.error('You can find your access token in Glasp settings: https://glasp.co/settings');
    process.exit(1);
  }

  console.log('🚀 Starting Glasp highlights export...');
  console.log(`📝 Token: ${ACCESS_TOKEN.substring(0, 10)}...${ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 4)}`);
  console.log('');

  const allHighlights = [];
  let nextPageCursor = null;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (nextPageCursor) {
        queryParams.append('pageCursor', nextPageCursor);
      }

      const url = `${API_BASE_URL}?${queryParams.toString()}`;
      
      console.log(`📄 Fetching page ${pageCount}...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
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
          console.error('   Please check your token in Glasp settings.');
        } else if (response.status === 403) {
          console.error('');
          console.error('💡 This usually means your account does not have API access enabled.');
          console.error('   Please check your Glasp account settings and permissions.');
        }
        
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Extract highlights from response
      if (data.results && Array.isArray(data.results)) {
        allHighlights.push(...data.results);
        console.log(`   ✅ Found ${data.results.length} highlights (total: ${allHighlights.length})`);
      } else {
        console.warn(`   ⚠️  Unexpected response format`);
      }

      // Check for next page
      nextPageCursor = data.nextPageCursor || null;
      
      if (!nextPageCursor) {
        console.log('   ✅ No more pages');
      }

    } while (nextPageCursor);

    // Save to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(process.cwd(), OUTPUT_FILE);
    
    fs.writeFileSync(outputPath, JSON.stringify(allHighlights, null, 2), 'utf8');

    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ Export complete!`);
    console.log(`   Total highlights: ${allHighlights.length}`);
    console.log(`   Output file: ${OUTPUT_FILE}`);
    console.log('='.repeat(60));

    // Display summary
    if (allHighlights.length > 0) {
      console.log('');
      console.log('📊 Summary:');
      const domains = {};
      allHighlights.forEach(h => {
        const domain = h.domain || (h.url ? new URL(h.url).hostname : 'unknown');
        domains[domain] = (domains[domain] || 0) + 1;
      });
      
      console.log(`   Unique domains: ${Object.keys(domains).length}`);
      console.log(`   Top domains:`);
      Object.entries(domains)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([domain, count]) => {
          console.log(`     - ${domain}: ${count} highlights`);
        });
    }

  } catch (error) {
    console.error('');
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the export
exportHighlights();

