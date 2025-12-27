# Glasp API Debugging Guide

## Quick Test Script

Run the standalone troubleshooting script to test Glasp API independently:

**Option 1: Simple version (no dependencies needed)**
```bash
npm run test:glasp:simple
```
Or:
```bash
node scripts/test-glasp-simple.js
```

**Option 2: Full version (requires dotenv)**
```bash
# First install dependencies if needed:
npm install

# Then run:
npm run test:glasp
```
Or:
```bash
node scripts/test-glasp-api.js
```

**Note**: If you get "Cannot find module 'dotenv'", use the simple version or run:
```bash
npm install
```

This script will:
- ✅ Check if your API key is set in `.env`
- ✅ Make a direct API call to Glasp
- ✅ Show the full response from Glasp
- ✅ Help identify authentication or endpoint issues

## What to Check

### 1. Environment Variables

Make sure your `.env` file has:
```env
GLASP_API_KEY=your_actual_token_here
```

Or:
```env
GLASP_ACCESS_TOKEN=your_actual_token_here
```

**Important**: 
- No quotes around the value
- No spaces before/after
- Restart your dev server after changing `.env`

### 2. Check Server Logs

When you click "Sync Highlights", you should see in your server terminal:

```
[GlaspClient] Initializing...
[GlaspClient] API Key provided in constructor: No
[GlaspClient] GLASP_API_KEY from env: Yes/No
[GlaspClient] Final API Key: abc123... or NOT SET
[GlaspClient] Fetching highlights from Glasp API...
[GlaspClient] Using official endpoint: https://api.glasp.co/v1/highlights/export
```

If you see "NOT SET", the API key isn't being read from `.env`.

### 3. Common Issues

#### Issue: "No Glasp API key found"
**Solution**: 
- Check `.env` file exists in project root
- Verify variable name is exactly `GLASP_API_KEY` or `GLASP_ACCESS_TOKEN`
- Restart dev server: `npm run dev`

#### Issue: No logs appear at all
**Solution**:
- The function might not be called
- Check if sync button actually triggers the API route
- Check browser console for errors

#### Issue: API call returns 401
**Solution**:
- Your token is invalid or expired
- Get a new token from Glasp
- Make sure you're using the Access Token, not a different key

#### Issue: API call returns 404
**Solution**:
- Endpoint might be wrong (but we're using the official one)
- Check Glasp docs for any updates

## Manual Testing

You can also test the API manually with curl:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.glasp.co/v1/highlights/export
```

Replace `YOUR_TOKEN` with your actual Glasp Access Token.

## Next Steps

1. Run `npm run test:glasp` to see if the API works independently
2. Check server logs when clicking "Sync Highlights"
3. Compare the results to identify where the issue is

