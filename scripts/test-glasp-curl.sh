#!/bin/bash

# Glasp API Test using curl
# This helps verify if the issue is with the token or the code

echo "============================================================"
echo "Glasp API Test - Using curl"
echo "============================================================"
echo ""

# Load token from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep GLASP | xargs)
fi

TOKEN="${GLASP_API_KEY:-${GLASP_ACCESS_TOKEN}}"

if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: No token found!"
    echo "Set GLASP_API_KEY or GLASP_ACCESS_TOKEN in .env file"
    exit 1
fi

echo "Token: ${TOKEN:0:10}...${TOKEN: -4}"
echo ""

echo "📤 Making request with curl..."
echo ""

# Test the API
curl -v \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.glasp.co/v1/highlights/export" \
  2>&1 | tee /tmp/glasp-curl-response.txt

echo ""
echo "============================================================"
echo "Response saved to /tmp/glasp-curl-response.txt"
echo "============================================================"

