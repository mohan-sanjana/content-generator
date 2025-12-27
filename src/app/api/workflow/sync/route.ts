import { NextResponse } from 'next/server';
import { WorkflowOrchestrator } from '@/orchestrator/workflow';

export async function POST() {
  try {
    console.log('[API] Sync request received');
    const orchestrator = new WorkflowOrchestrator();
    const result = await orchestrator.syncHighlights();
    console.log('[API] Sync completed:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[API] Error stack:', errorStack);
    return NextResponse.json(
      { 
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

