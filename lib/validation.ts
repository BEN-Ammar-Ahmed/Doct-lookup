export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function isValidNpi(npi: string): boolean {
  return /^\d{10}$/.test(npi);
}

// CMS Marketplace plan (HIOS) IDs vary in exact format across marketplace
// types, so this is deliberately permissive rather than guessing an exact
// pattern: alphanumeric plus hyphens, a plausible length range.
export function isValidPlanId(id: string): boolean {
  return /^[A-Za-z0-9-]{6,20}$/.test(id);
}

export function isValidPlanYear(year: number): boolean {
  const current = new Date().getFullYear();
  return Number.isInteger(year) && year >= 2014 && year <= current + 1;
}
