"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Loader2,
  AlertTriangle,
  Brain,
  Pill,
  Shield,
  Stethoscope,
  RotateCcw,
  ShieldCheck,
  FileText,
  Bot,
  User,
} from "lucide-react";
import { SSEEventType } from "@/lib/core/enums";

// ─── Types ───

interface ChatMessage {
  id: string;
  role: "ai" | "user" | "system";
  content: string;
  timestamp: number;
  type?: "text" | "syndromes" | "treatment" | "safety" | "soap" | "conflict" | "emergency";
  data?: Record<string, unknown>;
  quickReplies?: { label: string; value: string }[];
}

interface Syndrome {
  name: string;
  probability: number;
  evidence: string[];
}

// ─── Conversation flow for doctor ───

const INQUIRY_QUESTIONS = [
  {
    key: "寒热",
    question: "患者寒热表现？有无恶寒发热、手足温度异常？",
    options: [
      { label: "恶寒", value: "恶寒" },
      { label: "发热", value: "发热" },
      { label: "手足冰凉", value: "手足冰凉" },
      { label: "五心烦热", value: "五心烦热" },
      { label: "往来寒热", value: "往来寒热" },
      { label: "无明显寒热", value: "无明显寒热" },
    ],
  },
  {
    key: "出汗",
    question: "出汗情况？自汗、盗汗、无汗？",
    options: [
      { label: "自汗", value: "自汗" },
      { label: "盗汗", value: "盗汗" },
      { label: "无汗", value: "无汗" },
      { label: "大汗", value: "大汗" },
      { label: "出汗正常", value: "出汗正常" },
    ],
  },
  {
    key: "舌象脉象",
    question: "舌象和脉象表现？（可描述舌色、舌苔、脉象）",
    options: [
      { label: "舌淡苔白", value: "舌淡苔白" },
      { label: "舌红苔黄", value: "舌红苔黄" },
      { label: "舌淡胖有齿痕", value: "舌淡胖有齿痕" },
      { label: "舌红少苔", value: "舌红少苔" },
      { label: "脉弦", value: "脉弦" },
      { label: "脉细", value: "脉细" },
      { label: "脉沉", value: "脉沉" },
      { label: "脉滑", value: "脉滑" },
    ],
  },
  {
    key: "二便",
    question: "二便情况？",
    options: [
      { label: "大便干结", value: "大便干结" },
      { label: "大便溏稀", value: "大便溏稀" },
      { label: "小便黄赤", value: "小便黄赤" },
      { label: "小便清长", value: "小便清长" },
      { label: "二便正常", value: "二便正常" },
    ],
  },
  {
    key: "饮食睡眠",
    question: "饮食、睡眠情况？",
    options: [
      { label: "食欲不振", value: "食欲不振" },
      { label: "口苦口干", value: "口苦口干" },
      { label: "失眠", value: "失眠" },
      { label: "多梦", value: "多梦" },
      { label: "嗜睡", value: "嗜睡" },
      { label: "饮食睡眠正常", value: "饮食睡眠正常" },
    ],
  },
  {
    key: "旧病",
    question: "既往病史及本次病因？",
    options: [
      { label: "高血压", value: "高血压" },
      { label: "糖尿病", value: "糖尿病" },
      { label: "情志不畅", value: "情志不畅" },
      { label: "劳累", value: "劳累" },
      { label: "外感", value: "外感" },
      { label: "无特殊", value: "无特殊" },
    ],
  },
];

// ─── Component ───

