import { openai, callOpenAIWithRetry } from '@/lib/openai';
import { z } from 'zod';
import { BlogIdea, HighlightRecord } from '@/types';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const BlogIdeaSchema = z.object({
  title: z.string(),
  oneSentenceHook: z.string(),
  whyNow: z.string(),
  targetAudience: z.string(),
  outlineBullets: z.array(z.string()).min(5).max(7),
  supportingHighlightIds: z.array(z.string()),
  riskOfGeneric: z.number().min(0).max(1),
  noveltyScoreGuess: z.number().min(0).max(1),
});

const IdeasResponseSchema = z.object({
  ideas: z.array(BlogIdeaSchema).min(5).max(10),
});

export interface IdeaGeneratorResult {
  ideas: BlogIdea[];
  batchId: number;
}

interface BrandConfig {
  profile: string;
  description: string;
  topics: string[];
  brandKeywords: string[];
  writingStyle: {
    tone: string;
    voice: string;
    length: string;
    structure: string;
    examples: string[];
  };
  targetAudience: string[];
  contentPrinciples: string[];
}

export class IdeaGeneratorAgent {
  private brandConfig: BrandConfig;
  private topicFilter: string[];

  constructor(brandProfile?: string) {
    // Load brand config from file
    this.brandConfig = this.loadBrandConfig();
    this.topicFilter = this.brandConfig.topics;
  }

  private loadBrandConfig(): BrandConfig {
    // Try to load from file (works in Node.js environment)
    if (typeof window === 'undefined') {
      try {
        const configPath = path.join(process.cwd(), 'brand-config.json');
        if (fs.existsSync(configPath)) {
          const configData = fs.readFileSync(configPath, 'utf-8');
          const parsed = JSON.parse(configData);
          console.log('[IdeaGenerator] Loaded brand config from brand-config.json');
          return parsed;
        }
      } catch (error) {
        console.warn('[IdeaGenerator] Failed to load brand-config.json, using defaults:', error);
      }
    }

    // Default fallback
    return {
      profile: process.env.BRAND_PROFILE || 'Principal PM, AI services + infrastructure',
      description: 'A senior product manager focused on AI services and infrastructure',
      topics: [
        'AI infrastructure',
        'AI',
        'Generative AI',
        'Product Management',
        'Business',
        'Strategy',
        'User Experience',
        'Value Chain'
      ],
      brandKeywords: ['AI', 'infrastructure', 'product', 'service', 'PM', 'strategy', 'scalable'],
      writingStyle: {
        tone: 'Professional yet accessible',
        voice: 'Authoritative but approachable',
        length: '1200-1800 words',
        structure: 'Clear introduction, well-organized sections, strong conclusion',
        examples: []
      },
      targetAudience: ['Product managers', 'Engineering leaders', 'AI/ML practitioners'],
      contentPrinciples: ['Grounded in real-world experience', 'Actionable insights over theory']
    };
  }

  /**
   * Filter highlights by topic relevance using semantic search
   */
  private async filterHighlightsByTopic(highlights: HighlightRecord[]): Promise<HighlightRecord[]> {
    if (highlights.length === 0) {
      return highlights;
    }

    console.log(`[IdeaGenerator] Filtering ${highlights.length} highlights by topic relevance...`);
    console.log(`[IdeaGenerator] Target topics: ${this.topicFilter.join(', ')}`);

    // Create a query string from all topics
    const topicQuery = this.topicFilter.join(' ');
    
    // Generate embedding for the topic query
    const { generateEmbedding } = await import('@/lib/openai');
    const { vectorStore } = await import('@/lib/vector-store');
    
    try {
      const topicEmbedding = await generateEmbedding(topicQuery);
      
      // Find relevant highlights using semantic search
      const relevantHighlights = await vectorStore.query(topicEmbedding, highlights.length, []);
      
      // Create a map of highlight IDs to relevance scores
      const relevanceMap = new Map<string, number>();
      relevantHighlights.forEach((h, index) => {
        // Higher score = more relevant (earlier in results = more relevant)
        relevanceMap.set(h.id, 1 - (index / relevantHighlights.length));
      });

      // Filter and sort highlights by relevance
      const filtered = highlights
        .map(h => ({
          highlight: h,
          relevance: relevanceMap.get(h.id) || 0,
        }))
        .filter(item => {
          // Include if relevance score > 0.3 or if it matches keywords
          const text = `${item.highlight.highlightText} ${item.highlight.title} ${item.highlight.note || ''}`.toLowerCase();
          const matchesKeyword = this.topicFilter.some(topic => 
            text.includes(topic.toLowerCase())
          );
          return item.relevance > 0.3 || matchesKeyword;
        })
        .sort((a, b) => b.relevance - a.relevance)
        .map(item => item.highlight);

      console.log(`[IdeaGenerator] Filtered to ${filtered.length} relevant highlights (from ${highlights.length})`);
      return filtered;
    } catch (error) {
      console.warn(`[IdeaGenerator] Error in semantic filtering, using keyword fallback:`, error);
      
      // Fallback to keyword matching
      const filtered = highlights.filter(h => {
        const text = `${h.highlightText} ${h.title} ${h.note || ''} ${h.tags.join(' ')}`.toLowerCase();
        return this.topicFilter.some(topic => text.includes(topic.toLowerCase()));
      });
      
      console.log(`[IdeaGenerator] Keyword filter: ${filtered.length} highlights match topics (from ${highlights.length})`);
      return filtered;
    }
  }

