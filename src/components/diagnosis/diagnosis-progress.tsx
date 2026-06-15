"use client";

import { motion } from "framer-motion";
import {
  Shield,
  MessageSquare,
  Brain,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentState, PIPELINE_STAGES, EVENT_TO_STAGE } from "@/lib/core/enums";

const STEP_ICONS: Record<AgentState, React.ComponentType<{ className?: string }>> = {
  [AgentState.TRIAGE]: AlertTriangle,
  [AgentState.INQUIRY]: MessageSquare,
  [AgentState.DIAGNOSIS]: Brain,
  [AgentState.EVIDENCE_VERIFY]: Search,
  [AgentState.TREATMENT]: Pill,
  [AgentState.SAFETY]: Shield,
  [AgentState.CONFLICT_DETECT]: ShieldCheck,
  [AgentState.OUTPUT]: CheckCircle2,
};

interface DiagnosisProgressProps {
  completedEvents: string[];
  isStreaming: boolean;
}

export function DiagnosisProgress({ completedEvents, isStreaming }: DiagnosisProgressProps) {
  const completedStepIds = new Set(
    completedEvents.map((e) => EVENT_TO_STAGE[e]).filter(Boolean)
  );

  const currentStepIndex = PIPELINE_STAGES.findIndex((s) => !completedStepIds.has(s.id));
  const activeIndex = currentStepIndex === -1 ? PIPELINE_STAGES.length - 1 : currentStepIndex;

  return (
    <div className="flex items-center justify-between w-full px-2">
      {PIPELINE_STAGES.map((step, i) => {
        const isCompleted = completedStepIds.has(step.id);
        const isActive = i === activeIndex && isStreaming;
        const isPending = i > activeIndex;
        const Icon = STEP_ICONS[step.id];

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step node */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1 : 1,
                }}
                className={cn(
                  "relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isActive && "bg-primary/10 border-primary text-primary",
                  isPending && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-primary/40"
                    animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <Icon className="w-4 h-4" />
              </motion.div>
              <span
                className={cn(
                  "text-[11px] mt-1.5 whitespace-nowrap transition-colors duration-200",
                  isCompleted && "text-primary font-medium",
                  isActive && "text-primary font-medium",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < PIPELINE_STAGES.length - 1 && (
              <div className="flex-1 mx-1 h-0.5 rounded-full bg-border relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
