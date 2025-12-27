import { RetrieverAgent } from '@/agents/retriever-agent';
import { IdeaGeneratorAgent } from '@/agents/idea-generator-agent';
import { CuratorAgent } from '@/agents/curator-agent';
import { CreatorAgent } from '@/agents/creator-agent';
import { WorkflowState } from '@/types';
import { prisma } from '@/lib/db';

export interface WorkflowResult {
  state: WorkflowState;
  syncResult?: {
    highlightsCount: number;
    newHighlights: number;
    updatedHighlights: number;
  };
  ideas?: {
    batchId: number;
    count: number;
  };
  shortlistedIdeas?: string[];
  drafts?: Array<{
    draftId: string;
    ideaId: string;
    wordCount: number;
  }>;
}

export class WorkflowOrchestrator {
  private retriever: RetrieverAgent;
  private ideaGenerator: IdeaGeneratorAgent;
  private curator: CuratorAgent;
  private creator: CreatorAgent;

  constructor() {
    this.retriever = new RetrieverAgent();
    this.ideaGenerator = new IdeaGeneratorAgent();
    this.curator = new CuratorAgent();
    this.creator = new CreatorAgent();
  }

  /**
   * Run the complete workflow
   */
  async runWorkflow(): Promise<WorkflowResult> {
    const state: WorkflowState = { step: 'sync' };
    const result: WorkflowResult = { state };

    try {
      // Step 1: Sync highlights
      console.log('[Workflow] Step 1: Syncing highlights...');
      const syncResult = await this.retriever.syncHighlights();
      result.syncResult = {
        highlightsCount: syncResult.highlightsCount,
        newHighlights: syncResult.newHighlights,
        updatedHighlights: syncResult.updatedHighlights,
      };
      state.step = 'generate';
      state.syncLogId = syncResult.syncLogId;

      // Step 2: Generate ideas
      console.log('[Workflow] Step 2: Generating ideas...');
      const topHighlights = await this.retriever.getTopHighlights(20);
      let ideaResult = await this.ideaGenerator.generateIdeas(topHighlights);
      result.ideas = {
        batchId: ideaResult.batchId,
        count: ideaResult.ideas.length,
      };
      state.ideaBatchId = ideaResult.batchId;

      // Step 3: Curate ideas (with retry loop)
      console.log('[Workflow] Step 3: Curating ideas...');
      state.step = 'curate';
      let curationResult = await this.curator.curateIdeas(ideaResult.batchId);
      let regenerationAttempts = 0;
      const maxRegenerationAttempts = 2;

      while (curationResult.shouldRegenerate && regenerationAttempts < maxRegenerationAttempts) {
        console.log(`[Workflow] Regenerating ideas (attempt ${regenerationAttempts + 1})...`);
        const feedback = this.curator.generateRegenerationFeedback(curationResult.feedback);
        ideaResult = await this.ideaGenerator.generateIdeas(topHighlights, feedback);
        curationResult = await this.curator.curateIdeas(ideaResult.batchId);
        regenerationAttempts++;
      }

      // Update shortlisted ideas in state
      result.shortlistedIdeas = curationResult.shortlistedIdeas;
      state.shortlistedIdeaIds = curationResult.shortlistedIdeas;

      if (curationResult.shortlistedIdeas.length === 0) {
        throw new Error('No ideas were shortlisted after curation');
      }

      // Step 4: Create drafts
      console.log('[Workflow] Step 4: Creating drafts...');
      state.step = 'create';
      const drafts: Array<{ draftId: string; ideaId: string; wordCount: number }> = [];

      for (const ideaId of curationResult.shortlistedIdeas) {
        try {
          const draftResult = await this.creator.createDraft(ideaId);
          drafts.push({
            draftId: draftResult.draftId,
            ideaId,
            wordCount: draftResult.wordCount,
          });
        } catch (error) {
          console.error(`[Workflow] Failed to create draft for idea ${ideaId}:`, error);
          // Continue with other drafts
        }
      }

      result.drafts = drafts;
      state.draftIds = drafts.map((d) => d.draftId);
      state.step = 'complete';

      console.log('[Workflow] Complete!');
      return result;
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      state.step = 'complete';
      throw error;
    }
  }

  /**
   * Run individual workflow steps (for UI)
   */
  async syncHighlights(): Promise<WorkflowResult> {
    const syncResult = await this.retriever.syncHighlights();
    return {
      state: { step: 'sync', syncLogId: syncResult.syncLogId },
      syncResult: {
        highlightsCount: syncResult.highlightsCount,
        newHighlights: syncResult.newHighlights,
        updatedHighlights: syncResult.updatedHighlights,
      },
    };
  }

  async generateIdeas(): Promise<WorkflowResult> {
    const topHighlights = await this.retriever.getTopHighlights(20);
    const ideaResult = await this.ideaGenerator.generateIdeas(topHighlights);
    return {
      state: { step: 'generate', ideaBatchId: ideaResult.batchId },
      ideas: {
        batchId: ideaResult.batchId,
        count: ideaResult.ideas.length,
      },
    };
  }
}

