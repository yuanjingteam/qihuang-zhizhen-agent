"use client";

import { motion } from "framer-motion";

interface Syndrome {
  name: string;
  probability: number;
  evidence: string[];
}

interface DiagnosisDisplayProps {
  syndromes: Syndrome[];
}

const barColors = [
  "bg-gradient-to-r from-emerald-500 to-emerald-400",
  "bg-gradient-to-r from-sky-500 to-sky-400",
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-violet-500 to-violet-400",
  "bg-gradient-to-r from-rose-500 to-rose-400",
];

export function DiagnosisDisplay({ syndromes }: DiagnosisDisplayProps) {
  return (
    <div className="space-y-4">
      {syndromes.map((s, i) => (
        <motion.div
          key={s.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium">{s.name}</span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                initial={{ width: 0 }}
                animate={{ width: `${s.probability * 100}%` }}
                transition={{ delay: i * 0.15 + 0.3, duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="w-12 text-right text-sm font-medium text-foreground">
              {(s.probability * 100).toFixed(0)}%
            </span>
          </div>
          {s.evidence.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15 + 0.5 }}
              className="ml-28 flex flex-wrap gap-1.5"
            >
              {s.evidence.map((ev, j) => (
                <span
                  key={j}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent text-xs text-muted-foreground"
                >
                  {ev}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
