import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { fullDraft } = await request.json();

    if (!fullDraft || typeof fullDraft !== 'string') {
      return NextResponse.json(
        { error: 'fullDraft (string) is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.draft.update({
      where: { id },
      data: { fullDraft },
    });

    return NextResponse.json({ success: true, draft: updated });
  } catch (error) {
    console.error('[API] Update draft error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

