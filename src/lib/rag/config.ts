/**
 * RAG Configuration
 *
 * Layer weights and retrieval parameters
 */

export const RAG_CONFIG = {
  layers: {
    1: {
      name: "临床指南",
      weight: 0.45,
      collectionName: "clinical_guidelines",
      chunkStrategy: "section" as const,
    },
    2: {
      name: "现代教材",
      weight: 0.25,
      collectionName: "modern_textbooks",
      chunkStrategy: "paragraph" as const,
    },
    3: {
      name: "名医经验",
      weight: 0.15,
      collectionName: "famous_doctor",
      chunkStrategy: "paragraph" as const,
    },
    4: {
      name: "经典原文",
      weight: 0.15,
      collectionName: "classical_texts",
      chunkStrategy: "sliding_window" as const,
    },
  },
  retrieval: {
    vectorWeight: 0.6,
    bm25Weight: 0.4,
    defaultTopK: 10,
    maxTopK: 20,
  },
  chunking: {
    defaultChunkSize: 512,
    defaultOverlap: 64,
  },
};

export type RAGLayerConfig = typeof RAG_CONFIG.layers[1];
