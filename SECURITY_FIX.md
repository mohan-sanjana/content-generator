# Critical Security Fix - Token Exposure

## Immediate Actions Required

### 1. Revoke the Exposed Token (DO THIS FIRST)
**URGENT**: The Readwise API token `brlwRelcWHIOe0YdDrBisCoRs607vUKJEKVS3rnaTqtN9ISpi8` was exposed in the public repository.

**Action**: Go to https://readwise.io/access_token and:
1. Revoke/delete the exposed token immediately
2. Generate a new token
3. Update your local `.env` file with the new token

### 2. Code Fix Applied
✅ **Fixed**: `scripts/export-readwise-highlights.js` now uses environment variables instead of hard-coded tokens.

The script now:
- Reads `READWISE_ACCESS_TOKEN` from environment variables
- Loads from `.env` file automatically
- Fails safely if token is not provided
- Only shows partial token in logs (first 4 + last 4 chars)

### 3. Remove Secret from Git History (Required)

The exposed token is still in git history. You must scrub it:

#### Option A: Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
pip3 install git-filter-repo

# Clone a mirror of the repo
git clone --mirror git@github.com:mohan-sanjana/content-generator.git content-generator-mirror.git
cd content-generator-mirror.git

# Create replacements file
echo "brlwRelcWHIOe0YdDrBisCoRs607vUKJEKVS3rnaTqtN9ISpi8==>REMOVED_READWISE_TOKEN" > ../replacements.txt

# Run filter-repo
git filter-repo --replace-text ../replacements.txt

# Force push (WARNING: This rewrites history)
git push --force --all
git push --force --tags
```

#### Option B: Using BFG Repo-Cleaner

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# Create passwords.txt with just the token:
echo "brlwRelcWHIOe0YdDrBisCoRs607vUKJEKVS3rnaTqtN9ISpi8" > passwords.txt

# Clone mirror
git clone --mirror git@github.com:mohan-sanjana/content-generator.git content-generator-mirror.git

# Run BFG
java -jar bfg.jar --replace-text passwords.txt content-generator-mirror.git

# Clean up
cd content-generator-mirror.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force --all
git push --force --tags
```

**⚠️ Important**: After force-pushing:
- All collaborators must re-clone the repository (history is rewritten)
- The token will still be visible in GitHub's web UI for a period (GitHub caches)
- Consider making the repo private temporarily, then public again after scrubbing

### 4. Verify .gitignore

✅ `.gitignore` already includes:
- `.env` and `.env*.local`
- `*.db` and `dev.db`
- `readwise-api-responses.json` and `readwise-highlights-export.json`

### 5. Additional Security Recommendations

#### Run Secret Scanning
```bash
# Install gitleaks
brew install gitleaks  # macOS
# or: go install github.com/gitleaks/gitleaks/v8@latest

# Scan repository
gitleaks detect --source . --report-path gitleaks-report.json

# Review results
cat gitleaks-report.json
```

#### Add Pre-commit Hook
```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
EOF

# Install hook
pre-commit install
```

#### Enable GitHub Secret Scanning
1. Go to repository Settings → Security → Code security and analysis
2. Enable "Secret scanning"
3. Enable "Push protection" (blocks commits with secrets)

#### Dependency Audit
```bash
npm audit
npm audit fix
```

## Files Fixed

- ✅ `scripts/export-readwise-highlights.js` - Now uses environment variables
- ✅ `.gitignore` - Already properly configured

## Next Steps

1. **Revoke token** (if not done already)
2. **Commit the fixed script** (this commit)
3. **Scrub git history** (use git-filter-repo or BFG)
4. **Run secret scanning** to check for other issues
5. **Add pre-commit hooks** to prevent future leaks
6. **Enable GitHub secret scanning**

## Testing the Fixed Script

After updating your `.env` with a new token:

```bash
# Method 1: Using .env file
node scripts/export-readwise-highlights.js

# Method 2: Inline environment variable
READWISE_ACCESS_TOKEN=your_new_token node scripts/export-readwise-highlights.js
```

