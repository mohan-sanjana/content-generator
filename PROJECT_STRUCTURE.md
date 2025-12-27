# Project Structure

```
Day-2 Agent Project/
├── prisma/
│   └── schema.prisma              # Database schema (SQLite, designed for Postgres migration)
│
├── src/
│   ├── agents/                    # Agent implementations
│   │   ├── retriever-agent.ts     # Syncs Glasp highlights, creates embeddings
│   │   ├── idea-generator-agent.ts # Generates blog ideas from highlights
│   │   ├── curator-agent.ts      # Scores and filters ideas
│   │   └── creator-agent.ts       # Creates full blog drafts
│   │
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API routes
│   │   │   ├── workflow/
│   │   │   │   ├── run/route.ts   # Full workflow execution
│   │   │   │   ├── sync/route.ts  # Sync highlights only
│   │   │   │   ├── generate-ideas/route.ts
│   │   │   │   ├── curate/route.ts
│   │   │   │   └── create-drafts/route.ts
│   │   │   ├── sync/
│   │   │   │   └── status/route.ts
│   │   │   ├── ideas/
│   │   │   │   └── list/route.ts
│   │   │   └── drafts/
│   │   │       └── list/route.ts
│   │   ├── page.tsx               # Home page (sync highlights)
│   │   ├── ideas/
│   │   │   └── page.tsx           # Ideas page (view generated ideas)
│   │   ├── drafts/
│   │   │   └── page.tsx           # Drafts page (view blog drafts)
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── lib/                       # Core utilities
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── openai.ts              # OpenAI client + helpers
│   │   ├── glasp.ts               # Glasp API client (mock for v1)
│   │   └── vector-store.ts        # Vector store abstraction
│   │
│   ├── orchestrator/
│   │   └── workflow.ts            # Workflow orchestration
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   │
│   └── __tests__/                 # Unit tests
│       ├── idea-validation.test.ts
│       └── curator-scoring.test.ts
│
├── .env.example                   # Environment variable template
├── .gitignore
├── jest.config.js
├── jest.setup.js
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Key Files

### Agents
- **retriever-agent.ts**: Handles Glasp API sync, creates embeddings, stores highlights
- **idea-generator-agent.ts**: Uses LLM to generate 5-10 blog ideas from highlights
- **curator-agent.ts**: Scores ideas on 5 dimensions, shortlists best ones
- **creator-agent.ts**: Generates full blog drafts with outlines and social content

### Database
- **schema.prisma**: SQLite schema with models for Highlights, Ideas, CuratorScores, Drafts, Embeddings
- Designed to easily migrate to Postgres + pgvector

### API Routes
- Workflow endpoints for each step
- List endpoints for UI data fetching
- Status endpoints for monitoring

### UI Pages
- **Home**: Sync highlights, view status
- **Ideas**: Generate and view ideas with scores
- **Drafts**: View completed blog drafts

