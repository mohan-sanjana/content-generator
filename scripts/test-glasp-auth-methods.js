/**
 * Test Different Glasp API Authentication Methods
 * 
 * Run with: node scripts/test-glasp-auth-methods.js
 * 
 * This script tests various authentication methods to find what works
 */

// Load token from .env or set directly
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
  console.error('❌ No token found. Set GLASP_API_KEY in .env file');
  process.exit(1);
}

const endpoint = 'https://api.glasp.co/v1/highlights/export';

// Different authentication methods to try
const authMethods = [
  {
    name: 'Bearer Token (Standard)',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  },
  {
    name: 'X-API-Key Header',
    headers: {
      'X-API-Key': token,
      'Content-Type': 'application/json',
    },
  },
  {
    name: 'X-Access-Token Header',
    headers: {
      'X-Access-Token': token,
      'Content-Type': 'application/json',
    },
  },
  {
    name: 'Authorization: Token',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  },
  {
    name: 'Query Parameter (less secure)',
    url: `${endpoint}?access_token=${token}`,
    headers: {
      'Content-Type': 'application/json',
    },
  },
];

async function testMethod(method, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test ${index + 1}/${authMethods.length}: ${method.name}`);
  console.log('='.repeat(60));
  
  try {
    const url = method.url || endpoint;
    console.log(`URL: ${url}`);
    console.log(`Headers:`, JSON.stringify(method.headers, null, 2));
    console.log('');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: method.headers,
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! This authentication method works!');
      console.log(`Response structure:`, Object.keys(data));
      if (data.highlights) {
        console.log(`Highlights count: ${data.highlights.length}`);
      }
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed: ${response.status}`);
      console.log(`Error: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Testing Different Glasp API Authentication Methods');
  console.log(`Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
  console.log(`Endpoint: ${endpoint}`);
  
  for (let i = 0; i < authMethods.length; i++) {
    const success = await testMethod(authMethods[i], i);
    if (success) {
      console.log(`\n✅ Found working method: ${authMethods[i].name}`);
      console.log('Use this authentication method in your code!');
      break;
    }
    
    // Wait a bit between requests to avoid rate limiting
    if (i < authMethods.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Testing complete!');
  console.log('='.repeat(60));
}

runTests().catch(console.error);

