"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { Doctor } from "@/lib/npi";
import type { LatLng } from "@/lib/geo";
import type { CoverageDisplay } from "@/lib/coverage";
import { buildSearchParams, type ResultsQuery } from "@/lib/searchParams";
import DoctorCard from "./DoctorCard";
import SkeletonCards from "./Skeleton";
import {
  ChevronLeftIcon,
  ListIcon,
  MapIcon,
  RefreshIcon,
  ShieldCheckIcon,
} from "./Icons";

const ResultsMap = dynamic(() => import("./ResultsMap"), { ssr: false });

type ApiDoctor = Doctor & { coverage?: CoverageDisplay };
type ApiData = { center: LatLng | null; doctors: ApiDoctor[]; hasMore: boolean };

export default function ResultsClient() {
  const sp = useSearchParams();
  const zip = sp.get("zip") ?? "";
  const specialty = sp.get("specialty") ?? "";
  const name = sp.get("name") ?? "";
  const state = sp.get("state") ?? "";
  const category = (sp.get("category") ?? "none") as ResultsQuery["category"];
  const planId = sp.get("planId") ?? "";
  const planName = sp.get("planName") ?? "";
  const issuerName = sp.get("issuerName") ?? "";
  const planYear = sp.get("planYear") ?? "";
  const insurerName = sp.get("insurerName") ?? "";
  const hasCategory = category !== "none";

  const [data, setData] = useState<ApiData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [specFilter, setSpecFilter] = useState("");
  const [areaOverride, setAreaOverride] = useState<{ lat: number; lng: number } | null>(null);

  const query: ResultsQuery = {
    zip,
    specialty,
    name,
    state,
    category,
    planId,
    planName,
    issuerName,
    planYear,
    insurerName,
  };

  const buildParams = useCallback(
    (skip: number, override?: { lat: number; lng: number } | null) =>
      buildSearchParams(query, { skip, override }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zip, specialty, name, state, category, planId, planName, issuerName, planYear, insurerName]
  );

  const detailQuery = useMemo(() => {
    const q = buildSearchParams(query, {});
    q.delete("zip");
    q.delete("specialty");
    q.delete("name");
    q.delete("state");
    const s = q.toString();
    return s ? `?${s}` : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, planId, planName, issuerName, planYear, insurerName]);

  const load = useCallback(
    (override?: { lat: number; lng: number }) => {
      setError(false);
      setData(null);
      const q = buildParams(0, override);
      fetch(`/api/doctors/search?${q}`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(setData)
        .catch(() => setError(true));
    },
    [buildParams]
  );

  useEffect(() => {
    setAreaOverride(null);
    load();
  }, [load]);

  const handleSearchArea = useCallback(
    (lat: number, lng: number) => {
      setAreaOverride({ lat, lng });
      load({ lat, lng });
    },
    [load]
  );

  const loadMore = useCallback(() => {
    if (!data) return;
    setLoadingMore(true);
    const q = buildParams(data.doctors.length, areaOverride);
    fetch(`/api/doctors/search?${q}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((more: ApiData) => {
        setData((prev) => (prev ? { ...more, doctors: [...prev.doctors, ...more.doctors] } : more));
      })
      .catch(() => setError(true))
      .finally(() => setLoadingMore(false));
  }, [data, buildParams, areaOverride]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return specFilter ? data.doctors.filter((d) => d.specialty === specFilter) : data.doctors;
  }, [data, specFilter]);

  const covered = useMemo(
    () => (hasCategory ? filtered.filter((d) => d.coverage?.status === "covered") : []),
    [filtered, hasCategory]
  );
  const rest = useMemo(
    () => (hasCategory ? filtered.filter((d) => d.coverage?.status !== "covered") : filtered),
    [filtered, hasCategory]
  );

  const specChips = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const d of data.doctors) {
      counts.set(d.specialty, (counts.get(d.specialty) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s]) => s);
  }, [data]);

  const categoryLabel =
    category === "marketplace"
      ? planName || "ACA Marketplace plan"
      : category === "medicare"
        ? "Original Medicare"
        : category === "other"
          ? insurerName || "Other insurance"
          : null;

  const summary = name
    ? `"${name}"${state ? ` · ${state}` : ""}`
    : categoryLabel
      ? `${categoryLabel} · ${areaOverride ? "this area" : zip}`
      : zip;

  const removeSpecialtyHref = (() => {
    const q = buildParams(0, areaOverride);
    q.delete("specialty");
    return `/results?${q}`;
  })();

  return (
    <main className="screen" style={{ paddingTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Link
          href="/search"
          aria-label="Back to search"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <ChevronLeftIcon size={22} />
        </Link>
        <Link
          href="/search"
          className="fld"
          style={{
            minHeight: 42,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 13.5,
            gap: 6,
          }}
        >
          <ShieldCheckIcon size={16} className="fld-icon" />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {summary}
          </span>
          <span
            className="muted"
            style={{ marginLeft: "auto", fontSize: 12.5, flexShrink: 0 }}
          >
            Edit
          </span>
        </Link>
      </div>

      <div className="pill-toggle" style={{ marginBottom: 10 }}>
        <button
          type="button"
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          <ListIcon size={15} />
          List
        </button>
        <button
          type="button"
          aria-pressed={view === "map"}
          onClick={() => setView("map")}
          disabled={!data?.center}
          style={!data?.center ? { opacity: 0.5 } : undefined}
        >
          <MapIcon size={15} />
          Map
        </button>
      </div>

      {!data && !error && <SkeletonCards />}

      {error && (
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
            Couldn't reach the doctor registry
          </p>
          <p className="muted" style={{ margin: "0 0 14px", fontSize: 14 }}>
            Check your connection and try again.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => load(areaOverride ?? undefined)}
            style={{ maxWidth: 200, margin: "0 auto" }}
          >
            <RefreshIcon size={16} />
            Retry
          </button>
        </div>
      )}

      {data && data.doctors.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>No providers found</p>
          <p className="muted" style={{ margin: "0 0 14px", fontSize: 14 }}>
            {specialty
              ? "Try removing the specialty filter or searching a nearby ZIP."
              : "Try a nearby ZIP code or check the spelling."}
          </p>
          {specialty && (
            <Link
              href={removeSpecialtyHref}
              className="btn-primary"
              style={{ maxWidth: 240, margin: "0 auto" }}
            >
              Search without specialty
            </Link>
          )}
        </div>
      )}

      {data && data.doctors.length > 0 && (
        <>
          {specChips.length > 1 && view === "list" && (
            <div className="chips-row">
              <button
                type="button"
                className="chip"
                aria-pressed={specFilter === ""}
                onClick={() => setSpecFilter("")}
              >
                All
              </button>
              {specChips.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  aria-pressed={specFilter === s}
                  onClick={() => setSpecFilter(specFilter === s ? "" : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {view === "list" ? (
            <>
              <p className="muted" style={{ fontSize: 13.5, margin: "4px 0 10px" }}>
                {hasCategory
                  ? `${covered.length} provider${covered.length === 1 ? "" : "s"} near you listed as covered`
                  : `${filtered.length} provider${filtered.length === 1 ? "" : "s"} found`}
              </p>
              {covered.map((d, i) => (
                <DoctorCard key={d.npi} doctor={d} query={detailQuery} index={i} />
              ))}
              {rest.length > 0 && (
                <>
                  {covered.length > 0 && (
                    <p
                      className="muted"
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        margin: "16px 0 8px",
                      }}
                    >
                      Other results near you
                    </p>
                  )}
                  {rest.map((d, i) => (
                    <DoctorCard
                      key={d.npi}
                      doctor={d}
                      query={detailQuery}
                      index={i}
                      dimmed={covered.length > 0}
                    />
                  ))}
                </>
              )}
              {data.hasMore && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ marginTop: 8, opacity: loadingMore ? 0.6 : 1 }}
                >
                  {loadingMore ? "Loading…" : "Load more doctors"}
                </button>
              )}
            </>
          ) : (
            data.center && (
              <ResultsMap
                center={data.center}
                doctors={filtered}
                query={detailQuery}
                onSearchArea={name ? undefined : handleSearchArea}
              />
            )
          )}
        </>
      )}

      <p className="disclaimer" style={{ marginTop: "auto" }}>
        Provider data is from the public NPI registry. Insurance results are
        real where a source is shown; unlabeled results aren't guesses.
      </p>
    </main>
  );
}
