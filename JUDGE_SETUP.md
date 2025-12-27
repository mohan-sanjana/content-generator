# Judge Agent Setup

The Judge Agent evaluates completed blog drafts on four dimensions: accuracy, readability, brand relevance, and style consistency.

## Configuration

### API Key

The Judge Agent can use a separate API key from your main OpenAI key. This is recommended for production use.

**Option 1: Use a separate API key (Recommended)**

Add to your `.env` file:
```env
JUDGE_API_KEY=your_separate_openai_api_key_here
```

**Option 2: Use the same API key**

If `JUDGE_API_KEY` is not set, the Judge Agent will use `OPENAI_API_KEY` from your `.env` file.

### Model Selection

You can specify which model to use for judging:

```env
JUDGE_MODEL=gpt-4-turbo
```

Default: `gpt-4-turbo`

**Supported models:**
- `gpt-4-turbo` (default)
- `gpt-4o`
- `gpt-4`
- `gpt-3.5-turbo` (not recommended for judging)

### Using Different Providers

You can modify `src/agents/judge-agent.ts` to use a different provider's API. The judge agent uses the OpenAI SDK, but you can adapt it to use:
- Anthropic Claude API
- Google Gemini API
- Other compatible LLM APIs

## Usage

1. Navigate to the **Drafts** page
2. Expand a draft to view its content
3. Click **"Judge Draft"** button
4. Optionally provide custom evaluation criteria in the prompt field
5. Click **"Judge Draft"** to start evaluation

The judge will return scores for:
- **Accuracy** (0-100%): Factual correctness, proper citations, logical consistency
- **Readability** (0-100%): Clarity, flow, structure, ease of understanding
- **Brand Relevance** (0-100%): Alignment with your brand profile (from `brand-config.json`)
- **Style Consistency** (0-100%): Adherence to your writing style guidelines
- **Overall Score**: Average of the four dimensions
- **Feedback**: Detailed written feedback with suggestions

## Custom Evaluation Criteria

When judging a draft, you can provide custom criteria in the prompt field. Examples:

- "Focus on technical depth and accuracy"
- "Emphasize business value and ROI"
- "Check for consistency with my previous blog posts"
- "Evaluate for beginner-friendly explanations"
- "Assess how well it addresses common objections"

The judge will incorporate these criteria into its evaluation.

## Brand Configuration

The judge uses your `brand-config.json` file to evaluate brand relevance and style consistency. Make sure this file is up to date with your:
- Brand profile and description
- Writing style guidelines
- Target audience
- Content principles

See `brand-config.json` for the current configuration.

