/**
 * Simple Glasp API Test (No dependencies required)
 * 
 * Run with: node scripts/test-glasp-simple.js
 * 
 * Set your token directly in this file or use environment variable
 */

// Option 1: Set your token directly here (for testing)
const GLASP_API_KEY = process.env.GLASP_API_KEY || process.env.GLASP_ACCESS_TOKEN || 'YOUR_TOKEN_HERE';

// Option 2: Or load from .env file manually
if (GLASP_API_KEY === 'YOUR_TOKEN_HERE') {
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
          if (value && value !== 'your_glasp_api_key_here' && value !== 'your_access_token_here') {
            process.env.GLASP_API_KEY = value;
          }
        }
      });
    }
  } catch (e) {
    // Ignore
  }
}

const token = process.env.GLASP_API_KEY || process.env.GLASP_ACCESS_TOKEN || GLASP_API_KEY;

console.log('='.repeat(60));
console.log('Glasp API Simple Test');
console.log('='.repeat(60));
console.log('');

if (!token || token === 'YOUR_TOKEN_HERE') {
  console.error('❌ ERROR: No API token found!');
  console.error('');
  console.error('Set your token in one of these ways:');
  console.error('1. Edit this file and replace YOUR_TOKEN_HERE');
  console.error('2. Set environment variable: export GLASP_API_KEY=your_token');
  console.error('3. Add to .env file: GLASP_API_KEY=your_token');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
console.log('');

async function test() {
  const endpoint = 'https://api.glasp.co/v1/highlights/export';
  
  console.log('🔍 Testing Glasp API...');
  console.log(`   Endpoint: ${endpoint}`);
  console.log('');

  try {
    console.log('📤 Making request...');
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Request Failed!');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Response: ${errorText}`);
      console.log('');
      
      if (response.status === 401) {
        console.error('💡 401 Unauthorized - Authentication failed');
        console.error('   - Your access token is invalid or expired');
        console.error('   - Check that you\'re using the correct token from Glasp');
        console.error('   - Make sure the token hasn\'t been revoked');
      } else if (response.status === 403) {
        console.error('💡 403 Forbidden - Access denied');
        console.error('   - Your token may not have permission to access highlights');
        console.error('   - The API endpoint might require different authentication');
        console.error('   - Your Glasp account may not have API access enabled');
        console.error('   - Check Glasp API documentation for required permissions');
        console.error('');
        console.error('   Try:');
        console.error('   1. Generate a new access token in Glasp settings');
        console.error('   2. Check if your Glasp plan includes API access');
        console.error('   3. Verify the token has "highlights" or "export" permissions');
      } else if (response.status === 404) {
        console.error('💡 404 Not Found - Endpoint not found');
        console.error('   - The API endpoint URL might be incorrect');
        console.error('   - Check Glasp API documentation for the correct endpoint');
      } else if (response.status === 429) {
        console.error('💡 429 Rate Limit - Too many requests');
        console.error('   - Wait a minute and try again');
      }
      
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ Success! Response received:');
    console.log('');
    console.log('📊 Response Structure:');
    console.log(`   Type: ${typeof data}`);
    if (Array.isArray(data)) {
      console.log(`   Array length: ${data.length}`);
    } else {
      console.log(`   Keys: ${Object.keys(data).join(', ')}`);
      if (data.highlights) {
        console.log(`   Highlights count: ${data.highlights.length}`);
      }
    }
    console.log('');
    console.log('📋 Full Response (first 1000 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Test completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    if (error.message.includes('fetch')) {
      console.error('💡 Network error. Check your internet connection.');
    }
    process.exit(1);
  }
}

test();

