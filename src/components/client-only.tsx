import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders browser-only content (WebGL, canvas) after hydration. The server
 * never evaluates these children, so a Three.js scene cannot break SSR.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
