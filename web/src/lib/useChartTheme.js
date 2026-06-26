import { useEffect, useState } from "react";

// Recharts takes literal color props (not CSS classes / tokens), so chart
// grid/axis/tooltip colors can't ride the theme tokens automatically. This hook
// returns a palette for the current theme and re-renders when the theme flips
// (it watches <html data-theme>, which ThemeToggle sets).
function read() {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";
  return dark
    ? {
        grid: "#1e293b",
        axis: "#64748b",
        cursor: "rgba(148, 163, 184, 0.12)",
        tooltip: {
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 8,
          fontSize: 12,
          color: "#e2e8f0",
        },
      }
    : {
        // Soft, low-contrast grid so the dotted lines read as a faint guide,
        // not hard dark rules on the light surface.
        grid: "#d4dce7",
        axis: "#8593a8",
        cursor: "rgba(100, 116, 139, 0.08)",
        tooltip: {
          background: "#ffffff",
          border: "1px solid #d8dfe9",
          borderRadius: 8,
          fontSize: 12,
          color: "#1e293b",
          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.10)",
        },
      };
}

export function useChartTheme() {
  const [palette, setPalette] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setPalette(read()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    setPalette(read()); // sync once mounted
    return () => obs.disconnect();
  }, []);
  return palette;
}
