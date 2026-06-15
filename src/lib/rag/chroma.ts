import { ChromaClient, type Collection } from "chromadb";
import type { AppConfig } from "../config";

/**
 * ChromaDB Service — singleton client for vector store operations
 *
 * Each RAG knowledge layer gets its own collection.
 */

export class ChromaDBService {
  private client: ChromaClient;
  private collections: Map<string, Collection> = new Map();

  constructor(config: AppConfig) {
    this.client = new ChromaClient({ path: config.chroma.url });
  }

  async getCollection(name: string): Promise<Collection> {
    if (this.collections.has(name)) {
      return this.collections.get(name)!;
    }

    try {
      const collection = await this.client.getOrCreateCollection({
        name,
        metadata: { "hnsw:space": "cosine" },
      });
      this.collections.set(name, collection);
      return collection;
    } catch (error) {
      throw new Error(`Failed to get/create ChromaDB collection "${name}": ${error}`);
    }
  }

  async addDocuments(
    collectionName: string,
    documents: { id: string; text: string; metadata?: Record<string, string | number | boolean> }[]
  ): Promise<void> {
    if (documents.length === 0) return;

    const collection = await this.getCollection(collectionName);

    const batchSize = 100;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await collection.add({
        ids: batch.map(d => d.id),
        documents: batch.map(d => d.text),
        metadatas: batch.map(d => d.metadata ?? {}),
      });
    }
  }

  async query(
    collectionName: string,
    queryText: string,
    topK: number = 10
  ): Promise<{ text: string; score: number; metadata: Record<string, unknown> }[]> {
    try {
      const collection = await this.getCollection(collectionName);
      const results = await collection.query({
        queryTexts: [queryText],
        nResults: Math.min(topK, 50),
      });

      const texts = results.documents?.[0] ?? [];
      const distances = results.distances?.[0] ?? [];
      const metadatas = results.metadatas?.[0] ?? [];

      return texts.map((text: string | null, i: number) => ({
        text: text ?? "",
        score: 1 - (distances[i] ?? 1),
        metadata: (metadatas[i] as Record<string, unknown>) ?? {},
      }));
    } catch {
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.heartbeat();
      return true;
    } catch {
      return false;
    }
  }
}
