import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const lastSync = await prisma.syncLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    const highlightsCount = await prisma.highlight.count();

    return NextResponse.json({
      lastSync: lastSync
        ? {
            startedAt: lastSync.startedAt,
            completedAt: lastSync.completedAt,
            status: lastSync.status,
            highlightsCount: lastSync.highlightsCount,
            errorMessage: lastSync.errorMessage,
          }
        : null,
      totalHighlights: highlightsCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

