export const INSURERS = [
  { id: "aetna", name: "Aetna" },
  { id: "bcbs", name: "Blue Cross Blue Shield" },
  { id: "cigna", name: "Cigna" },
  { id: "uhc", name: "UnitedHealthcare" },
  { id: "humana", name: "Humana" },
  { id: "kaiser", name: "Kaiser Permanente" },
  { id: "molina", name: "Molina Healthcare" },
  { id: "ambetter", name: "Ambetter" },
  { id: "medicare", name: "Medicare" },
  { id: "medicaid", name: "Medicaid" },
] as const;

export type InsurerId = (typeof INSURERS)[number]["id"];

export function insurerName(id: string): string {
  return INSURERS.find((i) => i.id === id)?.name ?? id;
}
