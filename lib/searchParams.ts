export type ResultsQuery = {
  zip?: string;
  lat?: string;
  lng?: string;
  specialty?: string;
  name?: string;
  state?: string;
  category: "none" | "marketplace" | "medicare" | "other";
  planId?: string;
  planName?: string;
  issuerName?: string;
  planYear?: string;
  insurerName?: string;
};

// Builds the /api/doctors/search query string. Shared by the initial load
// and "Load more" so pagination can never drift from the active filters —
// the only thing that changes between pages is `skip`.
export function buildSearchParams(
  query: ResultsQuery,
  opts: { skip?: number; override?: { lat: number; lng: number } | null } = {}
): URLSearchParams {
  const q = new URLSearchParams();
  if (opts.override) {
    q.set("lat", String(opts.override.lat));
    q.set("lng", String(opts.override.lng));
  } else if (query.lat && query.lng) {
    q.set("lat", query.lat);
    q.set("lng", query.lng);
  } else if (query.zip) {
    q.set("zip", query.zip);
  }
  if (query.specialty) q.set("specialty", query.specialty);
  if (query.name) q.set("name", query.name);
  if (query.state) q.set("state", query.state);
  if (query.category !== "none") q.set("category", query.category);
  if (query.category === "marketplace") {
    q.set("planId", query.planId ?? "");
    q.set("planName", query.planName ?? "");
    q.set("issuerName", query.issuerName ?? "");
    q.set("planYear", query.planYear ?? "");
  }
  if (query.category === "other" && query.insurerName) {
    q.set("insurerName", query.insurerName);
  }
  if (opts.skip) q.set("skip", String(opts.skip));
  return q;
}
