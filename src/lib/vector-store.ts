// Abstract vector store interface
// v1: SQLite-based embeddings table
// Future: Can swap to pgvector

import { prisma } from './db';

export interface VectorSearchResult {
  highlightId: string;
  score: number;
}

export class VectorStore {
  /**
   * Store an embedding for a highlight
   */
  async storeEmbedding(
    highlightId: string,
    embedding: number[],
    model: string = 'text-embedding-3-small'
  ): Promise<void> {
    await prisma.embedding.create({
      data: {
        highlightId,
        embedding: JSON.stringify(embedding),
        model,
      },
    });
  }

  /**
   * Find similar highlights using cosine similarity
   * Simple implementation: loads all embeddings and computes similarity
   * For production, use a proper vector DB with indexed similarity search
   */
  async findSimilar(
    queryEmbedding: number[],
    limit: number = 10,
    excludeHighlightIds: string[] = []
  ): Promise<VectorSearchResult[]> {
    const embeddings = await prisma.embedding.findMany({
      where: {
        highlightId: {
          notIn: excludeHighlightIds,
        },
      },
      include: {
        highlight: true,
      },
    });

    const results: VectorSearchResult[] = [];

    for (const emb of embeddings) {
      const storedEmbedding = JSON.parse(emb.embedding) as number[];
      const similarity = this.cosineSimilarity(queryEmbedding, storedEmbedding);
      results.push({
        highlightId: emb.highlightId,
        score: similarity,
      });
    }

    // Sort by similarity and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Get embedding for a highlight if it exists
   */
  async getEmbedding(highlightId: string): Promise<number[] | null> {
    const emb = await prisma.embedding.findFirst({
      where: { highlightId },
      orderBy: { createdAt: 'desc' },
    });

    if (!emb) return null;
    return JSON.parse(emb.embedding) as number[];
  }
}

export const vectorStore = new VectorStore();

