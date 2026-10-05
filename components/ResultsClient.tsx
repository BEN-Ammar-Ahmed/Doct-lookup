"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Doctor } from "@/lib/npi";
import type { LatLng } from "@/lib/geo";
import type { CoverageDisplay } from "@/lib/coverage";
import DoctorCard from "./DoctorCard";
import LazyResultsMap from "./LazyResultsMap";
import SkeletonCards from "./Skeleton";

type ApiDoctor = Doctor & { coverage?: CoverageDisplay };
type ApiData = { center: LatLng | null; doctors: ApiDoctor[]; hasMore: boolean; nextSkip?: number };
const errors: Record<string, [string, string]> = {
  invalid_zip: ["Check your ZIP code", "Enter a five-digit US ZIP code and search again."],
  invalid_area: ["Check your location", "Enter a ZIP code to search a valid US area."],
  missing_query: ["Start a search", "Enter a ZIP code or a provider name."],
  rate_limited: ["Too many requests", "Wait a minute before trying again."],
  rate_limit_unavailable: ["Search protection is unavailable", "The service is temporarily unavailable. Try again shortly."],
  area_unresolved: ["Location could not be resolved", "Enter a ZIP code instead."],
};
export default function ResultsClient() {
  const sp = useSearchParams();
  const queryString = sp.toString();
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locatingPins, setLocatingPins] = useState(false);
  const [pinError, setPinError] = useState("");
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("");
  const [area, setArea] = useState<LatLng | null>(null);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const fetchData = useCallback(async (skip = 0, override?: LatLng | null) => {
    const id = ++generation.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    if (skip) setLoadingMore(true); else { setLoading(true); setData(null); }
    setError(null);
    const query = new URLSearchParams(queryString);
    query.set("skip", String(skip));
    if (override) { query.delete("zip"); query.set("lat", String(override.lat)); query.set("lng", String(override.lng)); }
    try {
      const response = await fetch("/api/doctors/search?" + query, { signal: controller.signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "request_failed");
      if (id !== generation.current) return;
      setData(previous => skip && previous ? {
        ...payload, doctors: [...new Map([...previous.doctors, ...payload.doctors].map((d: ApiDoctor) => [d.npi, d])).values()]
      } : payload);
    } catch (failure) {
      if (id === generation.current) setError(controller.signal.aborted ? "timeout" : failure instanceof Error ? failure.message : "request_failed");
    } finally {
      window.clearTimeout(timeout);
      if (id === generation.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [queryString]);
  useEffect(() => {
    setArea(null); setFilter(""); setView("list");
    void fetchData();
    return () => { request.current?.abort(); };
  }, [fetchData]);
  async function locatePins() {
    if (!data) return;
    const id = generation.current;
    setLocatingPins(true); setPinError("");
    try {
      const response = await fetch("/api/doctors/geocode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ center: data.center, doctors: data.doctors.filter(d => d.lat === null).slice(0, 3) }), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error();
      const { results } = await response.json();
      if (id !== generation.current) return;
      const points = new Map<string, {lat:number;lng:number;distanceMi:number|null}>(results.map((p: {npi:string;lat:number;lng:number;distanceMi:number|null}) => [p.npi, p]));
      setData(previous => previous ? { ...previous, doctors: previous.doctors.map(d => { const point = points.get(d.npi); return point ? { ...d, ...point, locationApproximate: false } : d; }) } : previous);
      if (!results.length) setPinError("No address match was found. Use the listed address for directions.");
    } catch { setPinError("Address matching is unavailable. The provider list is still available."); }
    finally { setLocatingPins(false); }
  }
  const filtered = useMemo(() => (data?.doctors ?? []).filter(d => !filter || d.specialty === filter), [data, filter]);
  const specialties = [...new Set((data?.doctors ?? []).map(d => d.specialty))].sort();
  const detail = new URLSearchParams(queryString);
  for (const key of ["zip", "specialty", "name", "state", "skip"]) detail.delete(key);
  const detailQuery = detail.size ? "?" + detail : "";
  const summary = sp.get("name") || (area ? "Map area" : sp.get("zip") || "Current location");
  const [errorTitle, errorBody] = errors[error ?? ""] ?? ["Provider records are unavailable", "The request failed or timed out. Check your connection and try again."];
  return <main className="screen results-screen">
    <h1>Doctors near you</h1>
    <div className="results-toolbar">
      <Link className="query-card" href="/search" aria-label="Edit search"><span className="query-text">{summary}{sp.get("specialty") ? " · " + sp.get("specialty") : ""}</span><span className="query-edit">Edit search</span></Link>
      <div className="pill-toggle results-view-toggle" role="group" aria-label="Results view">
        <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
        <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")} disabled={!data?.center}>Map</button>
      </div>
    </div>
    {loading && <SkeletonCards />}
    {error && <div className="card empty-card" role="alert"><h2 className="empty-card-title">{errorTitle}</h2><p>{errorBody}</p><button className="btn-primary" onClick={() => void fetchData(data?.doctors.length ?? 0, area)}>Try again</button><Link className="text-action-link" href="/search">Edit search</Link></div>}
    {!loading && data && data.doctors.length === 0 && <section className="card empty-card"><h2>No providers found</h2><p>Try another ZIP code, remove a specialty, or check the provider name.</p><Link className="btn-primary" href="/search">Change search</Link></section>}
    {!loading && data && data.doctors.length > 0 && <div className="results-workspace" data-view={view}>
      <details className="results-filters" open><summary>Filters</summary><div className="results-filter-body">
        <label htmlFor="result-specialty">Specialty in these results</label><select id="result-specialty" value={filter} onChange={e => setFilter(e.target.value)}><option value="">All specialties</option>{specialties.map(s => <option key={s}>{s}</option>)}</select>
        <p>Filters apply to loaded results. Load more to see additional providers. Coverage is never inferred from specialty.</p>
      </div></details>
      <section className="results-list" aria-label="Provider results">
        <p className="results-summary" role="status">{filtered.length} provider{filtered.length === 1 ? "" : "s"} shown</p>
        {filtered.length === 0 && <p>No loaded providers match this filter. Choose another specialty.</p>}
        {filtered.map(d => <DoctorCard key={d.npi} doctor={d} query={detailQuery} />)}
        {data.hasMore && <button className="btn-primary" disabled={loadingMore} onClick={() => void fetchData(data.nextSkip ?? data.doctors.length, area)}>{loadingMore ? "Loading…" : "Load more doctors"}</button>}
      </section>
      <aside className="results-map-panel" aria-label="Provider map">
        {data.doctors.some(d => d.lat === null) && <><p className="coverage-caption">Unmatched offices are listed without pins. Matches are approximate.</p><button type="button" className="text-action-link" disabled={locatingPins} onClick={() => void locatePins()}>{locatingPins ? "Matching addresses…" : "Match up to 3 office addresses"}</button></>}
        {pinError && <p role="status" className="coverage-caption">{pinError}</p>}
        {data.center ? <LazyResultsMap center={data.center} doctors={filtered} query={detailQuery} onSearchArea={sp.get("name") ? undefined : (lat, lng) => { const next = { lat, lng }; setArea(next); void fetchData(0, next); }} /> : <div className="card"><h2>Map unavailable</h2><p>Provider addresses remain available in the list.</p></div>}
      </aside>
    </div>}
    <p className="disclaimer">Public records may be delayed. Confirm the office, exact insurance plan, services, and patient availability before a visit.</p>
  </main>;
}