  /**
   * Generate blog ideas from highlights
   */
  async generateIdeas(highlights: HighlightRecord[], feedback?: string): Promise<IdeaGeneratorResult> {
    // Filter highlights by topic relevance first
    const filteredHighlights = await this.filterHighlightsByTopic(highlights);
    
    if (filteredHighlights.length === 0) {
      console.warn(`[IdeaGenerator] No highlights match the topic filter after filtering`);
      // Still proceed with empty highlights - let the LLM handle it
    }
    
    // Use filtered highlights for idea generation
    const highlightsToUse = filteredHighlights.length > 0 ? filteredHighlights : highlights;
    // Get the next batch number
    const lastBatch = await prisma.idea.findFirst({
      orderBy: { generationBatch: 'desc' },
      select: { generationBatch: true },
    });
    const batchId = (lastBatch?.generationBatch || 0) + 1;

    // Format highlights for prompt
    const highlightsText = highlightsToUse
      .map(
        (h) => `[ID: ${h.id}]
Title: ${h.title}
Highlight: ${h.highlightText}
Note: ${h.note || 'None'}
Tags: ${h.tags.join(', ')}
URL: ${h.url}`
      )
      .join('\n\n');

    const systemPrompt = `You are a blog idea generator for ${this.brandConfig.profile}.

Brand Profile: ${this.brandConfig.description}

Target Audience: ${this.brandConfig.targetAudience.join(', ')}

Content Principles:
${this.brandConfig.contentPrinciples.map(p => `- ${p}`).join('\n')}

IMPORTANT: Only generate ideas related to these topics:
${this.topicFilter.map(t => `- ${t}`).join('\n')}

Focus on ideas that align with the brand profile and target audience. Ignore highlights that don't relate to these topics.

CRITICAL: You MUST output valid JSON with this EXACT structure:
{
  "ideas": [
    {
      "title": "string (required)",
      "oneSentenceHook": "string (required - one compelling sentence)",
      "whyNow": "string (required - why this topic matters now)",
      "targetAudience": "string (required - who is this for)",
      "outlineBullets": ["string", "string", "string", "string", "string"] (5-7 items, required),
      "supportingHighlightIds": ["id1", "id2"] (array of highlight IDs, required),
      "riskOfGeneric": 0.5 (number 0-1, required),
      "noveltyScoreGuess": 0.7 (number 0-1, required)
    }
  ]
}

Each idea must:
- Include ALL required fields (title, oneSentenceHook, whyNow, targetAudience, outlineBullets, supportingHighlightIds, riskOfGeneric, noveltyScoreGuess)
- Be grounded in at least 2-3 specific highlights (cite their IDs from the provided highlights)
- Have a clear, compelling hook in oneSentenceHook
- Explain why this topic is relevant now in whyNow
- Include exactly 5-7 outline bullets
- Assess risk of being generic (0-1 scale) in riskOfGeneric
- Guess novelty score (0-1 scale) in noveltyScoreGuess

CRITICAL: You MUST generate between 5 and 10 ideas. Do NOT generate just 1 idea. Generate multiple diverse ideas.

Generate 5-10 ideas. Ensure every field is present and properly formatted.`;

    const userPrompt = feedback
      ? `Previous feedback: ${feedback}\n\nGenerate NEW ideas that address this feedback.\n\nHighlights:\n${highlightsText}\n\nIMPORTANT: Generate 5-10 different ideas, not just one.`
      : `Generate blog ideas from these highlights:\n\n${highlightsText}\n\nIMPORTANT: Generate 5-10 different ideas, not just one. Each idea should be unique and different from the others.`;

    const response = await callOpenAIWithRetry(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      IdeasResponseSchema,
      3,
      0.8 // Slightly higher temperature for creativity
    );

    console.log(`[IdeaGenerator] Received ${response.ideas.length} ideas from LLM`);
    
    // Validate highlight IDs exist
    const validIdeas: BlogIdea[] = [];
    for (const idea of response.ideas) {
      const validHighlightIds: string[] = [];
      for (const highlightId of idea.supportingHighlightIds) {
        const exists = await prisma.highlight.findUnique({
          where: { id: highlightId },
        });
        if (exists) {
          validHighlightIds.push(highlightId);
        } else {
          console.warn(`[IdeaGenerator] Highlight ID ${highlightId} not found in database`);
        }
      }

      if (validHighlightIds.length >= 1) {
        // Only include ideas with at least 1 valid highlight
        validIdeas.push({
          ...idea,
          supportingHighlightIds: validHighlightIds,
        });
      } else {
        console.warn(`[IdeaGenerator] Idea "${idea.title}" filtered out - no valid highlights`);
      }
    }
    
    console.log(`[IdeaGenerator] ${validIdeas.length} ideas passed validation (out of ${response.ideas.length})`);

    // Store ideas in DB
    for (const idea of validIdeas) {
      const dbIdea = await prisma.idea.create({
        data: {
          title: idea.title,
          oneSentenceHook: idea.oneSentenceHook,
          whyNow: idea.whyNow,
          targetAudience: idea.targetAudience,
          outlineBullets: JSON.stringify(idea.outlineBullets),
          riskOfGeneric: idea.riskOfGeneric,
          noveltyScoreGuess: idea.noveltyScoreGuess,
          generationBatch: batchId,
        },
      });

      // Link highlights
      for (const highlightId of idea.supportingHighlightIds) {
        await prisma.ideaHighlight.create({
          data: {
            ideaId: dbIdea.id,
            highlightId,
          },
        });
      }
    }

    return {
      ideas: validIdeas,
      batchId,
    };
  }
}

