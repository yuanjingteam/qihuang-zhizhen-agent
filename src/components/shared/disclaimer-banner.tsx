"use client";

import * as React from "react";

interface DisclaimerBannerProps {
  variant?: "2B" | "2C";
}

export function DisclaimerBanner({ variant = "2C" }: DisclaimerBannerProps) {
  if (variant === "2B") {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
        <strong>AI 辅助诊断</strong>：本系统提供的诊断建议仅供参考，最终诊断和治疗方案由执业医师决定。
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
      <strong>免责声明</strong>：本系统提供的健康建议仅供参考，不构成医疗诊断或治疗方案。如有不适，请及时就医。
    </div>
  );
}
