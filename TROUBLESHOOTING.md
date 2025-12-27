# Troubleshooting Guide

## Build Error: "Module not found: Can't resolve '@/lib/db'"

**Fixed!** The path alias in `tsconfig.json` has been corrected. If you still see this error:

1. **Restart your dev server**:
   ```zsh
   # Stop the server (Ctrl+C), then:
   npm run dev
   ```

2. **Clear Next.js cache**:
   ```zsh
   rm -rf .next
   npm run dev
   ```

3. **Regenerate Prisma client**:
   ```zsh
   npx prisma generate
   ```

## Sync Button Not Working

### Step 1: Check Environment Variables

Make sure your `.env` file has the correct variable names:

```env
# OpenAI API (required)
OPENAI_API_KEY=sk-...

# Glasp API (use these exact names)
GLASP_API_KEY=your_access_token_here
GLASP_USER_ID=your_user_id_here

# Database
DATABASE_URL="file:./dev.db"

# Brand Profile
BRAND_PROFILE="Principal PM, AI services + infrastructure"
```

**Important**: The code expects `GLASP_API_KEY` (not `GLASP_ACCESS_TOKEN`). If your Glasp token is called "Access Token", still use `GLASP_API_KEY` in the `.env` file.

### Step 2: Check Browser Console

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Click the "Sync Highlights" button
4. Look for any error messages

### Step 3: Check Server Logs

Look at your terminal where `npm run dev` is running. You should see:
- Any API errors
- Database connection issues
- Glasp API errors

### Step 4: Test API Endpoint Directly

Test the sync endpoint manually:

```zsh
curl -X POST http://localhost:3000/api/workflow/sync
```

Or use a tool like Postman/Insomnia.

### Step 5: Verify Database Setup

Make sure the database is initialized:

```zsh
npx prisma generate
npx prisma db push
```

### Step 6: Check Glasp API Integration

The Glasp client will try multiple API endpoints. If all fail, it falls back to mock data. Check the server logs for:

- "Error fetching Glasp highlights" - API call failed
- "Falling back to mock data" - Using test data instead

**To use real Glasp data**, you may need to:
1. Check Glasp API documentation for the correct endpoint
2. Update `src/lib/glasp.ts` with the correct base URL
3. Verify your access token format (Bearer token vs API key)

## Common Issues

### "Prisma Client not generated"

```zsh
npx prisma generate
```

### "Database not initialized"

```zsh
npx prisma db push
```

### "Cannot find module '@prisma/client'"

```zsh
npm install
npx prisma generate
```

### "Port 3000 already in use"

```zsh
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### "OpenAI API error" / "Model does not exist"

**Error: "The model `gpt-4-turbo-preview` does not exist"**

This model name is outdated. The code now uses `gpt-4-turbo` by default. To fix:

1. **Update your `.env` file** (optional - defaults to `gpt-4-turbo`):
   ```env
   OPENAI_MODEL=gpt-4-turbo
   ```

2. **Available models** (choose based on your OpenAI access):
   - `gpt-4-turbo` (default, recommended)
   - `gpt-4o` (latest, if you have access)
   - `gpt-4` (stable)
   - `gpt-3.5-turbo` (cheaper, faster)

3. **Other OpenAI errors**:
   - Check your API key is correct
   - Verify you have credits in your OpenAI account
   - Check rate limits
   - Ensure you have access to the model you're trying to use

### "Glasp API not working"

The app will fall back to mock data if Glasp API fails. To debug:

1. Check server logs for the exact error
2. Verify your access token is valid
3. Test the Glasp API endpoint manually with curl:

```zsh
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.glasp.co/api/highlights
```

## Getting More Debug Info

### Enable verbose logging

Add to your `.env`:
```env
NODE_ENV=development
DEBUG=*
```

### Check Prisma logs

The Prisma client logs queries in development. Check your terminal for SQL queries.

### Network tab in browser

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Click "Sync Highlights"
4. Look for the `/api/workflow/sync` request
5. Check the response for error details

## Still Having Issues?

1. **Check all environment variables are set**:
   ```zsh
   cat .env
   ```

2. **Verify Node.js and npm are working**:
   ```zsh
   node -v
   npm -v
   ```

3. **Reinstall dependencies**:
   ```zsh
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Reset database** (⚠️ deletes all data):
   ```zsh
   rm prisma/dev.db
   npx prisma db push
   ```

