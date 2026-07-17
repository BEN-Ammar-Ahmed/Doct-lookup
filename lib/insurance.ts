import { INSURERS } from "./insurers";

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Demo data: acceptance is a stable function of the NPI number, not real
// network participation. The same doctor always yields the same plans.
export function plansFor(npi: string): string[] {
  const h = fnv1a(npi);
  const count = 3 + (h % 4);
  const start = fnv1a(npi + "s") % INSURERS.length;
  const stride = 1 + (fnv1a(npi + "t") % (INSURERS.length - 1));
  const picked: string[] = [];
  let idx = start;
  while (picked.length < count) {
    const id = INSURERS[idx % INSURERS.length].id;
    if (!picked.includes(id)) {
      picked.push(id);
      idx += stride;
    } else {
      idx += 1;
    }
  }
  return picked.sort();
}
