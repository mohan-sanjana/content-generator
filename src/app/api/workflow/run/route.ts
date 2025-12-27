import { NextResponse } from 'next/server';
import { WorkflowOrchestrator } from '@/orchestrator/workflow';

export async function POST() {
  try {
    const orchestrator = new WorkflowOrchestrator();
    const result = await orchestrator.runWorkflow();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Workflow error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

