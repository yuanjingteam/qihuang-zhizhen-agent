"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Stethoscope,
  Leaf,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useRole, type UserRole } from "@/lib/role-context";

const allNavItems: Record<UserRole, { href: string; label: string; icon: typeof Heart; description: string }[]> = {
  patient: [
    { href: "/patient", label: "健康评估", icon: Heart, description: "体质辨识 · 十问歌" },
  ],
  doctor: [
    { href: "/doctor", label: "诊疗工作站", icon: Stethoscope, description: "AI 辅助诊断" },
  ],
};

const roleLabels: Record<UserRole, { name: string; avatar: string }> = {
  patient: { name: "患者", avatar: "患" },
  doctor: { name: "医生", avatar: "医" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useRole();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = allNavItems[role] ?? [];
  const roleInfo = roleLabels[role] ?? roleLabels.patient;

  const handleSwitchRole = () => {
    const newRole: UserRole = role === "patient" ? "doctor" : "patient";
    setRole(newRole);
    const target = newRole === "patient" ? "/patient" : "/doctor";
    router.push(target);
  };

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors"
          aria-label="打开菜单"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">岐黄智诊</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight leading-none">
                      岐黄智诊
                    </h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Qihuang Zhizhen
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors"
                  aria-label="关闭菜单"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mx-4 border-t" />

              {/* Drawer nav */}
              <nav className="flex-1 p-4 space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
                  工作台
                </p>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-sidebar-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-primary" : ""}`} />
                      <div className="flex-1 min-w-0">
                        <span className="block">{item.label}</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          {item.description}
                        </span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-primary/60" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer bottom */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2 px-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-semibold shrink-0">
                    {roleInfo.avatar}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{roleInfo.name} · 演示</span>
                  <button
                    onClick={handleSwitchRole}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    切换
                  </button>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">v2.0.0</span>
                  <ThemeToggle />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex border-r bg-card/50 backdrop-blur-sm flex-col transition-all duration-300 ease-in-out relative ${
          collapsed ? "w-16" : "w-72"
        }`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-20 w-6 h-6 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        {/* Brand */}
        <div className={`p-4 pb-3 ${collapsed ? "px-3" : "px-6"}`}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-lg font-bold tracking-tight leading-none whitespace-nowrap">
                    岐黄智诊
                  </h1>
                  <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">
                    Qihuang Zhizhen
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <div className="mx-4 border-t" />

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {!collapsed && (
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
              工作台
            </p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-xl text-sm transition-all duration-200 group ${
                  collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 min-w-0 overflow-hidden"
                    >
                      <span className="block whitespace-nowrap">{item.label}</span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">
                        {item.description}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isActive && !collapsed && (
                  <ChevronRight className="w-4 h-4 text-primary/60 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={`p-4 border-t ${collapsed ? "px-2" : "px-4"}`}>
          <AnimatePresence>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-2"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {roleInfo.avatar}
                </div>
                <span className="text-xs text-muted-foreground truncate">{roleInfo.name} · 演示</span>
                <button
                  onClick={handleSwitchRole}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title={`切换到${role === "patient" ? "医生" : "患者"}端`}
                >
                  切换
                </button>
                <span className="text-[10px] text-muted-foreground/60 shrink-0">v2.0.0</span>
                <ThemeToggle />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                  {roleInfo.avatar}
                </div>
                <button
                  onClick={handleSwitchRole}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title={`切换到${role === "patient" ? "医生" : "患者"}端`}
                >
                  切换
                </button>
                <ThemeToggle />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
