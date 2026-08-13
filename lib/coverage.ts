// Shared shape for every insurance-verification result shown in the UI.
// Every screen (list, map, profile) renders this same structure so the
// meaning of a status never drifts between components.
export type CoverageStatus =
  | "covered"
  | "not_covered"
  | "unknown"
  | "unavailable"
  | "unsupported";

export type CoverageDisplay = {
  status: CoverageStatus;
  label: string;
  source: string | null;
  checkedAt: string;
  planName?: string;
  issuerName?: string;
  planYear?: number;
  accepting?: string;
  note?: string;
  providerAddress?: string;
};

// Map pin / marker color. Green is reserved for a real "covered" result —
// every other state (including "we don't know") uses a neutral color.
export function coverageMarkerColor(status: CoverageStatus | undefined): string {
  if (status === "covered") return "#0E8A5F";
  if (status === "not_covered") return "#B5545C";
  return "#0F6E8C";
}

export function unsupportedCoverage(insurerName?: string): CoverageDisplay {
  return {
    status: "unsupported",
    label: "This insurance plan is not currently verified by this website.",
    source: null,
    checkedAt: new Date().toISOString(),
    note: insurerName
      ? `Check your ${insurerName} member ID card or its official provider directory.`
      : "Check your member ID card or the insurer's official provider directory.",
  };
}
