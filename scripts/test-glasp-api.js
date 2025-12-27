/**
 * Standalone Glasp API Troubleshooting Script (JavaScript version)
 * 
 * Run with: node scripts/test-glasp-api.js
 * 
 * This script tests the Glasp API integration independently
 * to help debug connection issues.
 * 
 * Make sure to install dependencies first: npm install
 */

// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv').config();
} catch (e) {
  console.warn('⚠️  dotenv not found. Loading .env manually...');
  // Fallback: manually read .env file
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

const GLASP_API_KEY = process.env.GLASP_API_KEY || process.env.GLASP_ACCESS_TOKEN || '';
const GLASP_USER_ID = process.env.GLASP_USER_ID || '';

console.log('='.repeat(60));
console.log('Glasp API Troubleshooting Script');
console.log('='.repeat(60));
console.log('');

// Check environment variables
console.log('📋 Environment Check:');
console.log(`   GLASP_API_KEY: ${GLASP_API_KEY ? GLASP_API_KEY.substring(0, 10) + '...' : '❌ NOT SET'}`);
console.log(`   GLASP_USER_ID: ${GLASP_USER_ID || '❌ NOT SET'}`);
console.log('');

if (!GLASP_API_KEY) {
  console.error('❌ ERROR: GLASP_API_KEY or GLASP_ACCESS_TOKEN not found in .env file');
  console.error('   Please set one of these in your .env file:');
  console.error('   GLASP_API_KEY=your_token_here');
  console.error('   or');
  console.error('   GLASP_ACCESS_TOKEN=your_token_here');
  process.exit(1);
}

// Test function
async function testGlaspAPI() {
  const endpoint = 'https://api.glasp.co/v1/highlights/export';
  
  console.log('🔍 Testing Glasp API...');
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Method: GET`);
  console.log(`   Headers: Authorization: Bearer ${GLASP_API_KEY.substring(0, 10)}...`);
  console.log('');

  try {
    console.log('📤 Making request...');
    const startTime = Date.now();
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GLASP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Request completed in ${duration}ms`);
    console.log('');
    console.log('📥 Response Details:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Status OK: ${response.ok ? '✅' : '❌'}`);
    console.log('');

    // Log response headers
    console.log('📋 Response Headers:');
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log(JSON.stringify(headers, null, 2));
    console.log('');

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    console.log(`📄 Content-Type: ${contentType}`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Request Failed!');
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${errorText}`);
      console.log('');

      if (response.status === 401) {
        console.error('💡 This is an authentication error. Possible issues:');
        console.error('   1. Your API key/token is invalid or expired');
        console.error('   2. The token format is incorrect');
        console.error('   3. The token doesn\'t have the right permissions');
      } else if (response.status === 404) {
        console.error('💡 Endpoint not found. Possible issues:');
        console.error('   1. The API endpoint URL might be incorrect');
        console.error('   2. The API version might have changed');
      } else if (response.status === 429) {
        console.error('💡 Rate limit exceeded. Wait a minute and try again.');
      } else {
        console.error('💡 Check the error message above for details.');
      }
      
      process.exit(1);
    }

    // Parse response
    let data;
    try {
      if (contentType.includes('application/json')) {
        const text = await response.text();
        console.log('📦 Raw Response (first 500 chars):');
        console.log(text.substring(0, 500));
        console.log('');
        
        data = JSON.parse(text);
      } else {
        const text = await response.text();
        console.log('📦 Response (not JSON):');
        console.log(text.substring(0, 500));
        console.log('');
        console.error('❌ Response is not JSON. Content-Type:', contentType);
        process.exit(1);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      process.exit(1);
    }

    console.log('✅ Response Parsed Successfully!');
    console.log('');
    console.log('📊 Response Structure:');
    console.log(`   Type: ${typeof data}`);
    console.log(`   Keys: ${Array.isArray(data) ? 'Array' : Object.keys(data).join(', ')}`);
    console.log('');

    // Pretty print the response
    console.log('📋 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    // Analyze the response
    if (Array.isArray(data)) {
      console.log(`✅ Response is an array with ${data.length} items`);
      if (data.length > 0) {
        console.log('📝 First item structure:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    } else if (data.highlights && Array.isArray(data.highlights)) {
      console.log(`✅ Response has 'highlights' array with ${data.highlights.length} items`);
      if (data.highlights.length > 0) {
        console.log('📝 First highlight structure:');
        console.log(JSON.stringify(data.highlights[0], null, 2));
      }
      if (data.pageCursor) {
        console.log(`📄 Pagination cursor: ${data.pageCursor}`);
      }
    } else {
      console.log('⚠️  Unexpected response structure');
      console.log('   Expected: array or object with "highlights" property');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('❌ Error occurred:');
    console.error(error);
    console.log('');
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        console.error('💡 Network error. Possible issues:');
        console.error('   1. No internet connection');
        console.error('   2. Firewall blocking the request');
        console.error('   3. DNS resolution failed');
        console.error('   4. SSL certificate issue');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testGlaspAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

