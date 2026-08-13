// Names offered in the "Other / employer insurance" picker. This list does
// NOT drive any coverage answer — this app has no free, verified data
// source for these carriers, so results for them are always "not
// verified" (see lib/coverage.ts). `homepage` links to each insurer's own
// official site (root domain only, to avoid linking a guessed deep path)
// so users can check their own directory.
export const KNOWN_INSURERS = [
  { name: "Aetna", homepage: "https://www.aetna.com" },
  { name: "Blue Cross Blue Shield", homepage: "https://www.bcbs.com" },
  { name: "Cigna", homepage: "https://www.cigna.com" },
  { name: "UnitedHealthcare", homepage: "https://www.uhc.com" },
  { name: "Humana", homepage: "https://www.humana.com" },
  { name: "Kaiser Permanente", homepage: "https://www.kp.org" },
  { name: "Molina Healthcare", homepage: "https://www.molinahealthcare.com" },
  { name: "Ambetter", homepage: "https://www.ambetterhealth.com" },
  { name: "Medicaid", homepage: null },
  { name: "Medicare Advantage", homepage: null },
] as const;

export function homepageFor(insurerName: string): string | null {
  return (
    KNOWN_INSURERS.find(
      (i) => i.name.toLowerCase() === insurerName.trim().toLowerCase()
    )?.homepage ?? null
  );
}
