import { z } from 'zod';
import OpenAI from 'openai';

const JudgeScoreSchema = z.object({
  accuracy: z.number().min(0).max(1),
  readability: z.number().min(0).max(1),
  brandRelevance: z.number().min(0).max(1),
  styleConsistency: z.number().min(0).max(1),
  overallScore: z.number().min(0).max(1),
  feedback: z.string(),
});

export interface JudgeResult {
  accuracy: number;
  readability: number;
  brandRelevance: number;
  styleConsistency: number;
  overallScore: number;
  feedback: string;
}

export class JudgeAgent {
  private judgeClient: OpenAI | null = null;
  private brandConfig: any;

  constructor() {
    // Initialize judge client with separate API key
    const judgeApiKey = process.env.JUDGE_API_KEY || process.env.OPENAI_API_KEY;
    const judgeModel = process.env.JUDGE_MODEL || 'gpt-4-turbo';
    
    if (judgeApiKey) {
      this.judgeClient = new OpenAI({
        apiKey: judgeApiKey,
      });
    }

    // Load brand config
    this.loadBrandConfig();
  }

  private loadBrandConfig() {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'brand-config.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8');
        this.brandConfig = JSON.parse(configData);
      }
    } catch (error) {
      console.warn('[JudgeAgent] Failed to load brand-config.json:', error);
      this.brandConfig = null;
    }
  }

  /**
   * Judge a draft based on accuracy, readability, brand relevance, and style consistency
   */
  async judgeDraft(
    draftContent: string,
    ideaTitle: string,
    ideaHook: string,
    customPrompt?: string
  ): Promise<JudgeResult> {
    if (!this.judgeClient) {
      throw new Error(
        'Judge API key not configured. Set JUDGE_API_KEY in your .env file. ' +
        'You can use a different OpenAI API key or model endpoint for judging.'
      );
    }

    const judgeModel = process.env.JUDGE_MODEL || 'gpt-4-turbo';
    
    const brandContext = this.brandConfig
      ? `
Brand Profile: ${this.brandConfig.profile}
Brand Description: ${this.brandConfig.description}
Target Audience: ${this.brandConfig.targetAudience?.join(', ') || 'N/A'}
Writing Style: ${JSON.stringify(this.brandConfig.writingStyle || {}, null, 2)}
Content Principles: ${this.brandConfig.contentPrinciples?.join(', ') || 'N/A'}
`
      : 'No brand configuration available.';

    const systemPrompt = `You are an expert content judge evaluating blog drafts. 
Your task is to rate content on four dimensions:

1. **Accuracy** (0-1): Factual correctness, proper citations, logical consistency
2. **Readability** (0-1): Clarity, flow, structure, ease of understanding
3. **Brand Relevance** (0-1): Alignment with brand profile, target audience, and content principles
4. **Style Consistency** (0-1): Adherence to specified writing style, tone, and voice

${customPrompt ? `\nAdditional evaluation criteria from user:\n${customPrompt}\n` : ''}

You MUST output valid JSON with this EXACT structure:
{
  "accuracy": 0.85,
  "readability": 0.90,
  "brandRelevance": 0.80,
  "styleConsistency": 0.75,
  "overallScore": 0.825,
  "feedback": "Detailed feedback explaining the scores and suggestions for improvement"
}

The overallScore should be the average of the four dimension scores.
Provide constructive, specific feedback.`;

    const userPrompt = `Evaluate this blog draft:

**Idea Title:** ${ideaTitle}
**Hook:** ${ideaHook}

**Brand Context:**
${brandContext}

**Draft Content:**
${draftContent}

${customPrompt ? `\n**Custom Evaluation Criteria:**\n${customPrompt}\n` : ''}

Provide your evaluation scores and feedback.`;

    try {
      const response = await this.judgeClient.chat.completions.create({
        model: judgeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent judging
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from judge model');
      }

      const parsed = JSON.parse(content);
      const validated = JudgeScoreSchema.parse(parsed);

      return {
        accuracy: validated.accuracy,
        readability: validated.readability,
        brandRelevance: validated.brandRelevance,
        styleConsistency: validated.styleConsistency,
        overallScore: validated.overallScore,
        feedback: validated.feedback,
      };
    } catch (error) {
      console.error('[JudgeAgent] Error judging draft:', error);
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid judge response format: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
}

