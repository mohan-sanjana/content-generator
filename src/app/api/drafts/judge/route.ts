import { NextResponse } from 'next/server';
import { JudgeAgent } from '@/agents/judge-agent';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { draftId, customPrompt } = await request.json();

    if (!draftId) {
      return NextResponse.json({ error: 'draftId is required' }, { status: 400 });
    }

    // Fetch draft with idea
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      include: {
        idea: {
          select: {
            title: true,
            oneSentenceHook: true,
          },
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Judge the draft
    const judge = new JudgeAgent();
    const result = await judge.judgeDraft(
      draft.fullDraft,
      draft.idea.title,
      draft.idea.oneSentenceHook,
      customPrompt
    );

    // Store judge result in database (optional - you might want to add a JudgeScore table)
    // For now, we'll just return it

    return NextResponse.json({
      success: true,
      scores: {
        accuracy: result.accuracy,
        readability: result.readability,
        brandRelevance: result.brandRelevance,
        styleConsistency: result.styleConsistency,
        overallScore: result.overallScore,
      },
      feedback: result.feedback,
    });
  } catch (error) {
    console.error('[API] Judge draft error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

