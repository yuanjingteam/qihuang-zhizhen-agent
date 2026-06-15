import type { RAGChunk } from "../engine";
import type { ChromaDBService } from "../chroma";

/**
 * Base interface for RAG knowledge layers
 */
export interface KnowledgeLayer {
  layerId: number;
  name: string;
  weight: number;
  collectionName: string;
  chunkStrategy: "section" | "paragraph" | "sliding_window";

  /**
   * Retrieve relevant chunks for a query
   */
  retrieve(query: string, topK: number): Promise<RAGChunk[]>;

  /**
   * Add documents to the layer
   */
  addDocuments(documents: LayerDocument[]): Promise<void>;

  /**
   * Set the ChromaDB service for vector retrieval
   */
  setChromaDB(chroma: ChromaDBService): void;
}

export interface LayerDocument {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

/**
 * Base class for knowledge layers with common chunking logic.
 * Supports ChromaDB vector retrieval when available, falls back to
 * in-memory keyword matching otherwise.
 */
export abstract class BaseKnowledgeLayer implements KnowledgeLayer {
  abstract layerId: number;
  abstract name: string;
  abstract weight: number;
  abstract collectionName: string;
  abstract chunkStrategy: "section" | "paragraph" | "sliding_window";

  protected chroma: ChromaDBService | null = null;
  protected documents: LayerDocument[] = [];

  setChromaDB(chroma: ChromaDBService): void {
    this.chroma = chroma;
  }

  /**
   * Retrieve: prefer ChromaDB vector search, fall back to in-memory matching
   */
  async retrieve(query: string, topK: number): Promise<RAGChunk[]> {
    // Try ChromaDB vector retrieval first
    if (this.chroma) {
      try {
        const results = await this.chroma.query(this.collectionName, query, topK);
        if (results.length > 0) {
          return results.map(r => ({
            text: r.text,
            score: r.score,
            source: (r.metadata.source as string) || this.name,
            layerId: this.layerId,
          }));
        }
      } catch {
        // ChromaDB unavailable, fall through to in-memory
      }
    }

    // Fallback: in-memory keyword matching
    return this.inMemoryRetrieve(query, topK);
  }

  /**
   * Override in subclass for custom in-memory retrieval logic
   */
  protected inMemoryRetrieve(query: string, topK: number): Promise<RAGChunk[]> {
    const scored = this.documents
      .map(doc => ({
        text: doc.text,
        score: this.calculateKeywordScore(query, doc.text),
        source: (doc.metadata.source as string) || this.name,
        layerId: this.layerId,
      }))
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return Promise.resolve(scored);
  }

  /**
   * Simple keyword-based relevance scoring
   */
  protected calculateKeywordScore(query: string, text: string): number {
    const queryTerms = query.split(/\s+/).filter(t => t.length >= 2);
    const textLower = text.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const termLower = term.toLowerCase();
      const regex = new RegExp(termLower, "gi");
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    return score;
  }

  /**
   * Split text into chunks based on strategy
   */
  protected chunkText(text: string, chunkSize: number = 512, overlap: number = 64): string[] {
    switch (this.chunkStrategy) {
      case "section":
        return this.chunkBySection(text);
      case "paragraph":
        return this.chunkByParagraph(text);
      case "sliding_window":
        return this.chunkBySlidingWindow(text, chunkSize, overlap);
      default:
        return this.chunkByParagraph(text);
    }
  }

  private chunkBySection(text: string): string[] {
    const sections = text.split(/\n#{1,3}\s|\n\n+/);
    return sections.filter(s => s.trim().length > 50);
  }

  private chunkByParagraph(text: string): string[] {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.filter(p => p.trim().length > 30);
  }

  private chunkBySlidingWindow(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.substring(start, end));
      start += chunkSize - overlap;
    }

    return chunks.filter(c => c.trim().length > 20);
  }

  abstract addDocuments(documents: LayerDocument[]): Promise<void>;
}
