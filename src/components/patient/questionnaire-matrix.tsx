"use client";

import * as React from "react";

interface QuestionnaireMatrixProps {
  onChange?: (responses: Record<string, string[]>) => void;
}

// Full 十问歌 categories with expanded options
const categories = [
  {
    id: "寒热",
    label: "一问寒热",
    options: ["怕冷", "怕热", "手脚冰凉", "手足心发热", "寒热往来", "不明显"],
  },
  {
    id: "出汗",
    label: "二问汗",
    options: ["正常出汗", "容易出汗", "很少出汗", "夜间盗汗", "自汗", "无汗"],
  },
  {
    id: "头身",
    label: "三问头身",
    options: ["头痛", "头晕", "头重", "身痛", "腰酸", "颈项僵硬", "无不适"],
  },
  {
    id: "二便",
    label: "四问便",
    options: ["大便干结", "大便溏稀", "便秘", "小便黄赤", "小便清长", "夜尿频多", "正常"],
  },
  {
    id: "饮食",
    label: "五问饮食",
    options: ["食欲不振", "食欲旺盛", "食后腹胀", "喜热食", "喜冷食", "口味异常", "正常"],
  },
  {
    id: "胸腹",
    label: "六问胸",
    options: ["胸闷", "心悸", "腹胀", "腹痛", "胁肋胀痛", "胃脘不适", "无不适"],
  },
  {
    id: "耳",
    label: "七问耳",
    options: ["耳鸣", "听力下降", "耳闷", "无不适"],
  },
  {
    id: "口渴",
    label: "八问渴",
    options: ["不渴", "口干多饮", "口渴但不欲饮", "喜热饮", "喜冷饮", "口苦"],
  },
  {
    id: "旧病",
    label: "九问旧病",
    options: ["高血压", "糖尿病", "心脏病", "胃病", "肝病", "肺病", "无旧病"],
  },
  {
    id: "病因",
    label: "十问因",
    options: ["情志不畅", "劳累过度", "饮食不节", "外感风寒", "外感风热", "不明原因"],
  },
];

export function QuestionnaireMatrix({ onChange }: QuestionnaireMatrixProps) {
  const [responses, setResponses] = React.useState<Record<string, string[]>>({});

  const handleToggle = (category: string, option: string) => {
    setResponses((prev) => {
      const current = prev[category] || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      const updated = { ...prev, [category]: next };
      onChange?.(updated);
      return updated;
    });
  };

  const selectedCount = Object.values(responses).flat().length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          已选 <span className="font-semibold text-foreground">{selectedCount}</span> 项
        </span>
        {selectedCount > 0 && (
          <button
            onClick={() => { setResponses({}); onChange?.({}); }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            清空
          </button>
        )}
      </div>

      {/* All categories displayed inline */}
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const catSelected = responses[cat.id]?.length ?? 0;
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                {catSelected > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary font-medium">
                    {catSelected}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.options.map((option) => {
                  const isSelected = responses[cat.id]?.includes(option) ?? false;
                  return (
                    <button
                      key={option}
                      onClick={() => handleToggle(cat.id, option)}
                      className={`relative px-3 py-1.5 rounded-lg border text-sm transition-all duration-200 flex items-center gap-1.5 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-3.5 h-3.5 rounded-sm border shrink-0 ${
                        isSelected
                          ? "bg-primary-foreground border-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
