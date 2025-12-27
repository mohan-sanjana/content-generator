# Content Ideas Engine - Handover Document

## Project Overview
A Next.js application that transforms Readwise highlights into blog post ideas and full drafts using a multi-agent AI workflow. Built with TypeScript, Prisma (SQLite), and OpenAI API.

## Architecture: Multi-Agent System

The application uses 4 specialized agents that work together:

1. **RetrieverAgent** (`src/agents/retriever-agent.ts`)
   - Fetches highlights from Readwise API
   - Creates embeddings and stores in vector store
   - Filters by date (last 30 days) and topic relevance

2. **IdeaGeneratorAgent** (`src/agents/idea-generator-agent.ts`)
   - Generates 5-10 blog ideas from highlights
   - Uses brand config (`brand-config.json`) for alignment
   - Filters highlights by topic using semantic search

3. **CuratorAgent** (`src/agents/curator-agent.ts`)
   - Scores ideas on 5 dimensions: groundedness, originality, brand fit, diversity, clarity
   - Shortlists top 2-3 ideas
   - Can trigger regeneration if scores are low

4. **CreatorAgent** (`src/agents/creator-agent.ts`)
   - Creates full blog drafts (1200-1800 words)
   - Generates outlines, alternative hooks, and social post bullets
   - Uses cited highlights + semantic search for additional context

5. **JudgeAgent** (`src/agents/judge-agent.ts`) - Optional
   - Evaluates completed drafts on accuracy, readability, brand relevance, style consistency
   - Uses separate API key (JUDGE_API_KEY) if configured

## Folder Structure

```
├── src/
│   ├── agents/              # Core agent implementations
│   │   ├── retriever-agent.ts    # Syncs highlights from Readwise
│   │   ├── idea-generator-agent.ts # Generates blog ideas
│   │   ├── curator-agent.ts      # Scores and shortlists ideas
│   │   ├── creator-agent.ts      # Creates full blog drafts
│   │   └── judge-agent.ts        # Evaluates draft quality
│   │
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── workflow/   # Main workflow endpoints
│   │   │   ├── drafts/     # Draft management (list, judge, update)
│   │   │   ├── ideas/       # Idea listing
│   │   │   └── highlights/ # Highlight management
│   │   ├── page.tsx        # Home page (sync highlights)
│   │   ├── ideas/page.tsx   # Ideas page (generate/view ideas)
│   │   └── drafts/page.tsx # Drafts page (view/edit/judge)
│   │
│   ├── lib/                 # Core utilities
│   │   ├── db.ts           # Prisma client singleton
│   │   ├── openai.ts       # OpenAI API wrapper (embeddings + chat)
│   │   ├── readwise.ts     # Readwise API client
│   │   └── vector-store.ts # Vector embeddings storage (SQLite-based)
│   │
│   ├── orchestrator/        # Workflow coordination
│   │   └── workflow.ts     # Orchestrates agent sequence
│   │
│   └── types/              # TypeScript type definitions
│       └── index.ts
│
├── prisma/
│   └── schema.prisma       # Database schema (SQLite → Postgres ready)
│
├── brand-config.json        # Brand profile, topics, writing style
└── .env                     # API keys (not in git)

```

## Key Data Flow

1. **Sync Highlights**: User clicks "Sync" → `RetrieverAgent` → Fetches from Readwise → Stores in DB → Creates embeddings
2. **Generate Ideas**: User clicks "Generate Ideas" → `IdeaGeneratorAgent` → LLM generates ideas → `CuratorAgent` scores them → UI displays with color coding
3. **Create Draft**: User clicks "Create Draft" → `CreatorAgent` → LLM creates full draft → Stored in DB
4. **Judge Draft**: User clicks "Judge Draft" → `JudgeAgent` → Evaluates on 4 dimensions → Displays scores

## Database Models (Prisma)

- **Highlight**: Readwise highlights with text, notes, tags, embeddings
- **Idea**: Generated blog ideas with metadata
- **CuratorScore**: Scoring results for each idea
- **Draft**: Full blog drafts with outlines and repurpose packs
- **Embedding**: Vector embeddings for semantic search
- **SyncLog**: Sync history and status

## Configuration Files

- **`brand-config.json`**: Brand profile, topics, writing style, target audience
- **`.env`**: API keys (OPENAI_API_KEY, READWISE_ACCESS_TOKEN, JUDGE_API_KEY)
- **`prisma/schema.prisma`**: Database schema

## API Routes

- `POST /api/workflow/sync` - Sync highlights
- `POST /api/workflow/generate-ideas` - Generate ideas (auto-curates)
- `POST /api/workflow/regenerate-ideas` - Regenerate with feedback
- `POST /api/workflow/create-drafts` - Create drafts from idea IDs
- `POST /api/drafts/judge` - Judge a draft
- `PATCH /api/drafts/[id]` - Update draft content
- `GET /api/ideas/list` - List all ideas
- `GET /api/drafts/list` - List all drafts

## Important Patterns

1. **Agent Pattern**: Each agent is a class with a single responsibility
2. **Orchestrator Pattern**: `WorkflowOrchestrator` coordinates agents
3. **Vector Store Abstraction**: `vector-store.ts` can be swapped for pgvector/other DBs
4. **Brand Config**: Loaded at runtime from `brand-config.json` (edit & restart server)

## Common Tasks

**Add a new agent**: Create class in `src/agents/`, add to orchestrator, create API route
**Modify brand profile**: Edit `brand-config.json`, restart dev server
**Change LLM model**: Set `OPENAI_MODEL` or `JUDGE_MODEL` in `.env`
**Add new evaluation metric**: Update `CuratorAgent.scoreIdea()` or `JudgeAgent`

## Development Commands

```bash
npm run dev          # Start dev server
npm run db:push      # Update database schema
npm run db:studio    # Open Prisma Studio
npm test             # Run tests
```

## Key Dependencies

- **Next.js 14**: App Router, React Server Components
- **Prisma**: ORM for database access
- **OpenAI SDK**: LLM and embeddings
- **Zod**: Schema validation for LLM responses
- **TypeScript**: Type safety throughout

## Notes for Junior Engineers

- All agents use structured JSON outputs with Zod validation
- Error handling includes retry logic for API calls
- Vector store uses cosine similarity (can migrate to pgvector)
- UI state management uses React hooks (useState, useEffect)
- Database is SQLite for v1, designed to migrate to Postgres
- Brand config is loaded server-side only (Node.js fs module)

