# Readwise Blog Pipeline

A local-first, multi-agent content pipeline that transforms your Readwise highlights into blog post ideas and full drafts.

## Overview

This application uses a multi-agent workflow to:
1. **Sync** highlights from Readwise API
2. **Generate** blog post ideas from highlights
3. **Curate** ideas using a scoring rubric
4. **Create** full blog drafts with outlines and repurpose packs

## Architecture

### Agents

- **RetrieverAgent**: Syncs highlights from Readwise, creates embeddings, stores in DB
- **IdeaGeneratorAgent**: Generates 5-10 blog ideas from highlights using LLM
- **CuratorAgent**: Scores ideas on groundedness, originality, brand fit, diversity, and clarity
- **CreatorAgent**: Creates full blog drafts (1200-1800 words) with outlines and social content

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma) - designed to migrate to Postgres
- **Vector Store**: SQLite-based embeddings table (abstracted for pgvector migration)
- **LLM**: OpenAI API (GPT-4 for generation, text-embedding-3-small for embeddings)

## Setup

### Prerequisites

- **Node.js 18+** (includes npm)
- **OpenAI API key** (required)
- **Readwise Access Token** (get from https://readwise.io/access_token)

#### Installing Node.js on macOS

Choose one of these methods:

1. **Official Installer** (Recommended for beginners):
   - Visit [nodejs.org](https://nodejs.org/)
   - Download the LTS (Long Term Support) version
   - Run the installer

2. **Homebrew** (if you have Homebrew installed):
   ```bash
   brew install node
   ```

3. **nvm (Node Version Manager)** (Recommended for developers):
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Restart terminal or run:
   source ~/.zshrc
   
   # Install Node.js LTS
   nvm install --lts
   nvm use --lts
   ```

Verify installation:
```bash
node -v  # Should show v18.x.x or higher
npm -v   # Should show 9.x.x or higher
```

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4-turbo  # Optional: gpt-4o, gpt-4, gpt-3.5-turbo
   READWISE_ACCESS_TOKEN=your_readwise_access_token_here  # Get from https://readwise.io/access_token
   DATABASE_URL="file:./dev.db"
   BRAND_PROFILE="Principal PM, AI services + infrastructure"
   
   # Optional: Judge Agent Configuration
   # Use a separate API key/model for judging drafts (recommended for production)
   JUDGE_API_KEY=your_judge_api_key_here  # Optional: defaults to OPENAI_API_KEY if not set
   JUDGE_MODEL=gpt-4-turbo  # Optional: defaults to gpt-4-turbo
   ```

3. **Initialize database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Workflow

1. **Sync Highlights** (Home page):
   - Click "Sync Highlights" to pull highlights from Readwise
   - View sync status and total highlight count

2. **Generate Ideas** (Ideas page):
   - Click "Generate Ideas" to create 5-10 blog post ideas
   - View curator scores and shortlisted ideas
   - Ideas are scored on: groundedness, originality, brand fit, diversity, clarity

3. **View Drafts** (Drafts page):
   - See all generated blog drafts
   - Expand to view full draft, outline, alternative hooks, and social bullets
   - View supporting highlights for each draft

### API Routes

- `POST /api/workflow/run` - Run complete workflow
- `POST /api/workflow/sync` - Sync highlights only
- `POST /api/workflow/generate-ideas` - Generate ideas only
- `GET /api/sync/status` - Get sync status
- `GET /api/ideas/list` - List all ideas
- `GET /api/drafts/list` - List all drafts

## Database Schema

### Key Models

- **Highlight**: Readwise highlights with text, notes, tags, embeddings
- **Idea**: Generated blog ideas with outlines and metadata
- **CuratorScore**: Scoring and feedback for each idea
- **Draft**: Full blog drafts with outlines and repurpose packs
- **Embedding**: Vector embeddings for semantic search

See `prisma/schema.prisma` for full schema.

## Testing

Run unit tests:
```bash
npm test
```

Tests cover:
- Idea JSON schema validation
- Curator scoring logic

## Development Notes

### Readwise API Integration

The Readwise API client (`src/lib/readwise.ts`) uses the official Readwise API. To get your access token:

1. Visit https://readwise.io/access_token
2. Copy your access token
3. Add it to `.env` as `READWISE_ACCESS_TOKEN`

The client supports:
- Full and incremental sync
- Pagination (automatic)
- Rate limit handling
- Error logging

### Vector Store

The vector store (`src/lib/vector-store.ts`) uses a simple cosine similarity implementation. For production:

- Migrate to pgvector for Postgres
- Use a dedicated vector DB (Pinecone, Weaviate, etc.)
- The interface is abstracted to make this migration straightforward

### Brand Configuration

Customize your brand profile by editing `brand-config.json` in the project root. This file contains:
- Brand profile and description
- Target topics for idea generation
- Brand keywords
- Writing style guidelines
- Target audience
- Content principles

This configuration affects:
- Idea generation prompts and filtering
- Curator brand fit scoring
- Judge agent brand relevance evaluation

**Note**: After updating `brand-config.json`, restart the development server for changes to take effect.

### Judge Agent

The Judge Agent evaluates completed drafts on four dimensions:
- **Accuracy**: Factual correctness and logical consistency
- **Readability**: Clarity, flow, and structure
- **Brand Relevance**: Alignment with your brand profile
- **Style Consistency**: Adherence to your writing style

**Configuration**:
- Set `JUDGE_API_KEY` in `.env` to use a separate API key for judging (recommended)
- If not set, it will use `OPENAI_API_KEY`
- Set `JUDGE_MODEL` to specify which model to use (default: `gpt-4-turbo`)
- You can use a different model endpoint or even a different provider's API key

**Usage**: On the Drafts page, click "Judge Draft" to evaluate any completed draft. You can optionally provide custom evaluation criteria in the prompt.

## Future Enhancements

- [ ] Enhanced incremental Readwise sync
- [ ] Web research integration for CreatorAgent
- [ ] Instagram output format
- [ ] User authentication
- [ ] Postgres + pgvector migration
- [ ] Batch processing for large highlight sets
- [ ] Export drafts to Markdown/PDF

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── agents/                # Agent implementations
│   │   ├── retriever-agent.ts
│   │   ├── idea-generator-agent.ts
│   │   ├── curator-agent.ts
│   │   └── creator-agent.ts
│   ├── app/                   # Next.js app directory
│   │   ├── api/              # API routes
│   │   ├── page.tsx          # Home page
│   │   ├── ideas/            # Ideas page
│   │   └── drafts/           # Drafts page
│   ├── lib/                   # Utilities
│   │   ├── db.ts             # Prisma client
│   │   ├── openai.ts         # OpenAI client
│   │   ├── readwise.ts       # Readwise API client
│   │   └── vector-store.ts   # Vector store abstraction
│   ├── orchestrator/          # Workflow orchestration
│   │   └── workflow.ts
│   ├── types/                 # TypeScript types
│   └── __tests__/            # Unit tests
└── README.md
```

## License

MIT

