/**
 * Readwise API Test Script
 * 
 * Run with: node scripts/test-readwise.js
 * 
 * Tests the Readwise API integration
 */

// Load token from .env file
let token = process.env.READWISE_ACCESS_TOKEN || '';

if (!token) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^READWISE_ACCESS_TOKEN=(.*)$/);
        if (match) {
          const value = match[1].trim().replace(/^["']|["']$/g, '');
          if (value && value !== 'your_readwise_access_token_here') {
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
  console.error('❌ ERROR: No Readwise access token found!');
  console.error('');
  console.error('Set your token in one of these ways:');
  console.error('1. Add to .env file: READWISE_ACCESS_TOKEN=your_token_here');
  console.error('2. Set environment variable: export READWISE_ACCESS_TOKEN=your_token');
  console.error('3. Get your token from: https://readwise.io/access_token');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('Readwise API Test');
console.log('='.repeat(60));
console.log(`Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
console.log('');

async function testAuth() {
  console.log('🔍 Test 1: Verify Token');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch('https://readwise.io/api/v2/auth/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 204) {
      console.log('✅ Token is valid!');
    } else {
      console.error('❌ Token verification failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function testHighlights() {
  console.log('');
  console.log('🔍 Test 2: Fetch Highlights');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch('https://readwise.io/api/v2/highlights/?page_size=5', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch highlights');
      console.error(`Error: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log(`✅ Success! Found ${data.count} total highlights`);
    console.log(`📄 Retrieved ${data.results.length} highlights in this page`);
    
    if (data.results.length > 0) {
      console.log('');
      console.log('📋 Sample highlight:');
      console.log(JSON.stringify(data.results[0], null, 2));
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function runTests() {
  await testAuth();
  await testHighlights();
}

runTests();

