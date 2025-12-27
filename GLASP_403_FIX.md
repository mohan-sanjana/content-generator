# Fixing 403 Forbidden Error

## What 403 Means

A 403 Forbidden error means:
- Your authentication token is being received
- But you don't have permission to access the resource
- This is different from 401 (Unauthorized) which means the token itself is invalid

## Possible Causes

### 1. Token Doesn't Have Required Permissions

Your Glasp Access Token might not have permission to export highlights.

**Solution:**
- Go to Glasp settings
- Check API/Developer settings
- Ensure your token has "highlights" or "export" permissions
- Generate a new token if needed

### 2. API Access Not Enabled

Your Glasp account might not have API access enabled.

**Solution:**
- Check your Glasp plan/subscription
- Some features may require a paid plan
- Contact Glasp support if API access should be available

### 3. Wrong Authentication Method

The API might require a different authentication format.

**Solution:**
- Check Glasp API documentation: https://glasp.co/docs/apis
- Try different header formats:
  - `Authorization: Bearer {token}`
  - `X-API-Key: {token}`
  - `X-Access-Token: {token}`

### 4. Token Type Mismatch

You might be using the wrong type of token.

**Solution:**
- Make sure you're using an "Access Token" not an "API Key" or other token type
- Check Glasp settings for the correct token type

## Testing Different Authentication Methods

I've created a script that automatically tests different authentication methods:

```bash
npm run test:glasp:auth
```

Or:
```bash
node scripts/test-glasp-auth-methods.js
```

This will test:
1. `Authorization: Bearer {token}` (standard)
2. `X-API-Key: {token}` header
3. `X-Access-Token: {token}` header
4. `Authorization: Token {token}` header
5. Query parameter `?access_token={token}`

The script will tell you which method works (if any).

## Next Steps

1. **Check Glasp API Documentation**: https://glasp.co/docs/apis
   - Verify the exact authentication method required
   - Check if there are any account/permission requirements

2. **Generate New Token**:
   - Go to Glasp → Settings → API/Developer
   - Revoke old token
   - Generate new access token
   - Make sure it has export/highlights permissions

3. **Contact Glasp Support**:
   - If API access should work but doesn't
   - Ask about API access requirements
   - Verify your account has API permissions

4. **Check Response Details**:
   - The error response from Glasp might contain helpful information
   - Look at the full error message in server logs
   - It might tell you what permission is missing

## Alternative: Manual Export

If API access isn't available, you can:
1. Use Glasp's manual export feature (if available)
2. Export highlights as JSON/CSV
3. Import them into the app via a file upload feature (to be implemented)

