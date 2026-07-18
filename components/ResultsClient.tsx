"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { Doctor } from "@/lib/npi";
import type { LatLng } from "@/lib/geo";
import { insurerName } from "@/lib/insurers";
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

type ApiData = { center: LatLng | null; doctors: Doctor[] };

export default function ResultsClient() {
  const sp = useSearchParams();
  const insurance = sp.get("insurance") ?? "";
  const zip = sp.get("zip") ?? "";
  const specialty = sp.get("specialty") ?? "";
  const name = sp.get("name") ?? "";
  const state = sp.get("state") ?? "";

  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [specFilter, setSpecFilter] = useState("");

  const load = useCallback(() => {
    setError(false);
    setData(null);
    const q = new URLSearchParams();
    if (zip) q.set("zip", zip);
    if (specialty) q.set("specialty", specialty);
    if (insurance) q.set("insurance", insurance);
    if (name) q.set("name", name);
    if (state) q.set("state", state);
    fetch(`/api/doctors/search?${q}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [zip, specialty, insurance, name, state]);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return specFilter
      ? data.doctors.filter((d) => d.specialty === specFilter)
      : data.doctors;
  }, [data, specFilter]);

  const matches = useMemo(
    () =>
      insurance ? filtered.filter((d) => d.plans.includes(insurance)) : filtered,
    [filtered, insurance]
  );
  const others = useMemo(
    () =>
      insurance ? filtered.filter((d) => !d.plans.includes(insurance)) : [],
    [filtered, insurance]
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

  const summary = name
    ? `"${name}"${state ? ` · ${state}` : ""}`
    : `${insurerName(insurance)} · ${zip}`;

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
            onClick={load}
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
              href={`/results?mode=insurance&insurance=${insurance}&zip=${zip}`}
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
                {insurance
                  ? `${matches.length} provider${matches.length === 1 ? "" : "s"} near you accept${matches.length === 1 ? "s" : ""} ${insurerName(insurance)}`
                  : `${filtered.length} provider${filtered.length === 1 ? "" : "s"} found`}
              </p>
              {matches.map((d, i) => (
                <DoctorCard key={d.npi} doctor={d} insurance={insurance} index={i} />
              ))}
              {others.length > 0 && (
                <>
                  <p
                    className="muted"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      margin: "16px 0 8px",
                      textTransform: "none",
                    }}
                  >
                    Nearby, but different insurance
                  </p>
                  {others.map((d, i) => (
                    <DoctorCard
                      key={d.npi}
                      doctor={d}
                      insurance={insurance}
                      index={i}
                      dimmed
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            data.center && (
              <ResultsMap
                center={data.center}
                doctors={matches}
                insurance={insurance}
              />
            )
          )}
        </>
      )}

      <p className="disclaimer" style={{ marginTop: "auto" }}>
        Demo — insurance data is illustrative
      </p>
    </main>
  );
}
