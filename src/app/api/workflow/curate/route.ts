import { NextResponse } from 'next/server';
import { CuratorAgent } from '@/agents/curator-agent';

export async function POST(request: Request) {
  try {
    const { batchId } = await request.json();

    if (!batchId || typeof batchId !== 'number') {
      return NextResponse.json({ error: 'batchId (number) is required' }, { status: 400 });
    }

    const curator = new CuratorAgent();
    const result = await curator.curateIdeas(batchId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Curate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

