import { NextResponse } from 'next/server';
import { CreatorAgent } from '@/agents/creator-agent';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    console.log('[API] Create drafts request received');
    const { ideaIds } = await request.json();

    if (!ideaIds || !Array.isArray(ideaIds) || ideaIds.length === 0) {
      return NextResponse.json({ error: 'ideaIds array is required' }, { status: 400 });
    }

    console.log(`[API] Creating drafts for ${ideaIds.length} idea(s)...`);
    const creator = new CreatorAgent();
    const results = [];

    for (const ideaId of ideaIds) {
      try {
        console.log(`[API] Creating draft for idea ${ideaId}...`);
        const result = await creator.createDraft(ideaId);
        console.log(`[API] Draft created: ${result.draftId}`);
        results.push(result);
      } catch (error) {
        console.error(`[API] Failed to create draft for idea ${ideaId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[API] Error details:`, error);
        
        // Provide more helpful error message
        let userMessage = errorMessage;
        if (errorMessage.includes('Validation failed') || errorMessage.includes('format error')) {
          userMessage = `The AI response format was incorrect. This might be a temporary issue. Please try again. Error: ${errorMessage}`;
        }
        
        results.push({
          ideaId,
          error: userMessage,
          originalError: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        });
      }
    }

    console.log(`[API] Draft creation complete: ${results.length} result(s)`);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] Create drafts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

