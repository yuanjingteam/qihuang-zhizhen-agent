import { BaseKnowledgeLayer, type LayerDocument, type KnowledgeLayer } from "./base";

/**
 * Layer 1: Clinical Guidelines (45% weight)
 *
 * Contains modern clinical practice guidelines, expert consensus,
 * and standardized diagnostic/treatment protocols.
 */
export class ClinicalGuidelinesLayer extends BaseKnowledgeLayer implements KnowledgeLayer {
  layerId = 1;
  name = "临床指南";
  weight = 0.45;
  collectionName = "clinical_guidelines";
  chunkStrategy = "section" as const;

  async addDocuments(documents: LayerDocument[]): Promise<void> {
    const chunked: LayerDocument[] = [];

    for (const doc of documents) {
      const chunks = this.chunkText(doc.text);
      chunks.forEach((chunk, i) => {
        chunked.push({
          id: `${doc.id}_chunk_${i}`,
          text: chunk,
          metadata: { ...doc.metadata, chunkIndex: i },
        });
      });
    }

    this.documents.push(...chunked);

    // Also add to ChromaDB if available
    if (this.chroma) {
      await this.chroma.addDocuments(this.collectionName, chunked.map(d => ({
        id: d.id,
        text: d.text,
        metadata: this.sanitizeMetadata(d.metadata),
      })));
    }
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
