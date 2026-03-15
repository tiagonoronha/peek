import { useEffect } from "react";

interface ProviderProps {
  children: React.ReactNode;
}

/**
 * Minimal provider that forces dark mode via CSS class.
 */
export function Provider({ children }: ProviderProps) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return <>{children}</>;
}
