"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  MessageSquare,
  Brain,
  Pill,
  CheckCircle2,
  Zap,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SSEEventType, PIPELINE_STAGES, AgentState } from "@/lib/core/enums";

interface SSEEvent {
  event: string;
  data: unknown;
}

interface SSEStreamViewerProps {
  events: SSEEvent[];
}

const STAGE_ICONS: Record<AgentState, React.ComponentType<{ className?: string }>> = {
  [AgentState.TRIAGE]: Shield,
  [AgentState.INQUIRY]: MessageSquare,
  [AgentState.DIAGNOSIS]: Brain,
  [AgentState.EVIDENCE_VERIFY]: Search,
  [AgentState.TREATMENT]: Pill,
  [AgentState.SAFETY]: Shield,
  [AgentState.CONFLICT_DETECT]: ShieldCheck,
  [AgentState.OUTPUT]: CheckCircle2,
};

function PipelineStepper({ events }: { events: SSEEvent[] }) {
  // Collect all stage transitions from events
  const stageTransitions = React.useMemo(() => {
    const completed: string[] = [];
    let active: string | null = null;
    for (const event of events) {
      const data = event.data as Record<string, string>;
      if (event.event === SSEEventType.STAGE_COMPLETE && data?.stage) {
        completed.push(data.stage);
        if (active === data.stage) active = null;
      }
      if (event.event === SSEEventType.STAGE_START && data?.stage) {
        active = data.stage;
      }
    }
    return { completed, active };
  }, [events]);

  // Progressive reveal: show stages one by one with delay
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    // Count how many stages have at least started
    const totalActive = stageTransitions.completed.length + (stageTransitions.active ? 1 : 0);
    if (totalActive <= visibleCount) return;

    // If we're behind, reveal one stage at a time with delay
    if (visibleCount < totalActive) {
      const timer = setTimeout(() => {
        setVisibleCount(v => Math.min(v + 1, totalActive));
      }, visibleCount === 0 ? 100 : 400);
      return () => clearTimeout(timer);
    }
  }, [stageTransitions, visibleCount]);

  // Reset when new diagnosis starts
  React.useEffect(() => {
    const hasStart = events.some(e => e.event === SSEEventType.START);
    if (!hasStart) setVisibleCount(0);
  }, [events]);

  return (
    <div className="flex items-center gap-1 w-full px-2 py-3 overflow-x-auto">
      {PIPELINE_STAGES.map((stage, i) => {
        const isCompleted = stageTransitions.completed.includes(stage.id);
        const isActive = stageTransitions.active === stage.id;
        const isVisible = i < visibleCount;
        const Icon = STAGE_ICONS[stage.id];

        return (
          <div key={stage.id} className="flex items-center flex-1 min-w-0">
            {/* Stage node */}
            <div className="flex flex-col items-center gap-1 min-w-0">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: isActive ? 1.15 : 1,
                  opacity: isVisible ? 1 : 0.3,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors duration-300 shrink-0",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : isVisible
                    ? "bg-muted border-border text-muted-foreground"
                    : "bg-muted/50 border-border/50 text-muted-foreground/30"
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </motion.div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap transition-colors duration-300",
                  isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>

            {/* Connector line */}
            {i < PIPELINE_STAGES.length - 1 && (
              <div className="flex-1 h-1 mx-1.5 mt-[-14px] bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    isCompleted ? "bg-emerald-500" : "bg-primary/30"
                  )}
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
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

const eventMeta: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  [SSEEventType.START]: { label: "开始接诊", color: "bg-primary/10 text-primary", icon: Zap },
  [SSEEventType.STAGE_START]: { label: "执行中", color: "bg-primary/10 text-primary", icon: Zap },
  [SSEEventType.STAGE_COMPLETE]: { label: "阶段完成", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  [SSEEventType.TRIAGE_RESULT]: { label: "智能分诊", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: Shield },
  [SSEEventType.INQUIRY_QUESTIONS]: { label: "问诊提问", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: MessageSquare },
  [SSEEventType.DIAGNOSIS_SYNDROMES]: { label: "辨证分析", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: Brain },
  [SSEEventType.REASONING_CHAIN]: { label: "推理过程", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: Brain },
  [SSEEventType.TREATMENT]: { label: "处方建议", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: Pill },
  [SSEEventType.SAFETY_CHECK]: { label: "安全检查", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: Shield },
  [SSEEventType.CONFLICT_DETECTED]: { label: "冲突检测", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: ShieldCheck },
  [SSEEventType.FINAL_OUTPUT]: { label: "诊断完成", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  [SSEEventType.END]: { label: "流程结束", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  [SSEEventType.EMERGENCY]: { label: "紧急情况", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertTriangle },
  [SSEEventType.ERROR]: { label: "错误", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertTriangle },
};

// Events that should not be shown in the log (internal pipeline events)
const HIDDEN_EVENTS = new Set<string>([SSEEventType.STAGE_START, SSEEventType.STAGE_COMPLETE]);

function getEventMeta(eventType: string) {
  return (
    eventMeta[eventType] || {
      label: eventType,
      color: "bg-muted text-muted-foreground",
      icon: Zap,
    }
  );
}

function formatEventData(event: SSEEvent): React.ReactNode {
  const data = event.data as Record<string, unknown>;

  if (event.event === SSEEventType.SAFETY_CHECK) {
    const passed = data.passed as boolean;
    const violations = data.violations as Array<{ ruleType: string; description: string; severity: string }> | undefined;
    return (
      <div className="space-y-2">
        <div className={cn("flex items-center gap-2 text-sm font-medium", passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {passed ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          {passed ? "安全检查通过" : "发现用药风险"}
        </div>
        {violations && violations.length > 0 && (
          <ul className="space-y-1">
            {violations.map((v, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                <span className="mt-0.5">-</span>
                <span>{v.description} <span className="opacity-60">({v.severity})</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (event.event === SSEEventType.TREATMENT) {
    const herbs = data.herbs as Array<{ name: string; dose: number }> | undefined;
    return (
      <div className="space-y-1.5 text-sm">
        <p><span className="text-muted-foreground">治法：</span>{data.principle as string}</p>
        <p><span className="text-muted-foreground">方剂：</span>{data.formula as string}</p>
        {herbs && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {herbs.map((h, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-xs">
                {h.name} {h.dose}g
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (event.event === SSEEventType.TRIAGE_RESULT) {
    const isEmergency = data.isEmergency as boolean;
    return (
      <div className={cn("text-sm", isEmergency ? "text-red-600 dark:text-red-400 font-medium" : "")}>
        {isEmergency && <AlertTriangle className="w-4 h-4 inline mr-1" />}
        {data.reason as string}
      </div>
    );
  }

  if (event.event === SSEEventType.DIAGNOSIS_SYNDROMES) {
    const syndromes = data.syndromes as Array<{ name: string; probability: number }> | undefined;
    if (syndromes) {
      return (
        <div className="space-y-1">
          {syndromes.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-24 text-muted-foreground">{s.name}</span>
              <span className="font-medium">{(s.probability * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      );
    }
  }

  if (event.event === SSEEventType.EMERGENCY) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
        {data.message as string}
      </div>
    );
  }

  // Fallback: show formatted JSON
  const raw = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return (
    <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed overflow-x-auto">
      {raw}
    </pre>
  );
}

export function SSEStreamViewer({ events }: SSEStreamViewerProps) {
  // Filter out internal pipeline events from the log
  const visibleEvents = events.filter(e => !HIDDEN_EVENTS.has(e.event));
  const hasStarted = events.some(e => e.event === SSEEventType.START);

  return (
    <div className="space-y-3">
      {/* Pipeline progress bar */}
      {hasStarted && <PipelineStepper events={events} />}

      {/* Event log */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        <AnimatePresence>
          {visibleEvents.map((event, i) => {
            const meta = getEventMeta(event.event);
            const Icon = meta.icon;
            const isEmergency = event.event === SSEEventType.EMERGENCY || event.event === SSEEventType.ERROR;

            return (
              <motion.div
                key={`${event.event}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 py-2"
              >
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                  {i < visibleEvents.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium",
                        meta.color
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      isEmergency
                        ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40"
                        : "bg-muted/50"
                    )}
                  >
                    {formatEventData(event)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
