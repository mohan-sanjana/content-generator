import { prisma } from '@/lib/db';
import { CuratorFeedback, CuratorRubric, BlogIdea } from '@/types';
import fs from 'fs';
import path from 'path';

interface BrandConfig {
  profile: string;
  brandKeywords: string[];
}

export interface CuratorResult {
  shortlistedIdeas: string[];
  feedback: Map<string, CuratorFeedback>;
  shouldRegenerate: boolean;
}

export class CuratorAgent {
  private brandConfig: BrandConfig;
  private averageScoreThreshold: number = 0.6;
  private maxGenericRisk: number = 0.7;

  constructor(brandProfile?: string) {
    this.brandConfig = this.loadBrandConfig();
  }

  private loadBrandConfig(): BrandConfig {
    if (typeof window === 'undefined') {
      try {
        const configPath = path.join(process.cwd(), 'brand-config.json');
        if (fs.existsSync(configPath)) {
          const configData = fs.readFileSync(configPath, 'utf-8');
          const parsed = JSON.parse(configData);
          return {
            profile: parsed.profile || process.env.BRAND_PROFILE || 'Principal PM, AI services + infrastructure',
            brandKeywords: parsed.brandKeywords || ['AI', 'infrastructure', 'product', 'service', 'PM', 'strategy', 'scalable'],
          };
        }
      } catch (error) {
        console.warn('[CuratorAgent] Failed to load brand-config.json, using defaults:', error);
      }
    }

    return {
      profile: process.env.BRAND_PROFILE || 'Principal PM, AI services + infrastructure',
      brandKeywords: ['AI', 'infrastructure', 'product', 'service', 'PM', 'strategy', 'scalable'],
    };
  }

  /**
   * Evaluate ideas and shortlist the best ones
   */
  async curateIdeas(batchId: number): Promise<CuratorResult> {
    // Get all ideas from this batch
    const ideas = await prisma.idea.findMany({
      where: { generationBatch: batchId },
      include: {
        ideaHighlights: true,
      },
    });

    const feedbackMap = new Map<string, CuratorFeedback>();

    // Score each idea
    for (const idea of ideas) {
      const scores = this.scoreIdea(idea);
      const averageScore = this.calculateAverage(scores);
      const shortlisted = averageScore >= this.averageScoreThreshold && idea.riskOfGeneric < this.maxGenericRisk;

      // Store scores
      await prisma.curatorScore.create({
        data: {
          ideaId: idea.id,
          groundedness: scores.groundedness,
          originality: scores.originality,
          brandFit: scores.brandFit,
          diversity: scores.diversity,
          clarity: scores.clarity,
          averageScore,
          shortlisted,
          feedback: this.generateFeedback(scores, averageScore, idea),
        },
      });

      feedbackMap.set(idea.id, {
        scores,
        averageScore,
        shortlisted,
        feedback: this.generateFeedback(scores, averageScore, idea),
      });
    }

    // Get shortlisted ideas
    const shortlistedIdeas = ideas
      .filter((idea) => {
        const feedback = feedbackMap.get(idea.id);
        return feedback?.shortlisted;
      })
      .map((idea) => idea.id)
      .slice(0, 3); // Top 3

    // Check if we need to regenerate
    const shouldRegenerate =
      shortlistedIdeas.length < 2 ||
      Array.from(feedbackMap.values()).every((f) => f.averageScore < this.averageScoreThreshold);

    return {
      shortlistedIdeas,
      feedback: feedbackMap,
      shouldRegenerate,
    };
  }

