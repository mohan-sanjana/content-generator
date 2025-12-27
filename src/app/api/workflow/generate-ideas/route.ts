import { NextResponse } from 'next/server';
import { WorkflowOrchestrator } from '@/orchestrator/workflow';
import { CuratorAgent } from '@/agents/curator-agent';

export async function POST() {
  try {
    console.log('[API] Generate ideas request received');
    const orchestrator = new WorkflowOrchestrator();
    console.log('[API] Starting idea generation...');
    const result = await orchestrator.generateIdeas();
    console.log('[API] Ideas generated:', result.ideas?.count || 0, 'ideas');
    
    // Automatically curate the ideas
    if (result.ideas?.batchId) {
      console.log('[API] Starting curation...');
      const curator = new CuratorAgent();
      const curationResult = await curator.curateIdeas(result.ideas.batchId);
      console.log('[API] Curation complete:', curationResult.shortlistedIdeas.length, 'shortlisted');
      
      return NextResponse.json({
        ...result,
        curation: {
          shortlistedCount: curationResult.shortlistedIdeas.length,
          shortlistedIds: curationResult.shortlistedIdeas,
        },
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Generate ideas error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Provide more helpful error messages
    let userMessage = errorMessage;
    if (errorMessage.includes('zod') || errorMessage.includes('Required')) {
      userMessage = 'The AI response was missing required fields. This might be a temporary issue. Please try again.';
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
