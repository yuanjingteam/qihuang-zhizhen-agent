import { BaseKnowledgeLayer, type LayerDocument, type KnowledgeLayer } from "./base";

/**
 * Layer 3: Famous Doctor Experience (15% weight)
 *
 * Contains clinical experience records from renowned TCM practitioners,
 * case studies, and empirical treatment approaches.
 */
export class FamousDoctorLayer extends BaseKnowledgeLayer implements KnowledgeLayer {
  layerId = 3;
  name = "名医经验";
  weight = 0.15;
  collectionName = "famous_doctor";
  chunkStrategy = "paragraph" as const;

  async addDocuments(documents: LayerDocument[]): Promise<void> {
    const chunked: LayerDocument[] = [];

    for (const doc of documents) {
      const chunks = this.chunkText(doc.text);
      chunks.forEach((chunk, i) => {
        chunked.push({
          id: `${doc.id}_chunk_${i}`,
          text: chunk,
          metadata: { ...doc.metadata, chunkIndex: i, doctor: doc.metadata.doctor },
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