  /**
   * Score an idea across all rubric dimensions
   */
  private scoreIdea(idea: {
    id: string;
    title: string;
    oneSentenceHook: string;
    whyNow: string;
    targetAudience: string;
    outlineBullets: string;
    riskOfGeneric: number;
    noveltyScoreGuess: number;
    ideaHighlights: Array<{ highlightId: string }>;
  }): CuratorRubric {
    // Groundedness: Must cite at least 2 highlights
    const groundedness = Math.min(idea.ideaHighlights.length / 3, 1.0);

    // Originality: Inverse of riskOfGeneric, boosted by noveltyScoreGuess
    const originality = (1 - idea.riskOfGeneric) * 0.7 + idea.noveltyScoreGuess * 0.3;

    // Brand fit: Check if title/hook contains relevant keywords from brand config
    const text = `${idea.title} ${idea.oneSentenceHook} ${idea.targetAudience}`.toLowerCase();
    const keywordMatches = this.brandConfig.brandKeywords.filter((kw) => text.includes(kw.toLowerCase())).length;
    const brandFit = Math.min(keywordMatches / 3, 1.0);

    // Diversity: This would ideally compare against other ideas in the batch
    // For v1, we'll use a simple heuristic based on outline uniqueness
    const outlineBullets = JSON.parse(idea.outlineBullets) as string[];
    const uniqueWords = new Set(
      outlineBullets.flatMap((b) => b.toLowerCase().split(/\s+/))
    ).size;
    const diversity = Math.min(uniqueWords / 50, 1.0);

    // Clarity: Based on hook length and structure
    const hookLength = idea.oneSentenceHook.length;
    const clarity = hookLength >= 50 && hookLength <= 200 ? 1.0 : Math.max(0.5, 1 - Math.abs(hookLength - 125) / 125);

    return {
      groundedness,
      originality,
      brandFit,
      diversity,
      clarity,
    };
  }

  /**
   * Calculate average score
   */
  private calculateAverage(scores: CuratorRubric): number {
    return (
      (scores.groundedness +
        scores.originality +
        scores.brandFit +
        scores.diversity +
        scores.clarity) /
      5
    );
  }

  /**
   * Generate feedback text
   */
  private generateFeedback(
    scores: CuratorRubric,
    averageScore: number,
    idea: { title: string; riskOfGeneric: number }
  ): string {
    const issues: string[] = [];
    const strengths: string[] = [];

    if (scores.groundedness < 0.5) issues.push('Needs more supporting highlights');
    if (scores.originality < 0.5) issues.push('Too generic or low novelty');
    if (scores.brandFit < 0.5) issues.push('Weak alignment with brand profile');
    if (scores.clarity < 0.5) issues.push('Hook needs more clarity');

    if (scores.groundedness > 0.7) strengths.push('Well-grounded');
    if (scores.originality > 0.7) strengths.push('Original');
    if (scores.brandFit > 0.7) strengths.push('Strong brand fit');

    const feedback = [
      strengths.length > 0 ? `Strengths: ${strengths.join(', ')}` : null,
      issues.length > 0 ? `Issues: ${issues.join(', ')}` : null,
      idea.riskOfGeneric > this.maxGenericRisk ? 'High risk of being generic' : null,
    ]
      .filter(Boolean)
      .join('. ');

    return feedback || 'No specific feedback';
  }

  /**
   * Generate feedback for regeneration
   */
  generateRegenerationFeedback(feedbackMap: Map<string, CuratorFeedback>): string {
    const allIssues: string[] = [];
    const lowScores: string[] = [];

    for (const [ideaId, feedback] of feedbackMap.entries()) {
      if (feedback.scores.groundedness < 0.5) lowScores.push('groundedness');
      if (feedback.scores.originality < 0.5) lowScores.push('originality');
      if (feedback.scores.brandFit < 0.5) lowScores.push('brand fit');
    }

    if (lowScores.length > 0) {
      const commonIssues = [...new Set(lowScores)];
      allIssues.push(`Focus on improving: ${commonIssues.join(', ')}`);
    }

    allIssues.push('Ensure ideas cite at least 3-4 specific highlights');
    allIssues.push('Avoid generic topics - aim for unique angles');

    return allIssues.join('. ');
  }
}

