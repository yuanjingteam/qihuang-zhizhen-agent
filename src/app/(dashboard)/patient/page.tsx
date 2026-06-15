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
  Heart,
  RotateCcw,
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
  /** Rich content type */
  type?: "text" | "syndromes" | "treatment" | "safety" | "report" | "emergency";
  /** Attached data for rich cards */
  data?: Record<string, unknown>;
  /** Quick reply options shown with this message */
  quickReplies?: { label: string; value: string }[];
}

interface Syndrome {
  name: string;
  probability: number;
  evidence: string[];
}

// ─── Conversation Flow ───

/** 十问歌 follow-up questions, asked one at a time */
const INQUIRY_QUESTIONS = [
  {
    key: "寒热",
    question: "您平时是怕冷还是怕热？有没有手脚发凉或者手足心发热的情况？",
    options: [
      { label: "怕冷", value: "怕冷" },
      { label: "怕热", value: "怕热" },
      { label: "手脚冰凉", value: "手脚冰凉" },
      { label: "手足心热", value: "手足心发热" },
      { label: "时冷时热", value: "寒热往来" },
      { label: "不明显", value: "寒热不明显" },
    ],
  },
  {
    key: "出汗",
    question: "出汗情况怎么样？白天容易出汗吗？晚上睡着后出汗吗？",
    options: [
      { label: "出汗正常", value: "出汗正常" },
      { label: "容易出汗", value: "容易出汗(自汗)" },
      { label: "夜间盗汗", value: "夜间盗汗" },
      { label: "很少出汗", value: "很少出汗" },
      { label: "完全无汗", value: "无汗" },
    ],
  },
  {
    key: "头身",
    question: "有没有头痛、头晕、身体沉重或者腰酸背痛的感觉？",
    options: [
      { label: "无不适", value: "头身无不适" },
      { label: "头痛", value: "头痛" },
      { label: "头晕", value: "头晕" },
      { label: "身体沉重", value: "身体沉重" },
      { label: "腰酸", value: "腰酸" },
    ],
  },
  {
    key: "二便",
    question: "大便和小便的情况如何？大便成形吗？小便颜色？",
    options: [
      { label: "都正常", value: "二便正常" },
      { label: "大便干结", value: "大便干结" },
      { label: "大便溏稀", value: "大便溏稀" },
      { label: "小便黄", value: "小便黄" },
      { label: "夜尿多", value: "夜尿频多" },
    ],
  },
  {
    key: "饮食",
    question: "胃口怎么样？有没有口渴、口苦、口干的情况？",
    options: [
      { label: "都正常", value: "饮食正常" },
      { label: "食欲差", value: "食欲不振" },
      { label: "口渴想喝水", value: "口干多饮" },
      { label: "口渴不想喝", value: "口渴不欲饮" },
      { label: "口苦", value: "口苦" },
      { label: "食后腹胀", value: "食后腹胀" },
    ],
  },
  {
    key: "胸腹",
    question: "有没有胸闷、心慌、腹胀或者胁肋不舒服的情况？",
    options: [
      { label: "无不适", value: "胸腹无不适" },
      { label: "胸闷", value: "胸闷" },
      { label: "心慌心悸", value: "心悸" },
      { label: "腹胀", value: "腹胀" },
      { label: "胁肋不适", value: "胁肋胀痛" },
    ],
  },
  {
    key: "睡眠",
    question: "睡眠质量怎么样？入睡困难吗？容易醒吗？多梦吗？",
    options: [
      { label: "睡眠正常", value: "睡眠正常" },
      { label: "失眠难入睡", value: "失眠" },
      { label: "多梦", value: "多梦" },
      { label: "容易醒", value: "易醒" },
      { label: "早醒", value: "早醒" },
    ],
  },
  {
    key: "旧病病因",
    question: "以前有什么慢性病吗？这次不舒服可能是什么原因引起的？",
    options: [
      { label: "没有旧病", value: "无旧病" },
      { label: "高血压", value: "高血压病史" },
      { label: "糖尿病", value: "糖尿病病史" },
      { label: "情志不畅", value: "情志不畅引起" },
      { label: "劳累过度", value: "劳累过度引起" },
      { label: "饮食不节", value: "饮食不节引起" },
      { label: "受凉感冒", value: "外感风寒引起" },
    ],
  },
];

