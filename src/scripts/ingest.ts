#!/usr/bin/env tsx

/**
 * Knowledge Base Ingestion CLI
 *
 * Usage:
 *   npx tsx src/scripts/ingest.ts --source data/knowledge_base/clinical_guidelines/ --layer 1
 *   npx tsx src/scripts/ingest.ts --all
 */

import { config } from "../lib/config";
import { RAGEngine } from "../lib/rag/engine";
import { ClinicalGuidelinesLayer } from "../lib/rag/layers/clinical-guidelines";
import { ModernTextbooksLayer } from "../lib/rag/layers/modern-textbooks";
import { FamousDoctorLayer } from "../lib/rag/layers/famous-doctor";
import { ClassicalTextsLayer } from "../lib/rag/layers/classical-texts";
import type { LayerDocument } from "../lib/rag/layers/base";
import * as fs from "fs";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

const args = process.argv.slice(2);
const sourceIndex = args.indexOf("--source");
const layerIndex = args.indexOf("--layer");
const allFlag = args.includes("--all");

const sourcePath = sourceIndex >= 0 ? args[sourceIndex + 1] : null;
const layerId = layerIndex >= 0 ? parseInt(args[layerIndex + 1]) : null;

async function main() {
  const ragEngine = new RAGEngine(config);

  if (allFlag) {
    console.log("Ingesting all knowledge bases...");
    await ingestAll(ragEngine);
  } else if (sourcePath && layerId) {
    console.log(`Ingesting ${sourcePath} into layer ${layerId}...`);
    await ingestDirectory(ragEngine, sourcePath, layerId);
  } else {
    console.log("Usage:");
    console.log("  npx tsx src/scripts/ingest.ts --source <path> --layer <1-4>");
    console.log("  npx tsx src/scripts/ingest.ts --all");
    console.log("\nLayers:");
    console.log("  1: Clinical Guidelines (45%)");
    console.log("  2: Modern Textbooks (25%)");
    console.log("  3: Famous Doctor Experience (15%)");
    console.log("  4: Classical Texts (15%)");
    process.exit(1);
  }

  console.log("Ingestion complete!");
}

async function ingestAll(ragEngine: RAGEngine) {
  const basePath = path.resolve(process.cwd(), "data/knowledge_base");

  const layers = [
    { dir: "clinical_guidelines", id: 1 },
    { dir: "modern_textbooks", id: 2 },
    { dir: "famous_doctor", id: 3 },
    { dir: "classical_texts", id: 4 },
  ];

  for (const layer of layers) {
    const dirPath = path.join(basePath, layer.dir);
    if (fs.existsSync(dirPath)) {
      await ingestDirectory(ragEngine, dirPath, layer.id);
    } else {
      console.log(`Skipping ${layer.dir} (directory not found)`);
    }
  }
}

async function ingestDirectory(ragEngine: RAGEngine, dirPath: string, layerId: number) {
  const layer = ragEngine.getLayer(layerId);
  if (!layer) {
    console.error(`Invalid layer ID: ${layerId}`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f =>
    f.endsWith(".md") || f.endsWith(".txt") || f.endsWith(".json") || f.endsWith(".pdf")
  );

  console.log(`Found ${files.length} files in ${dirPath}`);

  const documents: LayerDocument[] = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);

    if (file.endsWith(".pdf")) {
      // Parse PDF
      try {
        const buffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(buffer);
        documents.push({
          id: file,
          text: pdfData.text,
          metadata: { source: file, pages: pdfData.numpages },
        });
        console.log(`  Parsed PDF: ${file} (${pdfData.numpages} pages)`);
      } catch (e) {
        console.error(`Failed to parse PDF ${file}:`, e);
      }
    } else if (file.endsWith(".json")) {
      const content = fs.readFileSync(filePath, "utf-8");
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          data.forEach((item, i) => {
            documents.push({
              id: `${file}_${i}`,
              text: item.text || item.content || JSON.stringify(item),
              metadata: {
                source: file,
                ...item.metadata,
              },
            });
          });
        } else {
          documents.push({
            id: file,
            text: data.text || data.content || JSON.stringify(data),
            metadata: {
              source: file,
              ...data.metadata,
            },
          });
        }
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    } else {
      const content = fs.readFileSync(filePath, "utf-8");
      documents.push({
        id: file,
        text: content,
        metadata: { source: file },
      });
    }
  }

  await layer.addDocuments(documents);
  console.log(`Ingested ${documents.length} documents into ${layer.name}`);
}

main().catch(console.error);
