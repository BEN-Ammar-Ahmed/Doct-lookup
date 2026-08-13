"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Doctor } from "@/lib/npi";
import type { CoverageDisplay } from "@/lib/coverage";
import { homepageFor } from "@/lib/insurers";
import { initialsOf } from "@/lib/options";
import {
  ChevronLeftIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
} from "./Icons";
import { CoverageBadge, CoverageCaption } from "./CoverageBadge";

const ResultsMap = dynamic(() => import("./ResultsMap"), { ssr: false });

type Props = {
  npi: string;
  category: string;
  planId: string;
  planName: string;
  issuerName: string;
  planYear: string;
  insurerName: string;
};

export default function DoctorProfile({
  npi,
  category,
  planId,
  planName,
  issuerName,
  planYear,
  insurerName,
}: Props) {
  const [doctor, setDoctor] = useState<(Doctor & { coverage?: CoverageDisplay }) | null>(null);
  const [error, setError] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (category !== "none") q.set("category", category);
    if (category === "marketplace") {
      q.set("planId", planId);
      q.set("planName", planName);
      q.set("issuerName", issuerName);
      q.set("planYear", planYear);
    }
    if (category === "other" && insurerName) q.set("insurerName", insurerName);
    return q;
  }, [category, planId, planName, issuerName, planYear, insurerName]);

  const load = useCallback(() => {
    setError(false);
    fetch(`/api/doctors/${npi}?${query}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setDoctor(d.doctor))
      .catch(() => setError(true));
  }, [npi, query]);

  useEffect(load, [load]);

  const coverage = doctor?.coverage;
  const directoryUrl = insurerName ? homepageFor(insurerName) : null;

  const findOthersHref = (() => {
    const q = new URLSearchParams(query);
    if (doctor) q.set("zip", doctor.zip);
    return `/results?${q}`;
  })();

  return (
    <main className="screen" style={{ paddingTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => history.back()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 44,
            minHeight: 44,
            background: "none",
            border: "none",
            color: "var(--ink)",
          }}
        >
          <ChevronLeftIcon size={22} />
        </button>
        <span className="muted" style={{ fontSize: 14 }}>
          Provider profile
        </span>
      </div>

      {error && (
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <p style={{ margin: "0 0 14px", fontWeight: 600 }}>
            Couldn't load this provider
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

      {!doctor && !error && (
        <div>
          <div
            className="skeleton"
            style={{ height: 56, width: "70%", marginBottom: 12 }}
          />
          <div className="skeleton" style={{ height: 50, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 90 }} />
        </div>
      )}

      {doctor && (
        <div className="fade-up">
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div
              className="avatar"
              style={{ width: 56, height: 56, fontSize: 17 }}
            >
              {initialsOf(doctor.name)}
            </div>
            <div>
              <h1 style={{ fontSize: 19 }}>{doctor.name}</h1>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                {doctor.specialty} · NPI {doctor.npi}
              </p>
            </div>
          </div>

          {doctor.phone && (
            <a
              href={`tel:${doctor.phone}`}
              className="btn-primary"
              style={{ marginBottom: 10 }}
            >
              <PhoneIcon size={17} />
              Call {doctor.phone}
            </a>
          )}

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              `${doctor.address1}, ${doctor.city}, ${doctor.state} ${doctor.zip}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="card pressable"
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <MapPinIcon size={18} className="fld-icon" />
            <div>
              <p style={{ margin: 0, fontSize: 14.5 }}>{doctor.address1}</p>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 12.5 }}>
                {doctor.city}, {doctor.state} {doctor.zip}
              </p>
            </div>
          </a>

          {coverage && (
            <div className="card" style={{ marginTop: 16 }}>
              <p className="lbl" style={{ margin: "0 0 8px" }}>
                Insurance verification
              </p>
              <CoverageBadge coverage={coverage} size={13.5} />
              {coverage.planName && (
                <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>
                  {coverage.planName}
                  {coverage.issuerName ? ` · ${coverage.issuerName}` : ""}
                  {coverage.planYear ? ` · ${coverage.planYear}` : ""}
                </p>
              )}
              {coverage.accepting && (
                <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
                  New-patient status: {coverage.accepting}
                </p>
              )}
              {coverage.providerAddress && (
                <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
                  Address on file with insurer: {coverage.providerAddress}
                </p>
              )}
              {coverage.note && (
                <p className="muted" style={{ margin: "10px 0 0", fontSize: 12 }}>
                  {coverage.note}
                </p>
              )}
              <CoverageCaption coverage={coverage} />

              {coverage.status === "unsupported" && directoryUrl && (
                <a
                  href={directoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="chip"
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ExternalLinkIcon size={13} />
                  {insurerName}'s provider directory
                </a>
              )}

              {coverage.status === "not_covered" && (
                <Link
                  href={findOthersHref}
                  style={{
                    display: "block",
                    marginTop: 10,
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  Find nearby providers listed as covered
                </Link>
              )}
            </div>
          )}

          {doctor.lat !== null && doctor.lng !== null && (
            <div style={{ marginTop: 18 }}>
              <ResultsMap
                center={{ lat: doctor.lat, lng: doctor.lng }}
                doctors={[doctor]}
                query={`?${query}`}
              />
            </div>
          )}
        </div>
      )}

      <p className="disclaimer" style={{ marginTop: "auto" }}>
        Provider data is from the public NPI registry.
      </p>
    </main>
  );
}
