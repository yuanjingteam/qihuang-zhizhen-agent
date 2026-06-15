import { BaseKnowledgeLayer, type LayerDocument, type KnowledgeLayer } from "./base";

/**
 * Layer 4: Classical Texts (15% weight)
 *
 * Contains classical TCM texts: 黄帝内经, 伤寒论, 金匮要略,
 * 温病条辨, 本草纲目, etc.
 */
export class ClassicalTextsLayer extends BaseKnowledgeLayer implements KnowledgeLayer {
  layerId = 4;
  name = "经典原文";
  weight = 0.15;
  collectionName = "classical_texts";
  chunkStrategy = "sliding_window" as const;

  async addDocuments(documents: LayerDocument[]): Promise<void> {
    const chunked: LayerDocument[] = [];

    for (const doc of documents) {
      const chunks = this.chunkText(doc.text, 256, 32);
      chunks.forEach((chunk, i) => {
        chunked.push({
          id: `${doc.id}_chunk_${i}`,
          text: chunk,
          metadata: {
            ...doc.metadata,
            chunkIndex: i,
            book: doc.metadata.book,
            chapter: doc.metadata.chapter,
          },
        });
      });
    }

    this.documents.push(...chunked);

    if (this.chroma) {
      await this.chroma.addDocuments(this.collectionName, chunked.map(d => ({
        id: d.id,
        text: d.text,
        metadata: this.sanitizeMetadata(d.metadata),
      })));
    }
  }

  /**
   * Override in-memory scoring to boost TCM-specific terms
   */
  protected calculateKeywordScore(query: string, text: string): number {
    let score = super.calculateKeywordScore(query, text);

    const queryTerms = query.split(/\s+/).filter(t => t.length >= 2);
    const textLower = text.toLowerCase();

    for (const term of queryTerms) {
      const termLower = term.toLowerCase();
      if (textLower.includes(termLower)) {
        if (["证", "脉", "舌", "方", "药", "治"].some(t => termLower.includes(t))) {
          score += 0.3;
        }
      }
    }

    return score;
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        result[key] = value;
      } else {
        result[key] = String(value);
      }
    }
    return result;
  }
}
