import { normalizeNpiResult, type Doctor } from "./npi";
export function nppesCsvProvider(row: Record<string, string>, taxonomies: Map<string, string>): Doctor | null {
  if (row["Entity Type Code"] !== "1" || (row["NPI Deactivation Date"] && !row["NPI Reactivation Date"])) return null;
  if (!/^\d{10}$/.test(row.NPI ?? "")) return null;
  let code = row["Healthcare Provider Taxonomy Code_1"];
  for (let i = 1; i <= 15; i++) if (row["Healthcare Provider Primary Taxonomy Switch_" + i] === "Y") code = row["Healthcare Provider Taxonomy Code_" + i];
  return normalizeNpiResult({
    number: row.NPI, enumeration_type: "NPI-1",
    basic: { first_name: row["Provider First Name"], last_name: row["Provider Last Name (Legal Name)"], credential: row["Provider Credential Text"], last_updated: row["Last Update Date"] },
    taxonomies: [{ primary: true, desc: taxonomies.get(code) ?? "Provider (taxonomy " + (code || "unavailable") + ")" }],
    addresses: [{
      address_purpose: "LOCATION", address_1: row["Provider First Line Business Practice Location Address"],
      city: row["Provider Business Practice Location Address City Name"],
      state: row["Provider Business Practice Location Address State Name"],
      postal_code: row["Provider Business Practice Location Address Postal Code"],
      telephone_number: row["Provider Business Practice Location Address Telephone Number"],
    }],
  });
}
export function bestAssignment(current: string | undefined, value: string): string {
  return current === "Y" || value === "Y" ? "Y" : current === "M" || value === "M" ? "M" : "";
}
