import { openai, callOpenAIWithRetry, generateEmbedding } from '@/lib/openai';
import { z } from 'zod';
import { DetailedOutline, BlogDraft } from '@/types';
import { prisma } from '@/lib/db';
import { vectorStore } from '@/lib/vector-store';

const DetailedOutlineSchema = z.object({
  introduction: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      bullets: z.array(z.string()),
    })
  ),
  conclusion: z.string(),
});

const BlogDraftSchema = z.object({
  detailedOutline: DetailedOutlineSchema,
  fullDraft: z.string(),
  wordCount: z.number(),
  alternativeHooks: z.array(z.string()).min(5).max(5),
  socialPostBullets: z.array(z.string()).min(10).max(10),
});

export interface CreatorResult {
  draftId: string;
  wordCount: number;
}

export class CreatorAgent {
  /**
   * Create a full blog draft from a shortlisted idea
   */
  async createDraft(ideaId: string): Promise<CreatorResult> {
    console.log(`[CreatorAgent] Starting draft creation for idea ${ideaId}`);
    
    // Get idea with highlights
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        ideaHighlights: {
          include: {
            highlight: true,
          },
        },
      },
    });

    if (!idea) {
      throw new Error(`Idea ${ideaId} not found`);
    }
    
    console.log(`[CreatorAgent] Found idea: "${idea.title}" with ${idea.ideaHighlights.length} highlights`);

    // Get cited highlights
    const citedHighlights = idea.ideaHighlights.map((ih) => ih.highlight);

    // Find additional relevant highlights via semantic search
    const additionalHighlights = await this.findAdditionalHighlights(idea, citedHighlights.map((h) => h.id));

    // Combine all highlights
    const allHighlights = [...citedHighlights, ...additionalHighlights];

    // Format highlights for prompt
    const highlightsText = allHighlights
      .map(
        (h) => `[ID: ${h.id}]
Title: ${h.title}
Highlight: ${h.highlightText}
Note: ${h.note || 'None'}
URL: ${h.url}`
      )
      .join('\n\n');

    // Generate draft
    console.log(`[CreatorAgent] Generating draft content...`);
    const systemPrompt = `You are an expert blog writer. Create a comprehensive, well-structured blog post based on the provided idea and supporting highlights.

CRITICAL: You MUST output valid JSON with this EXACT structure:
{
  "detailedOutline": {
    "introduction": "string (required - 2-3 sentences introducing the topic)",
    "sections": [
      {
        "heading": "string (required - section title)",
        "bullets": ["string", "string", ...] (array of bullet points, required)
      }
    ],
    "conclusion": "string (required - 2-3 sentences wrapping up)"
  },
  "fullDraft": "string (required - full blog post, 1200-1800 words)",
  "wordCount": 1500 (number, required - actual word count of fullDraft),
  "alternativeHooks": ["hook1", "hook2", "hook3", "hook4", "hook5"] (exactly 5 strings, required),
  "socialPostBullets": ["bullet1", "bullet2", ..., "bullet10"] (exactly 10 strings, required)
}

Requirements:
- Write 1200-1800 words in fullDraft
- Use a clear, engaging style
- Cite specific highlights where relevant
- fullDraft must be plain text only (NO markdown, NO HTML tags, NO formatting codes)
- Use double line breaks (\\n\\n) to separate paragraphs
- detailedOutline.sections must be an array with at least 3 sections
- alternativeHooks must be exactly 5 strings
- socialPostBullets must be exactly 10 strings
- wordCount must match the actual word count of fullDraft

Ensure ALL fields are present and properly formatted.`;

    const userPrompt = `Idea:
Title: ${idea.title}
Hook: ${idea.oneSentenceHook}
Why Now: ${idea.whyNow}
Target Audience: ${idea.targetAudience}
Outline: ${idea.outlineBullets}

Supporting Highlights:
${highlightsText}

Create a full blog draft. Write the fullDraft as plain text (no markdown, no HTML tags). Use line breaks for paragraphs.`;

    let draft;
    try {
      draft = await callOpenAIWithRetry(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        BlogDraftSchema,
        3,
        0.7
      );
    } catch (error) {
      console.error(`[CreatorAgent] Failed to generate draft after retries:`, error);
      // Re-throw with more context
      throw new Error(`Failed to generate draft: ${error instanceof Error ? error.message : 'Unknown error'}. The AI response may have been incorrectly formatted. Please try again.`);
    }
    
    console.log(`[CreatorAgent] Draft generated: ${draft.wordCount} words`);

    // Store draft in DB
    console.log(`[CreatorAgent] Saving draft to database...`);
    const dbDraft = await prisma.draft.create({
      data: {
        ideaId,
        detailedOutline: JSON.stringify(draft.detailedOutline),
        fullDraft: draft.fullDraft,
        wordCount: draft.wordCount,
        alternativeHooks: JSON.stringify(draft.alternativeHooks),
        socialPostBullets: JSON.stringify(draft.socialPostBullets),
      },
    });

    // Link all highlights to draft
    for (const highlight of allHighlights) {
      await prisma.draftHighlight.create({
        data: {
          draftId: dbDraft.id,
          highlightId: highlight.id,
        },
      });
    }

    console.log(`[CreatorAgent] Draft saved with ID: ${dbDraft.id}`);
    return {
      draftId: dbDraft.id,
      wordCount: draft.wordCount,
    };
  }

  /**
   * Find additional relevant highlights via semantic search
   */
  private async findAdditionalHighlights(
    idea: { title: string; oneSentenceHook: string; outlineBullets: string },
    excludeIds: string[]
  ): Promise<Array<{ id: string; title: string; highlightText: string; note: string | null; url: string }>> {
    // Create embedding for the idea
    const ideaText = `${idea.title} ${idea.oneSentenceHook} ${idea.outlineBullets}`;
    const queryEmbedding = await generateEmbedding(ideaText);

    // Find similar highlights
    const similar = await vectorStore.findSimilar(queryEmbedding, 5, excludeIds);

    // Fetch the highlight details
    const highlights = await prisma.highlight.findMany({
      where: {
        id: {
          in: similar.map((s) => s.highlightId),
        },
      },
      select: {
        id: true,
        title: true,
        highlightText: true,
        note: true,
        url: true,
      },
    });

    return highlights;
  }

  /**
   * Placeholder for web research (to be implemented later)
   */
  async performWebResearch(topic: string): Promise<string[]> {
    // TODO: Implement with actual search API
    // For now, return empty array
    console.log(`[Placeholder] Web research for: ${topic}`);
    return [];
  }
}

