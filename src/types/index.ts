// Core domain types

export interface HighlightRecord {
  id: string;
  glaspId?: string;
  url: string;
  title: string;
  author?: string;
  createdAt: Date;
  highlightText: string;
  note?: string;
  tags: string[];
  sourceDomain: string;
}

export interface BlogIdea {
  title: string;
  oneSentenceHook: string;
  whyNow: string;
  targetAudience: string;
  outlineBullets: string[];
  supportingHighlightIds: string[];
  riskOfGeneric: number;
  noveltyScoreGuess: number;
}

export interface CuratorRubric {
  groundedness: number; // 0-1, must cite highlight ids
  originality: number; // 0-1, not generic
  brandFit: number; // 0-1, fit to brand profile
  diversity: number; // 0-1, diversity across themes
  clarity: number; // 0-1, clarity of hook
}

export interface CuratorFeedback {
  scores: CuratorRubric;
  averageScore: number;
  feedback?: string;
  shortlisted: boolean;
}

export interface DetailedOutline {
  introduction: string;
  sections: Array<{
    heading: string;
    bullets: string[];
  }>;
  conclusion: string;
}

export interface BlogDraft {
  detailedOutline: DetailedOutline;
  fullDraft: string;
  wordCount: number;
  alternativeHooks: string[];
  socialPostBullets: string[];
}

export interface WorkflowState {
  step: 'sync' | 'generate' | 'curate' | 'create' | 'complete';
  syncLogId?: string;
  ideaBatchId?: number;
  shortlistedIdeaIds?: string[];
  draftIds?: string[];
  error?: string;
}

