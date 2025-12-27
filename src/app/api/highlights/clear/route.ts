import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('[API] Clearing highlights database...');
    
    // Delete all related records first (due to foreign key constraints)
    await prisma.draftHighlight.deleteMany({});
    await prisma.ideaHighlight.deleteMany({});
    await prisma.embedding.deleteMany({});
    
    // Delete all highlights
    const deletedCount = await prisma.highlight.deleteMany({});
    
    console.log(`[API] Cleared ${deletedCount.count} highlights from database`);
    
    return NextResponse.json({
      success: true,
      deletedCount: deletedCount.count,
      message: `Successfully cleared ${deletedCount.count} highlights`,
    });
  } catch (error) {
    console.error('[API] Error clearing highlights:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

