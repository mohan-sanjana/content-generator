# Environment Variables Migration Guide

## Updating from Glasp to Readwise

If your `.env` file still has Glasp references, update it as follows:

### Remove these lines:
```env
GLASP_API_KEY=your_glasp_api_key_here
GLASP_ACCESS_TOKEN=your_glasp_access_token_here
GLASP_USER_ID=your_glasp_user_id_here
```

### Add this line instead:
```env
READWISE_ACCESS_TOKEN=your_readwise_access_token_here
```

### Complete .env file format:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo  # Optional: gpt-4o, gpt-4, gpt-3.5-turbo

# Readwise Configuration
# Get your access token from: https://readwise.io/access_token
READWISE_ACCESS_TOKEN=your_readwise_access_token_here

# Database Configuration
DATABASE_URL="file:./dev.db"

# Brand Profile (used for idea generation and curation)
BRAND_PROFILE="Principal PM, AI services + infrastructure"
```

## Getting Your Readwise Access Token

1. Visit: https://readwise.io/access_token
2. Copy your access token
3. Add it to `.env` as `READWISE_ACCESS_TOKEN`

## Testing

After updating your `.env` file, test the connection:

```bash
npm run test:readwise
```

This will verify your token and test the Readwise API connection.

