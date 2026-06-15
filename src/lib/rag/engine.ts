import type { AppConfig } from "../config";
import { ChromaDBService } from "./chroma";
import { ClinicalGuidelinesLayer } from "./layers/clinical-guidelines";
import { ModernTextbooksLayer } from "./layers/modern-textbooks";
import { FamousDoctorLayer } from "./layers/famous-doctor";
import { ClassicalTextsLayer } from "./layers/classical-texts";
import type { KnowledgeLayer } from "./layers/base";

export interface QueryContext {
  symptoms: string[];
  chiefComplaint: string;
  constitution?: string;
}

export interface RAGChunk {
  text: string;
  score: number;
  source: string;
  layerId: number;
}

export interface RetrievalResult {
  layerId: number;
  layerName: string;
  weight: number;
  chunks: RAGChunk[];
  queryUsed: string;
}

/**
 * RAGEngine — 4-layer hierarchical RAG with weighted fusion
 *
 * When ChromaDB is available, uses vector similarity search.
 * Falls back to in-memory keyword matching otherwise.
 */
export class RAGEngine {
  private layers: Map<number, KnowledgeLayer>;
  private chroma: ChromaDBService | null = null;

  constructor(private config: AppConfig) {
    this.layers = new Map();
    this.layers.set(1, new ClinicalGuidelinesLayer());
    this.layers.set(2, new ModernTextbooksLayer());
    this.layers.set(3, new FamousDoctorLayer());
    this.layers.set(4, new ClassicalTextsLayer());

    // Initialize ChromaDB connection
    this.initChromaDB();
  }

  /**
   * Try to connect to ChromaDB; if unavailable, layers will use in-memory fallback
   */
  private async initChromaDB(): Promise<void> {
    try {
      const chroma = new ChromaDBService(this.config);
      if (await chroma.isHealthy()) {
        this.chroma = chroma;
        for (const layer of Array.from(this.layers.values())) {
          layer.setChromaDB(chroma);
        }
      }
    } catch {
      // ChromaDB not available — layers will fall back to in-memory retrieval
    }
  }

  /**
   * Get a specific layer for document ingestion
   */
  getLayer(layerId: number): KnowledgeLayer | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Query all 4 layers with weighted reciprocal rank fusion
   */
  async query(queryText: string, context: QueryContext, topK: number = 10): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = [];

    for (const [layerId, layer] of Array.from(this.layers)) {
      try {
        const chunks = await layer.retrieve(queryText, topK);
        results.push({
          layerId,
          layerName: layer.name,
          weight: layer.weight,
          chunks,
          queryUsed: queryText,
        });
      } catch {
        results.push({
          layerId,
          layerName: layer.name,
          weight: layer.weight,
          chunks: [],
          queryUsed: queryText,
        });
      }
    }

    return results;
  }

  /**
   * Query a single knowledge layer
   */
  async queryLayer(layerId: number, queryText: string, topK: number = 5): Promise<RetrievalResult> {
    const layer = this.layers.get(layerId);
    if (!layer) {
      return {
        layerId,
        layerName: "未知",
        weight: 0,
        chunks: [],
        queryUsed: queryText,
      };
    }

    const chunks = await layer.retrieve(queryText, topK);
    return {
      layerId,
      layerName: layer.name,
      weight: layer.weight,
      chunks,
      queryUsed: queryText,
    };
  }
}