const COMMON_COMPLAINTS = [
  "头痛", "失眠", "胃痛", "腰痛", "咳嗽",
  "乏力", "胸闷", "便秘", "月经不调", "头晕",
];

// ─── Component ───

export default function PatientPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [conversationPhase, setConversationPhase] = React.useState<
    "greeting" | "complaint" | "inquiry" | "diagnosing" | "done"
  >("greeting");
  const [inquiryIndex, setInquiryIndex] = React.useState(0);
  const [collectedInfo, setCollectedInfo] = React.useState<{
    chiefComplaint: string;
    age: number;
    sex: string;
    answers: string[];
  }>({ chiefComplaint: "", age: 30, sex: "男", answers: [] });

  // Diagnosis state
  const [currentStage, setCurrentStage] = React.useState<string | null>(null);
  const [syndromes, setSyndromes] = React.useState<Syndrome[]>([]);
  const [treatment, setTreatment] = React.useState<{
    principle: string; formula: string; herbs: { name: string; dose: number }[];
  } | null>(null);
  const [safetyPassed, setSafetyPassed] = React.useState<boolean | null>(null);
  const [finalOutput, setFinalOutput] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // Add message helper
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

  // Simulate AI typing delay
  const aiReply = React.useCallback(async (
    content: string,
    options?: { type?: ChatMessage["type"]; data?: Record<string, unknown>; quickReplies?: { label: string; value: string }[]; delay?: number }
  ) => {
    setIsTyping(true);
    const delay = options?.delay ?? Math.min(600 + content.length * 15, 1500);
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
      aiReply("您好，我是您的中医问诊助手。请问今天哪里不舒服？", {
        quickReplies: COMMON_COMPLAINTS.map(c => ({ label: c, value: c })),
        delay: 800,
      });
      setConversationPhase("complaint");
    }, 500);
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

  // ─── Phase: Chief complaint received ───
  const handleComplaint = async (complaint: string) => {
    setCollectedInfo(prev => ({ ...prev, chiefComplaint: complaint }));
    setConversationPhase("inquiry");
    setInquiryIndex(0);

    await aiReply(
      `了解了，您的主要不适是「${complaint}」。让我再详细了解一下您的身体情况。`,
      { delay: 1000 }
    );

    // Ask first inquiry question
    await askInquiryQuestion(0);
  };

  // ─── Ask one inquiry question ───
  const askInquiryQuestion = async (index: number) => {
    if (index >= INQUIRY_QUESTIONS.length) {
      await startDiagnosis();
      return;
    }

    const q = INQUIRY_QUESTIONS[index];
    await aiReply(q.question, {
      quickReplies: q.options,
      delay: 800,
    });
  };

  // ─── Handle inquiry answer ───
  const handleInquiryAnswer = async (answer: string) => {
    const nextIndex = inquiryIndex + 1;
    setInquiryIndex(nextIndex);
    setCollectedInfo(prev => ({ ...prev, answers: [...prev.answers, answer] }));

    // Brief acknowledgment
    const acks = ["嗯，了解了。", "好的，记下了。", "明白了。", "好的，我看看。"];
    const ack = acks[nextIndex % acks.length];

    if (nextIndex >= INQUIRY_QUESTIONS.length) {
      // All questions asked, start diagnosis
      await aiReply(ack, { delay: 400 });
      await startDiagnosis();
    } else {
      // Ask next question with brief transition
      const transitions = [
        "我再问问您其他方面的情况。",
        "接下来看看其他方面。",
        "再了解几个方面。",
        "继续了解一些情况。",
        "还有几个问题。",
        "再问几个。",
      ];
      const transition = transitions[nextIndex % transitions.length];
      await aiReply(`${ack} ${transition}`, { delay: 500 });
      await askInquiryQuestion(nextIndex);
    }
  };

  // ─── Start streaming diagnosis ───
  const startDiagnosis = async () => {
    setConversationPhase("diagnosing");

    await aiReply("好的，信息已经收集够了。让我为您进行辨证分析，请稍候片刻...", { delay: 800 });

    try {
      const res = await fetch("/api/patient/diagnosis/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint: collectedInfo.chiefComplaint,
          symptoms: collectedInfo.answers,
          age: collectedInfo.age,
          sex: collectedInfo.sex,
          inquiryResponses: collectedInfo.answers,
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
        content: `诊断过程出现问题：${msg}，请稍后重试。`,
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
          const topName = syns[0].name;
          addMessage({
            role: "ai",
            content: `根据您的症状，我初步判断您的情况偏向**${topName}**。让我继续分析并给出建议。`,
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
          herbs: (data.herbs as { name: string; dose: number }[]) ?? [],
        };
        setTreatment(t);
        addMessage({
          role: "ai",
          content: `根据辨证结果，建议采用**${t.principle}**的治法。`,
          type: "treatment",
          data: { treatment: t },
        });
        break;
      }

      case SSEEventType.SAFETY_CHECK: {
        const passed = data.passed as boolean;
        setSafetyPassed(passed);
        addMessage({
          role: "ai",
          content: passed
            ? "处方安全检查已通过，未发现配伍禁忌和超量用药。"
            : "处方中发现用药风险，已自动调整。",
          type: "safety",
          data: { passed, violations: data.violations },
        });
        break;
      }

      case SSEEventType.FINAL_OUTPUT: {
        const output = data.content as string;
        setFinalOutput(output);
        addMessage({
          role: "ai",
          content: "您的健康评估报告已生成，请查看：",
          type: "report",
          data: { content: output },
        });
        break;
      }

      case SSEEventType.ERROR:
        setError(data.message as string);
        addMessage({
          role: "system",
          content: `分析过程出现问题：${data.message}`,
        });
        break;
    }
  };

  // ─── Reset ───
  const handleReset = async () => {
    setMessages([]);
    setConversationPhase("greeting");
    setInquiryIndex(0);
    setCollectedInfo({ chiefComplaint: "", age: 30, sex: "男", answers: [] });
    setCurrentStage(null);
    setSyndromes([]);
    setTreatment(null);
    setSafetyPassed(null);
    setFinalOutput(null);
    setError(null);

    // Re-greet
    await aiReply("您好，我是您的中医问诊助手。请问今天哪里不舒服？", {
      quickReplies: COMMON_COMPLAINTS.map(c => ({ label: c, value: c })),
      delay: 600,
    });
    setConversationPhase("complaint");
  };

  // ─── Handle keyboard ───
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInquiryPhase = conversationPhase === "inquiry";
  const isDiagnosing = conversationPhase === "diagnosing";
  const isDone = conversationPhase === "done";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-500/10 text-rose-500">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">中医问诊助手</p>
            <p className="text-xs text-muted-foreground">
              {isDiagnosing ? "正在辨证分析中..." : isDone ? "评估完成" : "在线"}
            </p>
          </div>
        </div>
        {isDone && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重新问诊
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
              transition={{ duration: 0.25 }}
            >
              {msg.role === "user" ? (
                <UserBubble content={msg.content} />
              ) : msg.role === "system" ? (
                <SystemBubble content={msg.content} type={msg.type} />
              ) : (
                <AIBubble
                  message={msg}
                  onQuickReply={(value) => handleSend(value)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-2 pl-2"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-muted">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}

        {/* Diagnosis progress indicator */}
        {isDiagnosing && currentStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-2 px-3 mx-2"
          >
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
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
                className="px-3 py-1.5 text-sm rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        {/* Text input */}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            className="flex-1 p-3 border rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
            rows={1}
            placeholder={
              isDiagnosing ? "正在分析中..." :
              isInquiryPhase ? "请输入您的回答..." :
              isDone ? "问诊已结束" :
              "请描述您的不适..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping || isDiagnosing || isDone}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isTyping || isDiagnosing || isDone}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
          AI 问诊仅供参考，不构成医疗诊断。如有急症请立即就医。
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end py-1.5">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm leading-relaxed">
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

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5" />
      </div>
      <div className="max-w-[85%] space-y-2">
        {/* Text content */}
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-muted text-sm leading-relaxed">
          <ReactMarkdown>{String(content)}</ReactMarkdown>
        </div>

        {/* Rich cards based on type */}
        {type === "syndromes" && !!(data?.syndromes) && (
          <SyndromesCard syndromes={data.syndromes as Syndrome[]} />
        )}
        {type === "treatment" && !!(data?.treatment) && (
          <TreatmentCard treatment={data.treatment as { principle: string; formula: string; herbs: { name: string; dose: number }[] }} />
        )}
        {type === "safety" && !!(data?.passed) && (
          <SafetyCard passed={data.passed as boolean} />
        )}
        {type === "report" && !!(data?.content) && (
          <ReportCard content={data.content as string} />
        )}
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
        <span className="text-sm font-semibold">辨证分析</span>
      </div>
      <div className="space-y-3">
        {syndromes.map((s, i) => (
          <div key={s.name}>
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs font-medium truncate">{s.name}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    i === 0 ? "bg-violet-500" : i === 1 ? "bg-sky-500" : "bg-amber-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.probability * 100}%` }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                />
              </div>
              <span className="text-xs font-bold w-10 text-right">{(s.probability * 100).toFixed(0)}%</span>
            </div>
            {s.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 ml-23">
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

function TreatmentCard({ treatment }: { treatment: { principle: string; formula: string; herbs: { name: string; dose: number }[] } }) {
  return (
    <div className="px-4 py-3 rounded-xl border bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Pill className="w-4 h-4 text-emerald-500" />
        <span className="text-sm font-semibold">调理建议</span>
      </div>
      <div className="space-y-2 text-sm">
        {treatment.principle && (
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">治法</span>
            <span className="font-medium">{treatment.principle}</span>
          </div>
        )}
        {treatment.formula && (
          <div className="flex gap-2">
            <span className="text-muted-foreground shrink-0">方剂</span>
            <span className="font-medium">{treatment.formula}</span>
          </div>
        )}
        {treatment.herbs.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1.5">药物组成</p>
            <div className="flex flex-wrap gap-1.5">
              {treatment.herbs.map((h, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-xs font-medium">
                  {h.name} {h.dose}g
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SafetyCard({ passed }: { passed: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      passed
        ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400"
        : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400"
    }`}>
      <Shield className="w-4 h-4 shrink-0" />
      <span>{passed ? "安全检查通过" : "存在用药风险，已自动调整"}</span>
    </div>
  );
}

function ReportCard({ content }: { content: string }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-primary/20 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-semibold">评估报告</span>
      </div>
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
        <ReactMarkdown>{String(content)}</ReactMarkdown>
      </div>
      <div className="flex items-start gap-2 mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>以上建议仅供参考，不构成医疗诊断或治疗方案。如有不适，请及时就医。</span>
      </div>
    </div>
  );
}

// ─── Helpers ───

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    triage: "正在评估症状紧急程度...",
    inquiry: "正在准备补充问诊...",
    diagnosis: "正在进行辨证分析...",
    evidenceVerify: "正在验证诊断依据...",
    treatment: "正在生成调理方案...",
    safetyCheck: "正在检查用药安全...",
    conflictDetect: "正在检查配伍禁忌...",
    output: "正在生成报告...",
  };
  return labels[stage] ?? `正在处理...`;
}
