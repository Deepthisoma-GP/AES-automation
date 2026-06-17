// App-wide state shared across modules: the active framework and the most
// recent scorecard run (so Execution -> Ratings/Rankings/Results connect).
import React, { createContext, useContext, useEffect, useState } from "react";

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [activeFrameworkId, setActiveFrameworkId] = useState(
    () => localStorage.getItem("apfb.activeFramework") || "fw_sales_v2"
  );
  const [lastRunId, setLastRunId] = useState(() => localStorage.getItem("apfb.lastRun") || null);
  const [role, setRole] = useState(() => localStorage.getItem("apfb.role") || "Business Owner");

  useEffect(() => {
    if (activeFrameworkId) localStorage.setItem("apfb.activeFramework", activeFrameworkId);
  }, [activeFrameworkId]);
  useEffect(() => {
    if (lastRunId) localStorage.setItem("apfb.lastRun", lastRunId);
  }, [lastRunId]);
  useEffect(() => localStorage.setItem("apfb.role", role), [role]);

  return (
    <StoreCtx.Provider
      value={{ activeFrameworkId, setActiveFrameworkId, lastRunId, setLastRunId, role, setRole }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);
