import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const ideas = await prisma.idea.findMany({
      include: {
        curatorScores: true,
        ideaHighlights: {
          include: {
            highlight: {
              select: {
                id: true,
                title: true,
                url: true,
                highlightText: true,
                note: true,
                author: true,
                sourceDomain: true,
                tags: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ ideas });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

