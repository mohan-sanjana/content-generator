#!/bin/zsh

echo "🚀 Setting up Glasp Blog Pipeline..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "📥 To install Node.js on macOS:"
    echo "   1. Visit https://nodejs.org/ and download the LTS version"
    echo "   2. Or use Homebrew: brew install node"
    echo "   3. Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo ""
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed (usually comes with Node.js)."
    echo ""
    echo "📥 Please install Node.js which includes npm:"
    echo "   1. Visit https://nodejs.org/ and download the LTS version"
    echo "   2. Or use Homebrew: brew install node"
    echo ""
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version is less than 18. Recommended: Node.js 18+"
    echo "   Current version: $(node -v)"
    echo ""
    echo "📥 To update Node.js:"
    echo "   1. Visit https://nodejs.org/ and download the latest LTS version"
    echo "   2. Or use Homebrew: brew upgrade node"
    echo "   3. Or use nvm: nvm install --lts && nvm use --lts"
    echo ""
    read "?Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Prerequisites check passed:"
echo "   Node.js: $(node -v)"
echo "   npm: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Glasp API (if available)
GLASP_API_KEY=your_glasp_api_key_here
GLASP_USER_ID=your_glasp_user_id_here

# Database
DATABASE_URL="file:./dev.db"

# Brand Profile (for idea generation)
BRAND_PROFILE="Principal PM, AI services + infrastructure"
EOF
    echo "✅ Created .env file. Please edit it and add your OpenAI API key!"
    echo "   You can edit it with: open -e .env"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up database..."
npx prisma db push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your OPENAI_API_KEY"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:3000 in your browser"

