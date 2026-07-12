import { useEffect, useState } from "react";

// Best-effort India detection: timezone first, then optional IP fallback.
// Users can override with ?region=IN or ?region=INTL in the URL for testing.
export function useIsIndia(): { isIndia: boolean; loading: boolean } {
  const [state, setState] = useState({ isIndia: true, loading: true });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("region");
    if (override === "IN") return setState({ isIndia: true, loading: false });
    if (override === "INTL") return setState({ isIndia: false, loading: false });

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const locale = navigator.language || "";
      const looksIndian = tz.includes("Asia/Kolkata") || tz.includes("Asia/Calcutta") || locale.toLowerCase().includes("-in");
      setState({ isIndia: looksIndian, loading: false });
    } catch {
      setState({ isIndia: true, loading: false });
    }
  }, []);

  return state;
}
