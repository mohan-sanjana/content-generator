import { CuratorAgent } from '@/agents/curator-agent';

describe('Curator Scoring Logic', () => {
  let curator: CuratorAgent;

  beforeEach(() => {
    curator = new CuratorAgent();
  });

  it('should calculate average score correctly', () => {
    const scores = {
      groundedness: 0.8,
      originality: 0.7,
      brandFit: 0.6,
      diversity: 0.5,
      clarity: 0.9,
    };

    // Access private method via type assertion (for testing)
    const calculateAverage = (curator as any).calculateAverage.bind(curator);
    const average = calculateAverage(scores);

    const expected = (0.8 + 0.7 + 0.6 + 0.5 + 0.9) / 5;
    expect(average).toBeCloseTo(expected, 2);
  });

  it('should score groundedness based on highlight count', () => {
    const ideaWithManyHighlights = {
      id: '1',
      title: 'Test',
      oneSentenceHook: 'Hook',
      whyNow: 'Now',
      targetAudience: 'PMs',
      outlineBullets: JSON.stringify(['1', '2', '3', '4', '5']),
      riskOfGeneric: 0.3,
      noveltyScoreGuess: 0.8,
      ideaHighlights: [
        { highlightId: 'h1' },
        { highlightId: 'h2' },
        { highlightId: 'h3' },
      ],
    };

    const ideaWithFewHighlights = {
      ...ideaWithManyHighlights,
      ideaHighlights: [{ highlightId: 'h1' }],
    };

    const scoreIdea = (curator as any).scoreIdea.bind(curator);
    const scoresMany = scoreIdea(ideaWithManyHighlights);
    const scoresFew = scoreIdea(ideaWithFewHighlights);

    expect(scoresMany.groundedness).toBeGreaterThan(scoresFew.groundedness);
  });

  it('should score originality inversely to riskOfGeneric', () => {
    const lowRiskIdea = {
      id: '1',
      title: 'Test',
      oneSentenceHook: 'Hook',
      whyNow: 'Now',
      targetAudience: 'PMs',
      outlineBullets: JSON.stringify(['1', '2', '3', '4', '5']),
      riskOfGeneric: 0.2,
      noveltyScoreGuess: 0.9,
      ideaHighlights: [{ highlightId: 'h1' }, { highlightId: 'h2' }],
    };

    const highRiskIdea = {
      ...lowRiskIdea,
      riskOfGeneric: 0.9,
      noveltyScoreGuess: 0.1,
    };

    const scoreIdea = (curator as any).scoreIdea.bind(curator);
    const scoresLow = scoreIdea(lowRiskIdea);
    const scoresHigh = scoreIdea(highRiskIdea);

    expect(scoresLow.originality).toBeGreaterThan(scoresHigh.originality);
  });

  it('should score clarity based on hook length', () => {
    const goodHook = {
      id: '1',
      title: 'Test',
      oneSentenceHook: 'This is a perfectly sized hook that is around 125 characters long and should score well on clarity metrics.',
      whyNow: 'Now',
      targetAudience: 'PMs',
      outlineBullets: JSON.stringify(['1', '2', '3', '4', '5']),
      riskOfGeneric: 0.3,
      noveltyScoreGuess: 0.8,
      ideaHighlights: [{ highlightId: 'h1' }],
    };

    const shortHook = {
      ...goodHook,
      oneSentenceHook: 'Short',
    };

    const scoreIdea = (curator as any).scoreIdea.bind(curator);
    const scoresGood = scoreIdea(goodHook);
    const scoresShort = scoreIdea(shortHook);

    expect(scoresGood.clarity).toBeGreaterThan(scoresShort.clarity);
  });
});

