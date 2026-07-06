import React, { createContext, useContext, useState } from "react";

const SidebarCtx = createContext();

export function SidebarProvider({ children, user }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => setCollapsed((c) => !c);

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle, user }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarCtx);
}