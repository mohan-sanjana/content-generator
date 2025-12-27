import { NextResponse } from 'next/server';
import { WorkflowOrchestrator } from '@/orchestrator/workflow';
import { CuratorAgent } from '@/agents/curator-agent';
import { RetrieverAgent } from '@/agents/retriever-agent';
import { IdeaGeneratorAgent } from '@/agents/idea-generator-agent';

export async function POST(request: Request) {
  try {
    console.log('[API] Regenerate ideas request received');
    const { feedback } = await request.json();

    if (!feedback || typeof feedback !== 'string' || !feedback.trim()) {
      return NextResponse.json(
        { error: 'feedback (string) is required' },
        { status: 400 }
      );
    }

    console.log('[API] User feedback:', feedback);

    // Get recent highlights
    const retriever = new RetrieverAgent();
    const topHighlights = await retriever.getTopHighlights(20);

    // Generate new ideas with user feedback
    const ideaGenerator = new IdeaGeneratorAgent();
    const ideaResult = await ideaGenerator.generateIdeas(topHighlights, feedback);
    console.log('[API] Regenerated ideas:', ideaResult.ideas.length, 'ideas');

    // Auto-curate the new ideas
    if (ideaResult.batchId) {
      console.log('[API] Starting curation of regenerated ideas...');
      const curator = new CuratorAgent();
      const curationResult = await curator.curateIdeas(ideaResult.batchId);
      console.log('[API] Curation complete:', curationResult.shortlistedIdeas.length, 'shortlisted');

      return NextResponse.json({
        ideas: {
          batchId: ideaResult.batchId,
          count: ideaResult.ideas.length,
        },
        curation: {
          shortlistedCount: curationResult.shortlistedIdeas.length,
          shortlistedIds: curationResult.shortlistedIdeas,
        },
      });
    }

    return NextResponse.json({
      ideas: {
        batchId: ideaResult.batchId,
        count: ideaResult.ideas.length,
      },
    });
  } catch (error) {
    console.error('[API] Regenerate ideas error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    let userMessage = errorMessage;
    if (errorMessage.includes('zod') || errorMessage.includes('Required')) {
      userMessage = 'The AI response was missing required fields. This might be a temporary issue. Please try again.';
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

