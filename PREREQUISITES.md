# Prerequisites Setup Guide

## Required

### 1. Node.js 18+ (includes npm)

Node.js is a JavaScript runtime. npm (Node Package Manager) comes bundled with Node.js.

#### Installation Options for macOS:

**Option A: Official Installer (Easiest)**
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version
3. Run the installer (.pkg file)
4. Follow the installation wizard
5. Restart your terminal

**Option B: Homebrew (if you have it)**
```bash
brew install node
```

**Option C: nvm (Node Version Manager) - Recommended for developers**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or reload:
source ~/.zshrc

# Install and use Node.js LTS
nvm install --lts
nvm use --lts
```

#### Verify Installation:
```bash
node -v   # Should show: v18.x.x or higher
npm -v    # Should show: 9.x.x or higher
```

---

### 2. OpenAI API Key

You'll need an OpenAI API key to generate blog ideas and drafts.

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again!)
5. Add it to your `.env` file:
   ```
   OPENAI_API_KEY=sk-...
   ```

**Note:** OpenAI API usage is paid. Check [pricing](https://openai.com/pricing) before generating many ideas/drafts.

---

## Optional (for v1)

### 3. Glasp API Credentials

Currently, the app uses mock Glasp data. If you have Glasp API access:

1. Get your Glasp API key and user ID
2. Add to `.env`:
   ```
   GLASP_API_KEY=your_key_here
   GLASP_USER_ID=your_user_id_here
   ```

---

## Quick Check

Run this to verify everything is installed:

```bash
# Check Node.js
node -v

# Check npm
npm -v

# If both show version numbers, you're good to go!
```

---

## Troubleshooting

### "npm: command not found"
- Node.js isn't installed or not in your PATH
- Install Node.js using one of the methods above
- Restart your terminal after installation

### "node: command not found"
- Node.js isn't installed
- Install Node.js using one of the methods above
- Restart your terminal after installation

### "Permission denied" errors
- You might need to use `sudo` (not recommended)
- Better: Fix npm permissions: `mkdir ~/.npm-global && npm config set prefix '~/.npm-global'`
- Or use nvm (doesn't require sudo)

### Node.js version is too old
- Update Node.js using the same method you used to install it
- Or use nvm to manage multiple versions

