import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const drafts = await prisma.draft.findMany({
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            oneSentenceHook: true,
          },
        },
        draftHighlights: {
          include: {
            highlight: {
              select: {
                id: true,
                title: true,
                url: true,
                highlightText: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

