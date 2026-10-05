"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Doctor } from "@/lib/npi";
import type { CoverageDisplay } from "@/lib/coverage";
import { homepageFor } from "@/lib/insurers";
import { initialsOf } from "@/lib/options";
import LazyResultsMap from "./LazyResultsMap";
import {
  ChevronLeftIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
} from "./Icons";
import { CoverageBadge, CoverageCaption } from "./CoverageBadge";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    setError(null); setDoctor(null); setLoading(true);
    fetch("/api/doctors/" + npi + "?" + query, { signal: AbortSignal.timeout(45000) })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "not_found" : "unavailable");
        return r.json();
      })
      .then((d) => setDoctor(d.doctor))
      .catch((e) => setError(e.message === "not_found" ? "Provider not found" : "Provider records are unavailable. Try again shortly."))
      .finally(() => setLoading(false));
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
    <main className="screen profile-screen">
      <div className="app-header">
        <button
          type="button"
          aria-label="Back"
          onClick={() => history.back()}
          className="icon-button"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <span className="app-header-title">Provider profile</span>
      </div>

      {error && (
        <div className="card empty-card">
          <p className="empty-card-title">
            {error}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={load}
          >
            <RefreshIcon size={16} />
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="profile-skeleton">
          <div
            className="skeleton"
            style={{ height: 56, width: "70%" }}
          />
          <div className="skeleton" style={{ height: 50 }} />
          <div className="skeleton" style={{ height: 90 }} />
        </div>
      )}

      {doctor && (
        <div className="profile-stack">
          <section className="profile-hero-card">
            <div className="avatar profile-avatar">
              {initialsOf(doctor.name)}
            </div>
            <div className="doctor-card-text">
              <h1 className="profile-title">{doctor.name}</h1>
              <p className="profile-meta">{doctor.specialty}</p>
            </div>
          </section>

          <div className="profile-action-stack">
          {doctor.addressKind === "mailing" && <p className="profile-note">This is a mailing address. Confirm the practice location before traveling.</p>}
          {doctor.phone && (
            <a
              href={`tel:${doctor.phone}`}
              className="btn-primary"
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
            className="card pressable detail-link-card"
          >
            <MapPinIcon size={18} className="fld-icon" />
            <div className="doctor-card-text">
              <p className="detail-link-title">{doctor.address1}</p>
              <p className="detail-link-meta">
                {doctor.city}, {doctor.state} {doctor.zip}
              </p>
            </div>
          </a>
          </div>

          <section className="card"><h2 className="profile-card-title">Public record</h2><p>NPI: {doctor.npi}</p><p className="profile-note">NPPES / NPI Registry{doctor.sourceUpdatedAt ? " · Record updated " + doctor.sourceUpdatedAt : ""}</p><p className="profile-note">Address matches are approximate and may not identify a building entrance. Confirm the office before traveling.</p><div className="doctor-actions"><a href={"https://npiregistry.cms.hhs.gov/provider-view/" + doctor.npi} target="_blank" rel="noreferrer">View source record</a><Link href={"/report?npi=" + doctor.npi}>Report incorrect info</Link></div></section>
          {doctor.practiceLocations && doctor.practiceLocations.length > 1 && <section className="card"><h2 className="profile-card-title">Practice locations on file</h2>{doctor.practiceLocations.map((location, index) => <p key={index}>{location.address1}, {location.city}, {location.state} {location.zip}{location.phone && <a className="text-action-link" href={"tel:" + location.phone.replace(/[^\d+]/g, "")}>Call this office</a>}</p>)}</section>}
          {!coverage && <section className="card"><h2 className="profile-card-title">Insurance participation not verified</h2><p>Confirm your exact plan and service with the office and insurer.</p></section>}
          {coverage && (
            <div className="card coverage-card">
              <p className="profile-card-title">
                Insurance verification
              </p>
              <CoverageBadge coverage={coverage} size={13.5} />
              {coverage.planName && (
                <p className="profile-plan">
                  {coverage.planName}
                  {coverage.issuerName ? ` · ${coverage.issuerName}` : ""}
                  {coverage.planYear ? ` · ${coverage.planYear}` : ""}
                </p>
              )}
              {coverage.accepting && (
                <p className="profile-note">
                  New-patient status: {coverage.accepting}
                </p>
              )}
              {coverage.providerAddress && (
                <p className="profile-note">
                  Address on file with insurer: {coverage.providerAddress}
                </p>
              )}
              {coverage.note && (
                <p className="profile-note">
                  {coverage.note}
                </p>
              )}
              <CoverageCaption coverage={coverage} />

              {coverage.status === "unsupported" && directoryUrl && (
                <a
                  href={directoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="chip inline-chip-link"
                >
                  <ExternalLinkIcon size={13} />
                  {insurerName} provider directory
                </a>
              )}

              {coverage.status === "not_covered" && (
                <Link
                  href={findOthersHref}
                  className="text-action-link"
                >
                  Find nearby providers listed as covered
                </Link>
              )}
            </div>
          )}

          {doctor.lat !== null && doctor.lng !== null && (
            <div className="profile-map-panel">
              <LazyResultsMap
                center={{ lat: doctor.lat, lng: doctor.lng }}
                doctors={[doctor]}
                query={`?${query}`}
              />
            </div>
          )}
        </div>
      )}

      <p className="disclaimer screen-footer">
        Provider details come from public records.
      </p>
    </main>
  );
}
