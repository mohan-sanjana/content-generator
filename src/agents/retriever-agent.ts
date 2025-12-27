import { ReadwiseClient, ReadwiseHighlight } from '@/lib/readwise';
import { prisma } from '@/lib/db';
import { generateEmbedding } from '@/lib/openai';
import { vectorStore } from '@/lib/vector-store';
import { HighlightRecord } from '@/types';

export interface RetrieverResult {
  highlightsCount: number;
  newHighlights: number;
  updatedHighlights: number;
  syncLogId: string;
}

export class RetrieverAgent {
  private readwiseClient: ReadwiseClient;

  constructor(readwiseClient?: ReadwiseClient) {
    this.readwiseClient = readwiseClient || new ReadwiseClient();
  }

  /**
   * Sync highlights from Readwise API
   * Supports incremental sync by checking last sync time
   */
  async syncHighlights(incremental: boolean = false): Promise<RetrieverResult> {
    // Create sync log
    const syncLog = await prisma.syncLog.create({
      data: {
        syncType: incremental ? 'incremental' : 'full',
        highlightsCount: 0,
        status: 'success',
        startedAt: new Date(),
      },
    });

    try {
      // For incremental sync, get the last sync time
      let updatedAfter: Date | undefined = undefined;
      if (incremental) {
        const lastSync = await prisma.syncLog.findFirst({
          where: { status: 'success' },
          orderBy: { completedAt: 'desc' },
        });
        if (lastSync?.completedAt) {
          updatedAfter = lastSync.completedAt;
          console.log(`[RetrieverAgent] Incremental sync: fetching highlights updated after ${updatedAfter.toISOString()}`);
        }
      }

      // Fetch from Readwise (last 30 days only, no category filter)
      console.log('[RetrieverAgent] Fetching highlights from Readwise API (last 30 days only)...');
      const readwiseHighlights = await this.readwiseClient.fetchHighlights(updatedAfter, undefined, 30);
      console.log(`[RetrieverAgent] Received ${readwiseHighlights.length} highlights from Readwise (created within last 30 days)`);
      let newCount = 0;
      let updatedCount = 0;

      // Process each highlight
      for (const readwiseHighlight of readwiseHighlights) {
        const normalized = this.readwiseClient.normalizeHighlight(readwiseHighlight);

        // Check if exists by glaspId (reused for Readwise ID)
        const existing = readwiseHighlight.id
          ? await prisma.highlight.findUnique({
              where: { glaspId: String(readwiseHighlight.id) },
            })
          : null;

        if (existing) {
          // Update existing
          await prisma.highlight.update({
            where: { id: existing.id },
            data: {
              url: normalized.url,
              title: normalized.title,
              author: normalized.author,
              highlightText: normalized.highlightText,
              note: normalized.note,
              tags: JSON.stringify(normalized.tags),
              sourceDomain: normalized.sourceDomain,
              updatedAt: new Date(),
            },
          });
          updatedCount++;
        } else {
          // Create new
          const highlight = await prisma.highlight.create({
            data: {
              glaspId: normalized.glaspId || null,
              url: normalized.url,
              title: normalized.title,
              author: normalized.author,
              createdAt: normalized.createdAt,
              highlightText: normalized.highlightText,
              note: normalized.note,
              tags: JSON.stringify(normalized.tags),
              sourceDomain: normalized.sourceDomain,
            },
          });

          // Create embedding
          await this.createEmbedding(highlight.id, normalized);
          newCount++;
        }
      }

      // Update sync log
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          highlightsCount: readwiseHighlights.length,
          status: 'success',
          completedAt: new Date(),
        },
      });

      return {
        highlightsCount: readwiseHighlights.length,
        newHighlights: newCount,
        updatedHighlights: updatedCount,
        syncLogId: syncLog.id,
      };
    } catch (error) {
      // Update sync log with error
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Create embedding for a highlight
   */
  private async createEmbedding(highlightId: string, highlight: HighlightRecord): Promise<void> {
    // Combine highlight text and note for embedding
    const textToEmbed = `${highlight.highlightText} ${highlight.note || ''}`.trim();

    if (!textToEmbed) return;

    try {
      const embedding = await generateEmbedding(textToEmbed);
      await vectorStore.storeEmbedding(highlightId, embedding);
    } catch (error) {
      console.error(`Failed to create embedding for highlight ${highlightId}:`, error);
      // Don't throw - embedding failure shouldn't block sync
    }
  }

  /**
   * Get recent highlights with high-signal tags
   */
  async getTopHighlights(limit: number = 20): Promise<HighlightRecord[]> {
    const highlights = await prisma.highlight.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return highlights.map((h) => ({
      id: h.id,
      glaspId: h.glaspId || undefined,
      url: h.url,
      title: h.title,
      author: h.author || undefined,
      createdAt: h.createdAt,
      highlightText: h.highlightText,
      note: h.note || undefined,
      tags: JSON.parse(h.tags) as string[],
      sourceDomain: h.sourceDomain,
    }));
  }
}
