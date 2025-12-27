# Glasp API Troubleshooting Guide

## Current Status

The Glasp integration attempts to fetch highlights from multiple possible endpoints. If all fail, it falls back to mock data.

## How to Debug

### 1. Check Server Logs

When you click "Sync Highlights", watch your server terminal. You should see:

```
[GlaspClient] Attempting to fetch highlights from Glasp API...
[GlaspClient] API Key present: Yes/No
[GlaspClient] User ID: [your user id or "Not provided"]
[GlaspClient] Trying endpoint: https://api.glasp.co/api/highlights
[GlaspClient] Response status: 200 OK (or error code)
```

### 2. Check Environment Variables

Verify your `.env` file has:
```env
GLASP_API_KEY=your_actual_token_here
GLASP_USER_ID=your_user_id_here
```

**Important**: 
- The code looks for `GLASP_API_KEY` or `GLASP_ACCESS_TOKEN`
- Make sure there are no extra spaces or quotes around the values
- Restart your dev server after changing `.env`

### 3. Test Glasp API Manually

Try testing the Glasp API directly:

```bash
# Replace YOUR_TOKEN with your actual token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.glasp.co/api/highlights
```

Or test with your user ID:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-User-Id: YOUR_USER_ID" \
     https://api.glasp.co/api/highlights
```

### 4. Common Issues

#### Issue: "API Key present: No"
**Solution**: Check your `.env` file and restart the server

#### Issue: "Response status: 401 Unauthorized"
**Solution**: Your API key is invalid or expired. Get a new one from Glasp.

#### Issue: "Response status: 404 Not Found"
**Solution**: The endpoint doesn't exist. Glasp may use a different API structure.

#### Issue: "All endpoints failed"
**Solution**: 
- Glasp may not have a public API yet
- The API structure may be different
- Check Glasp documentation or contact Glasp support

### 5. Glasp API May Not Be Public

**Important**: Glasp may not have a publicly documented API. The code tries common patterns, but if Glasp doesn't provide an API, you'll need to:

1. **Use Glasp Export Feature**: If Glasp has an export feature, use that instead
2. **Browser Extension**: Use a browser extension to scrape highlights
3. **Manual Import**: Export from Glasp manually and import via a file upload feature

### 6. Current Implementation

The code tries these endpoints in order:
1. `https://api.glasp.co/api/highlights`
2. `https://api.glasp.co/highlights`
3. `https://api.glasp.co/api/v1/highlights`
4. `https://glasp.co/api/highlights`
5. `https://glasp.co/api/v1/highlights`
6. `https://api.glasp.co/api/export`

If all fail, it uses mock data (2 sample highlights).

### 7. Getting Real Glasp Data

To get real data, you need:
1. Valid Glasp API credentials
2. Correct API endpoint (may need to update `baseUrl` in `src/lib/glasp.ts`)
3. Proper authentication method (Bearer token, API key, etc.)

Check Glasp's official documentation or support for the correct API endpoint and authentication method.

