"use client";

import * as React from "react";

export type UserRole = "patient" | "doctor";

const ROLE_STORAGE_KEY = "tcm-user-role";

const RoleContext = React.createContext<{
  role: UserRole;
  setRole: (role: UserRole) => void;
}>({
  role: "patient",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<UserRole>("patient");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (stored === "patient" || stored === "doctor") {
      setRoleState(stored);
    }
    setMounted(true);
  }, []);

  const setRole = React.useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);
  }, []);

  if (!mounted) return null;

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return React.useContext(RoleContext);
}
