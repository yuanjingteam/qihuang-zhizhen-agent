"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/patient", label: "患者评估", icon: " ", emoji: " " },
  { href: "/doctor", label: "医生工作站", icon: " ", emoji: " " },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "border-r bg-muted/30 min-h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn("p-4 border-b", collapsed ? "px-3" : "px-4")}>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl shrink-0"> </span>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <h1 className="font-bold text-lg whitespace-nowrap">Cyber-TCM</h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">AI 中医诊疗系统</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute top-4 right-0 translate-x-1/2 z-10 w-6 h-6 rounded-full bg-background border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
          style={{ top: "3.5rem" }}
        >
          <svg
            className={cn("w-3 h-3 transition-transform", collapsed && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                collapsed ? "px-3 py-3 justify-center" : "px-3 py-2",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg shrink-0">{item.emoji}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn("p-4 border-t", collapsed ? "px-2" : "px-4")}>
          <AnimatePresence>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground space-y-1"
              >
                <p>版本 2.0.0</p>
                <p>仅供医疗专业人员参考</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground text-center"
              >
                v2.0
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
