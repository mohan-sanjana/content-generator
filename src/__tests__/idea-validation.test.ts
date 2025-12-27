import { z } from 'zod';

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

describe('Idea JSON Schema Validation', () => {
  it('should validate a correct idea', () => {
    const validIdea = {
      title: 'Test Blog Post',
      oneSentenceHook: 'This is a compelling hook that draws readers in.',
      whyNow: 'Recent developments make this topic timely.',
      targetAudience: 'Product managers and engineers',
      outlineBullets: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'],
      supportingHighlightIds: ['id1', 'id2'],
      riskOfGeneric: 0.3,
      noveltyScoreGuess: 0.8,
    };

    expect(() => BlogIdeaSchema.parse(validIdea)).not.toThrow();
  });

  it('should reject idea with too few outline bullets', () => {
    const invalidIdea = {
      title: 'Test Blog Post',
      oneSentenceHook: 'This is a compelling hook.',
      whyNow: 'Recent developments.',
      targetAudience: 'PMs',
      outlineBullets: ['Point 1', 'Point 2'], // Too few
      supportingHighlightIds: ['id1'],
      riskOfGeneric: 0.3,
      noveltyScoreGuess: 0.8,
    };

    expect(() => BlogIdeaSchema.parse(invalidIdea)).toThrow();
  });

  it('should reject idea with too many outline bullets', () => {
    const invalidIdea = {
      title: 'Test Blog Post',
      oneSentenceHook: 'This is a compelling hook.',
      whyNow: 'Recent developments.',
      targetAudience: 'PMs',
      outlineBullets: ['1', '2', '3', '4', '5', '6', '7', '8'], // Too many
      supportingHighlightIds: ['id1'],
      riskOfGeneric: 0.3,
      noveltyScoreGuess: 0.8,
    };

    expect(() => BlogIdeaSchema.parse(invalidIdea)).toThrow();
  });

  it('should reject idea with riskOfGeneric out of range', () => {
    const invalidIdea = {
      title: 'Test Blog Post',
      oneSentenceHook: 'This is a compelling hook.',
      whyNow: 'Recent developments.',
      targetAudience: 'PMs',
      outlineBullets: ['1', '2', '3', '4', '5'],
      supportingHighlightIds: ['id1'],
      riskOfGeneric: 1.5, // Out of range
      noveltyScoreGuess: 0.8,
    };

    expect(() => BlogIdeaSchema.parse(invalidIdea)).toThrow();
  });
});

