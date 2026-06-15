"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  Stethoscope,
  Shield,
  Brain,
  Sparkles,
  ArrowRight,
  BookOpen,
  MessageCircle,
  AlertTriangle,
  Pill,
} from "lucide-react";
import { useRole } from "@/lib/role-context";

const features = [
  {
    icon: Brain,
    title: "AI 智能辨证",
    description: "基于 LangGraph 多智能体协作，模拟中医师临床思维进行八纲辨证",
  },
  {
    icon: Shield,
    title: "安全引擎",
    description: "十八反十九畏、妊娠禁忌、剂量限制——所有安全规则硬编码，绝不依赖 LLM",
  },
  {
    icon: Sparkles,
    title: "舌诊分析",
    description: "MCP 协议集成舌象采集设备，实时分析舌质舌苔辅助诊断",
  },
  {
    icon: Heart,
    title: "药食同源",
    description: "结合体质辨识与五运六气，生成个性化膳食调理方案",
  },
];

const tcmConcepts = [
  {
    icon: MessageCircle,
    title: "十问歌",
    subtitle: "中医问诊标准",
    content: `"一问寒热二问汗，三问头身四问便，五问饮食六问胸，七聋八渴俱当辨，九问旧病十问因，再兼服药参机变。"`,
    explanation: "十问歌是中医问诊的经典框架，系统通过结构化问卷收集患者信息，确保诊断依据完整。",
    categories: ["寒热", "出汗", "头身", "二便", "饮食", "胸腹", "耳聋", "口渴", "旧病", "病因"],
  },
  {
    icon: BookOpen,
    title: "理法方药",
    subtitle: "中医诊疗逻辑链",
    content: "辨证→立法→选方→用药",
    explanation: "系统严格遵循中医临床思维：先辨证型（如肝郁脾虚），再立治法（疏肝健脾），选方（逍遥散），最后用药加减。",
    steps: ["理 - 辨证分析", "法 - 确立治法", "方 - 选择方剂", "药 - 药物加减"],
  },
  {
    icon: AlertTriangle,
    title: "十八反十九畏",
    subtitle: "中药配伍禁忌",
    content: "本草明言十八反，半蒌贝蔹芨攻乌，藻戟遂芫俱战草，诸参辛芍叛藜芦。",
    explanation: "系统内置所有配伍禁忌规则，开方时自动检测，确保用药安全。这些规则硬编码在安全引擎中，绝不依赖AI生成。",
    pairs: ["甘草 ↔ 甘遂", "乌头 ↔ 贝母", "藜芦 ↔ 人参"],
  },
  {
    icon: Pill,
    title: "Top-K 证候分布",
    subtitle: "概率化诊断输出",
    content: "不输出单一结论，而是输出概率分布",
    explanation: "系统输出Top-5证候概率（如：肝郁化火 65%、阴虚火旺 20%...），更符合临床实际，避免过度自信的单一诊断。",
    example: [
      { name: "肝郁化火证", prob: 65 },
      { name: "阴虚火旺证", prob: 20 },
      { name: "痰热扰心证", prob: 10 },
      { name: "心脾两虚证", prob: 5 },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const { setRole } = useRole();
  const router = useRouter();

  const handleSelectRole = (role: "patient" | "doctor", href: string) => {
    setRole(role);
    router.push(href);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        {/* Hero */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            岐黄智诊
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
          >
            岐黄智诊
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            AI 驱动的中医智能诊疗助手
            <br />
            <span className="text-base">多智能体协作 · 安全引擎 · 知识图谱</span>
          </motion.p>

          <motion.p
            variants={fadeUp}
            custom={2.5}
            className="text-sm text-muted-foreground mt-4"
          >
            请选择您的身份进入系统
          </motion.p>
        </motion.div>

        {/* Entry Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full mb-20"
        >
          <motion.div variants={fadeUp} custom={3}>
            <button
              onClick={() => handleSelectRole("patient", "/patient")}
              className="group relative block w-full text-left rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 transition-all duration-300 hover:border-rose-400/40 hover:shadow-lg hover:shadow-rose-500/5 hover:-translate-y-1 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400 transition-transform duration-300 group-hover:scale-110">
                  <Heart className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold">我是患者</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                体质评估 · 十问歌问卷 · 药食同源膳食方案
              </p>
              <span className="inline-flex items-center text-sm text-rose-500 font-medium group-hover:gap-2 transition-all">
                开始健康评估
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </motion.div>

          <motion.div variants={fadeUp} custom={4}>
            <button
              onClick={() => handleSelectRole("doctor", "/doctor")}
              className="group relative block w-full text-left rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 transition-all duration-300 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold">我是医生</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                AI 诊疗工作站 · Top-K 辨证 · 处方推荐 · SOAP 病历
              </p>
              <span className="inline-flex items-center text-sm text-emerald-600 font-medium group-hover:gap-2 transition-all">
                进入工作站
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl w-full mb-24"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={5 + i}
              className="group rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* TCM Concepts Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-5xl w-full mb-20"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">核心中医概念</h2>
            <p className="text-muted-foreground">
              系统严格遵循传统中医理论，以下是关键概念说明
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tcmConcepts.map((concept, i) => (
              <motion.div
                key={concept.title}
                variants={fadeUp}
                custom={1 + i}
                className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                      <concept.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{concept.title}</h3>
                      <p className="text-sm text-muted-foreground">{concept.subtitle}</p>
                    </div>
                  </div>

                  <blockquote className="border-l-2 border-primary/30 pl-4 py-1 mb-4 text-sm italic text-muted-foreground">
                    {concept.content}
                  </blockquote>

                  <p className="text-sm leading-relaxed mb-4">
                    {concept.explanation}
                  </p>

                  {/* Dynamic content based on concept type */}
                  {concept.categories && (
                    <div className="flex flex-wrap gap-2">
                      {concept.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {concept.steps && (
                    <div className="flex flex-col gap-2">
                      {concept.steps.map((step, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                            {j + 1}
                          </span>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}

                  {concept.pairs && (
                    <div className="space-y-1">
                      {concept.pairs.map((pair) => (
                        <div key={pair} className="text-sm text-destructive font-mono">
                          ✕ {pair}
                        </div>
                      ))}
                    </div>
                  )}

                  {concept.example && (
                    <div className="space-y-2">
                      {concept.example.map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="text-sm w-24">{item.name}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${item.prob}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-10 text-right">
                            {item.prob}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 2B vs 2C Explanation */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl w-full mb-20"
        >
          <motion.div variants={fadeUp} custom={0} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-8">
            <h2 className="text-xl font-bold mb-4">2B / 2C 双模式输出</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-600 font-medium">2B 医生端</span>
                </div>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Top-K 证候概率分布</li>
                  <li>• 完整处方（方剂+药物+剂量）</li>
                  <li>• 安全检查结果</li>
                  <li>• SOAP 电子病历</li>
                  <li>• 完整推理链路</li>
                </ul>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded bg-rose-500/10 text-rose-500 font-medium">2C 患者端</span>
                </div>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• 体质倾向分析</li>
                  <li>• 药食同源膳食建议</li>
                  <li>• 养生调理方案</li>
                  <li>• 免责声明提示</li>
                  <li>• 不含处方信息</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-xs text-muted-foreground"
        >
          <p>岐黄智诊 — 以上建议仅供参考，不构成医疗诊断或治疗方案</p>
        </motion.footer>
      </div>
    </main>
  );
}
