# Glasp 403 Forbidden - Complete Troubleshooting Guide

## What We Know

You're getting a 403 Forbidden error even after:
- ✅ Refreshing the token
- ✅ Checking permissions
- ✅ Using the exact API format from documentation

## Step-by-Step Debugging

### Step 1: Check the Full Error Response

The enhanced logging will now show you the **complete error response** from Glasp. This is crucial because Glasp's API might tell you exactly what's wrong.

**Look for:**
- Error messages in the response body
- Specific permission requirements
- Account status information

### Step 2: Test with curl (Bypass Node.js)

Run the curl test script to see if the issue is with Node.js or the token itself:

```bash
./scripts/test-glasp-curl.sh
```

Or manually:
```bash
curl -v \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.glasp.co/v1/highlights/export"
```

This will show you:
- Exact HTTP headers being sent
- Full response from Glasp
- Any redirects or additional requirements

### Step 3: Verify Token Format

Check your token:
1. **Length**: Glasp tokens are typically long strings
2. **Format**: Should not have spaces or line breaks
3. **Type**: Must be an "Access Token" not an "API Key" or other type

### Step 4: Check Glasp Account Settings

1. **API Access**: 
   - Go to Glasp → Settings → API/Developer
   - Verify API access is enabled for your account
   - Some accounts may need to enable this feature

2. **Token Permissions**:
   - Check what permissions your token has
   - Ensure it has "highlights" or "export" permissions
   - Try creating a new token with explicit permissions

3. **Account Plan**:
   - Check if your Glasp plan includes API access
   - Some features may require a paid subscription
   - Contact Glasp support if unsure

### Step 5: Test Token Directly

Try using the token in a different way:

1. **Browser Test**: 
   - Open browser console
   - Run: `fetch('https://api.glasp.co/v1/highlights/export', { headers: { Authorization: 'Bearer YOUR_TOKEN' } })`
   - See if you get the same 403

2. **Postman/Insomnia**:
   - Test the API with a REST client
   - This helps isolate if it's a code issue

### Step 6: Check for Additional Requirements

The Glasp API might require:
- **User ID**: Some APIs need both token and user ID
- **IP Whitelisting**: Your IP might need to be whitelisted
- **Rate Limits**: You might have hit a limit (though this would be 429, not 403)
- **Account Verification**: Your account might need email verification

### Step 7: Contact Glasp Support

If all else fails:
1. Check the error response body - it might have specific instructions
2. Contact Glasp support with:
   - Your account email
   - The exact error message
   - The timestamp of the request
   - Ask about API access requirements

## Common 403 Causes

1. **Token doesn't have export permission** - Most common
2. **API access not enabled on account** - Check account settings
3. **Wrong token type** - Need Access Token, not API Key
4. **Account plan limitations** - API might require paid plan
5. **Token scope limitations** - Token might be restricted to certain endpoints

## What to Share for Help

If you need help, share:
1. The **full error response body** (from the enhanced logging)
2. The **curl test results** (if different from Node.js)
3. Your **Glasp account type** (free/paid)
4. Whether **API access is enabled** in settings

## Next Steps

1. Run the test script and capture the **full error response**
2. Run the curl test to compare
3. Check Glasp account settings for API access
4. Review the error message for specific requirements

