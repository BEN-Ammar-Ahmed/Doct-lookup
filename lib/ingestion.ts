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


export type PracticeLocation = { address1: string; city: string; state: string; zip: string; phone: string | null };

function pick(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    const value = row[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function nppesPracticeLocationCsv(row: Record<string, string>): { npi: string; location: PracticeLocation } | null {
  const npi = pick(row, ["NPI"]);
  const address1 = pick(row, [
    "Provider Secondary Practice Location Address- Address Line 1",
    "Provider Secondary Practice Location Address - Address Line 1",
    "Provider Secondary Practice Location Address Line 1",
    "Provider_Secondary_Practice_Location_Address_Line_1",
  ]);
  const city = pick(row, [
    "Provider Secondary Practice Location Address - City Name",
    "Provider Secondary Practice Location Address City Name",
    "Provider_Secondary_Practice_Location_Address_City_Name",
  ]);
  const state = pick(row, [
    "Provider Secondary Practice Location Address - State Name",
    "Provider Secondary Practice Location Address State Name",
    "Provider_Secondary_Practice_Location_Address_State_Name",
  ]).slice(0, 2).toUpperCase();
  const zip = pick(row, [
    "Provider Secondary Practice Location Address - Postal Code",
    "Provider Secondary Practice Location Address Postal Code",
    "Provider_Secondary_Practice_Location_Address_Postal_Code",
  ]).slice(0, 5);
  const phone = pick(row, [
    "Provider Secondary Practice Location Address - Telephone Number",
    "Provider Secondary Practice Location Address Telephone Number",
    "Provider_Secondary_Practice_Location_Address_Telephone_Number",
  ]) || null;

  if (!/^\d{10}$/.test(npi) || !address1 || !city || !/^[A-Z]{2}$/.test(state) || !/^\d{5}$/.test(zip)) return null;
  return { npi, location: { address1, city, state, zip, phone } };
}
