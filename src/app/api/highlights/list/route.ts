import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const highlights = await prisma.highlight.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        url: true,
        author: true,
        highlightText: true,
        note: true,
        tags: true,
        sourceDomain: true,
        createdAt: true,
        syncedAt: true,
      },
    });

    const total = await prisma.highlight.count();

    return NextResponse.json({
      highlights: highlights.map((h) => ({
        ...h,
        tags: JSON.parse(h.tags) as string[],
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