export default function DoctorPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [conversationPhase, setConversationPhase] = React.useState<
    "greeting" | "complaint" | "inquiry" | "diagnosing" | "done"
  >("greeting");
  const [inquiryIndex, setInquiryIndex] = React.useState(0);
  const [collectedInfo, setCollectedInfo] = React.useState<{
    chiefComplaint: string;
    symptoms: string[];
    answers: string[];
  }>({ chiefComplaint: "", symptoms: [], answers: [] });

  // Diagnosis state
  const [currentStage, setCurrentStage] = React.useState<string | null>(null);
  const [syndromes, setSyndromes] = React.useState<Syndrome[]>([]);
  const [treatment, setTreatment] = React.useState<{
    principle: string; formula: string; herbs: { name: string; dose: number; processing?: string }[];
  } | null>(null);
  const [safetyPassed, setSafetyPassed] = React.useState<boolean | null>(null);
  const [safetyViolations, setSafetyViolations] = React.useState<{ description: string; severity: string }[]>([]);
  const [conflictDetails, setConflictDetails] = React.useState<string[]>([]);
  const [soapNote, setSoapNote] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = React.useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const addMessage = React.useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    scrollToBottom();
    return newMsg.id;
  }, [scrollToBottom]);

  const aiReply = React.useCallback(async (
    content: string,
    options?: { type?: ChatMessage["type"]; data?: Record<string, unknown>; quickReplies?: { label: string; value: string }[]; delay?: number }
  ) => {
    setIsTyping(true);
    const delay = options?.delay ?? Math.min(500 + content.length * 12, 1200);
    await new Promise(r => setTimeout(r, delay));
    setIsTyping(false);
    addMessage({
      role: "ai",
      content,
      type: options?.type,
      data: options?.data,
      quickReplies: options?.quickReplies,
    });
  }, [addMessage]);

  // ─── Initialize greeting ───
  React.useEffect(() => {
    const timer = setTimeout(() => {
      aiReply("您好，我是 AI 辅助辨证系统。请告诉我患者的主诉和主要症状。", {
        delay: 700,
      });
      setConversationPhase("complaint");
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handle user message ───
  const handleSend = async (text?: string) => {
    const content = (text ?? inputText).trim();
    if (!content || isTyping) return;
    setInputText("");

    addMessage({ role: "user", content });

    switch (conversationPhase) {
      case "complaint":
        await handleComplaint(content);
        break;
      case "inquiry":
        await handleInquiryAnswer(content);
        break;
    }
  };

  // ─── Phase: Chief complaint ───
  const handleComplaint = async (complaint: string) => {
    setCollectedInfo(prev => ({ ...prev, chiefComplaint: complaint, symptoms: [complaint] }));
    setConversationPhase("inquiry");
    setInquiryIndex(0);

    await aiReply(
      `收到，主诉：「${complaint}」。我需要补充采集四诊信息。`,
      { delay: 900 }
    );

    await askInquiryQuestion(0);
  };

  const askInquiryQuestion = async (index: number) => {
    if (index >= INQUIRY_QUESTIONS.length) {
      await startDiagnosis();
      return;
    }
    const q = INQUIRY_QUESTIONS[index];
    await aiReply(q.question, {
      quickReplies: q.options,
      delay: 600,
    });
  };

  const handleInquiryAnswer = async (answer: string) => {
    const nextIndex = inquiryIndex + 1;
    setInquiryIndex(nextIndex);
    setCollectedInfo(prev => ({
      ...prev,
      answers: [...prev.answers, answer],
      symptoms: [...prev.symptoms, answer],
    }));

    if (nextIndex >= INQUIRY_QUESTIONS.length) {
      await aiReply("信息采集完毕，开始辅助辨证。", { delay: 400 });
      await startDiagnosis();
    } else {
      await askInquiryQuestion(nextIndex);
    }
  };

  // ─── Start streaming diagnosis ───
  const startDiagnosis = async () => {
    setConversationPhase("diagnosing");

    await aiReply("正在执行辨证分析链路，请稍候...", { delay: 600 });

    try {
      const res = await fetch("/api/doctor/pre-consultation/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint: collectedInfo.chiefComplaint,
          symptoms: collectedInfo.symptoms,
          age: 45,
          sex: "男",
        }),
      });

      if (!res.ok) throw new Error("请求失败");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法建立连接");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              handleDiagnosisEvent(event);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "诊断过程出错";
      setError(msg);
      addMessage({
        role: "system",
        content: `诊断链路异常：${msg}`,
        type: "emergency",
      });
    }

    setConversationPhase("done");
  };

  // ─── Handle diagnosis SSE events ───
  const handleDiagnosisEvent = (event: { event: string; data: Record<string, unknown> }) => {
    const data = event.data;

    switch (event.event) {
      case SSEEventType.STAGE_START:
        setCurrentStage(data.stage as string);
        break;

      case SSEEventType.EMERGENCY:
        setError(data.message as string);
        addMessage({
          role: "system",
          content: data.message as string,
          type: "emergency",
        });
        break;

      case SSEEventType.DIAGNOSIS_SYNDROMES: {
        const syns = (data.syndromes as Syndrome[]) ?? [];
        setSyndromes(syns);
        if (syns.length > 0) {
          addMessage({
            role: "ai",
            content: `辨证结果：首诊证候 **${syns[0].name}**（置信度 ${(syns[0].probability * 100).toFixed(0)}%），详细概率分布如下。`,
            type: "syndromes",
            data: { syndromes: syns },
          });
        }
        break;
      }

      case SSEEventType.TREATMENT: {
        const t = {
          principle: (data.principle as string) ?? "",
          formula: (data.formula as string) ?? "",
          herbs: (data.herbs as { name: string; dose: number; processing?: string }[]) ?? [],
        };
        setTreatment(t);
        addMessage({
          role: "ai",
          content: `治法：**${t.principle}**${t.formula ? `，推荐方剂：**${t.formula}**` : ""}`,
          type: "treatment",
          data: { treatment: t },
        });
        break;
      }

      case SSEEventType.SAFETY_CHECK: {
        const passed = data.passed as boolean;
        const violations = (data.violations as { description: string; severity: string }[]) ?? [];
        setSafetyPassed(passed);
        setSafetyViolations(violations);
        addMessage({
          role: "ai",
          content: passed
            ? "安全引擎校验通过：十八反/十九畏/剂量/妊娠禁忌均无违反。"
            : `安全引擎发现 ${violations.length} 项违规，处方已自动调整。`,
          type: "safety",
          data: { passed, violations },
        });
        break;
      }

      case SSEEventType.CONFLICT_DETECTED: {
        const details = (data.details as string[]) ?? [];
        setConflictDetails(details);
        if (details.length > 0) {
          addMessage({
            role: "ai",
            content: `配伍冲突检测：${details.join("；")}`,
            type: "conflict",
            data: { details },
          });
        }
        break;
      }

      case SSEEventType.FINAL_OUTPUT: {
        const soap = (data.soapNote as string) ?? null;
        setSoapNote(soap);
        addMessage({
          role: "ai",
          content: "SOAP 病历已生成：",
          type: "soap",
          data: { content: soap },
        });
        break;
      }

      case SSEEventType.ERROR:
        setError(data.message as string);
        addMessage({
          role: "system",
          content: `分析异常：${data.message}`,
        });
        break;
    }
  };

  // ─── Reset ───
  const handleReset = async () => {
    setMessages([]);
    setConversationPhase("greeting");
    setInquiryIndex(0);
    setCollectedInfo({ chiefComplaint: "", symptoms: [], answers: [] });
    setCurrentStage(null);
    setSyndromes([]);
    setTreatment(null);
    setSafetyPassed(null);
    setSafetyViolations([]);
    setConflictDetails([]);
    setSoapNote(null);
    setError(null);

    await aiReply("您好，我是 AI 辅助辨证系统。请告诉我患者的主诉和主要症状。", {
      delay: 500,
    });
    setConversationPhase("complaint");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDiagnosing = conversationPhase === "diagnosing";
  const isDone = conversationPhase === "done";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI 辅助辨证系统</p>
            <p className="text-xs text-muted-foreground">
              {isDiagnosing ? "推理链路运行中..." : isDone ? "诊断完成" : "辅助诊疗"}
            </p>
          </div>
        </div>
        {isDone && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            新病例
          </button>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === "user" ? (
                <UserBubble content={msg.content} />
              ) : msg.role === "system" ? (
                <SystemBubble content={msg.content} type={msg.type} />
              ) : (
                <AIBubble message={msg} onQuickReply={(value) => handleSend(value)} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-2 pl-2"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-muted">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}

        {/* Diagnosis progress */}
        {isDiagnosing && currentStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-2 px-3 mx-2"
          >
            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span className="text-xs text-muted-foreground">
              {getStageLabel(currentStage)}
            </span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm px-4 py-3">
        {/* Quick replies */}
        {messages.length > 0 && messages[messages.length - 1].quickReplies && (
          <div className="flex flex-wrap gap-2 mb-3">
            {messages[messages.length - 1].quickReplies!.map((qr) => (
              <button
                key={qr.value}
                onClick={() => handleSend(qr.value)}
                disabled={isTyping || isDiagnosing}
                className="px-3 py-1.5 text-sm rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            className="flex-1 p-3 border rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 max-h-32"
            rows={1}
            placeholder={
              isDiagnosing ? "分析中..." :
              isDone ? "诊断已完成" :
              "输入患者症状信息..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping || isDiagnosing || isDone}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isTyping || isDiagnosing || isDone}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end py-1.5">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-emerald-600 text-white text-sm leading-relaxed">
          {content}
        </div>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

function AIBubble({ message, onQuickReply }: { message: ChatMessage; onQuickReply: (value: string) => void }) {
  const { content, type, data } = message;

  // Extract typed data for rich cards
  const syndromesData: Syndrome[] | null =
    type === "syndromes" && data?.syndromes ? (data.syndromes as Syndrome[]) : null;
  const treatmentData: { principle: string; formula: string; herbs: { name: string; dose: number; processing?: string }[] } | null =
    type === "treatment" && data?.treatment ? (data.treatment as typeof treatmentData) : null;
  const safetyPassed = type === "safety" ? Boolean(data?.passed) : null;
  const safetyViolations: { description: string; severity: string }[] =
    type === "safety" ? ((data?.violations ?? []) as { description: string; severity: string }[]) : [];
  const conflictDetails: string[] =
    type === "conflict" && data?.details ? (data.details as string[]) : [];
  const soapContent: string | null =
    type === "soap" && data?.content ? (data.content as string) : null;

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
        <Stethoscope className="w-3.5 h-3.5" />
      </div>
      <div className="max-w-[85%] space-y-2">
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-muted text-sm leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {syndromesData && <SyndromesCard syndromes={syndromesData} />}
        {treatmentData && <TreatmentCard treatment={treatmentData} />}
        {safetyPassed !== null && <SafetyCard passed={safetyPassed} violations={safetyViolations} />}
        {conflictDetails.length > 0 && <ConflictCard details={conflictDetails} />}
        {soapContent && <SOAPCard content={soapContent} />}
      </div>
    </div>
  );
}

function SystemBubble({ content, type }: { content: string; type?: ChatMessage["type"] }) {
  if (type === "emergency") {
    return (
      <div className="flex justify-center py-2">
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 max-w-[90%]">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">{content}</p>
    </div>
  );
}

function SyndromesCard({ syndromes }: { syndromes: Syndrome[] }) {
  return (
    <div className="px-4 py-3 rounded-xl border bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold">证候概率分布</span>
      </div>
      <div className="space-y-3">
        {syndromes.map((s, i) => (
          <div key={s.name}>
            <div className="flex items-center gap-3">
              <span className="w-28 text-xs font-medium truncate">{s.name}</span>
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    i === 0 ? "bg-violet-500" : i === 1 ? "bg-sky-500" : i === 2 ? "bg-amber-500" : "bg-slate-400"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.probability * 100}%` }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                />
              </div>
              <span className="text-xs font-bold w-12 text-right">{(s.probability * 100).toFixed(0)}%</span>
            </div>
            {s.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 ml-31">
                {s.evidence.map((ev, j) => (
                  <span key={j} className="px-1.5 py-0.5 text-[10px] rounded bg-accent text-muted-foreground">{ev}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TreatmentCard({ treatment }: { treatment: { principle: string; formula: string; herbs: { name: string; dose: number; processing?: string }[] } }) {
  return (
    <div className="px-4 py-3 rounded-xl border bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Pill className="w-4 h-4 text-emerald-500" />
        <span className="text-sm font-semibold">处方建议</span>
      </div>
      <div className="space-y-2 text-sm">
        {treatment.principle && (
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0 w-10">治法</span>
            <span className="font-medium">{treatment.principle}</span>
          </div>
        )}
        {treatment.formula && (
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0 w-10">方剂</span>
            <span className="font-medium">{treatment.formula}</span>
          </div>
        )}
        {treatment.herbs.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1.5">药物组成</p>
            <div className="grid grid-cols-2 gap-1.5">
              {treatment.herbs.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm px-2.5 py-1.5 rounded-lg bg-accent/50">
                  <span className="font-medium">{h.name}</span>
                  <span className="text-muted-foreground text-xs">{h.dose}g{h.processing ? `(${h.processing})` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SafetyCard({ passed, violations }: { passed: boolean; violations: { description: string; severity: string }[] }) {
  return (
    <div className={`px-4 py-3 rounded-xl border ${
      passed
        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40"
        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {passed ? (
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
        <span className={`text-sm font-semibold ${
          passed ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
        }`}>
          {passed ? "安全校验通过" : "安全校验异常"}
        </span>
      </div>
      {!passed && violations.length > 0 && (
        <div className="space-y-1">
          {violations.map((v, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                v.severity === "critical" ? "bg-red-500" : v.severity === "warning" ? "bg-amber-500" : "bg-sky-500"
              }`} />
              <span className="text-amber-800 dark:text-amber-300">{v.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConflictCard({ details }: { details: string[] }) {
  return (
    <div className="px-4 py-3 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">配伍冲突</span>
      </div>
      <div className="space-y-1">
        {details.map((d, i) => (
          <p key={i} className="text-xs text-amber-800 dark:text-amber-300">{d}</p>
        ))}
      </div>
    </div>
  );
}

function SOAPCard({ content }: { content: string }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-emerald-500/20 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-semibold">SOAP 病历</span>
      </div>
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

// ─── Helpers ───

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    triage: "红旗筛查...",
    inquiry: "信息充分度评估...",
    diagnosis: "RAG 检索 + LLM 辨证推理...",
    evidenceVerify: "验证证据链...",
    treatment: "生成治法方剂...",
    safetyCheck: "安全引擎校验（十八反/十九畏/剂量/妊娠）...",
    conflictDetect: "配伍一致性检查...",
    output: "生成 SOAP 病历...",
  };
  return labels[stage] ?? "处理中...";
}
