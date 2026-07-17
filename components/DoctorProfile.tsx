"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Doctor } from "@/lib/npi";
import { INSURERS, insurerName } from "@/lib/insurers";
import { initialsOf } from "@/lib/options";
import {
  CheckIcon,
  ChevronLeftIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
  XIcon,
} from "./Icons";

const ResultsMap = dynamic(() => import("./ResultsMap"), { ssr: false });

export default function DoctorProfile({
  npi,
  insurance,
}: {
  npi: string;
  insurance: string;
}) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetch(`/api/doctors/${npi}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setDoctor(d.doctor))
      .catch(() => setError(true));
  }, [npi]);

  useEffect(load, [load]);

  const accepted = doctor?.plans ?? [];
  const notAccepted = INSURERS.filter((i) => !accepted.includes(i.id));
  const sortedAccepted = insurance
    ? [...accepted].sort((a, b) =>
        a === insurance ? -1 : b === insurance ? 1 : 0
      )
    : accepted;

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

          <p className="lbl">
            Accepted insurance <span style={{ fontWeight: 400 }}>(demo data)</span>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sortedAccepted.map((id) => (
              <span
                key={id}
                className="badge-ok"
                style={{ fontSize: 13, padding: "6px 11px" }}
              >
                <CheckIcon size={14} />
                {insurerName(id)}
                {insurance === id && " · yours"}
              </span>
            ))}
          </div>

          <p className="lbl">Not accepted</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {notAccepted.map((i) => (
              <span
                key={i.id}
                className="badge-no"
                style={{ fontSize: 13, padding: "6px 11px" }}
              >
                <XIcon size={13} />
                {i.name}
              </span>
            ))}
          </div>

          {doctor.lat !== null && doctor.lng !== null && (
            <div style={{ marginTop: 18 }}>
              <ResultsMap
                center={{ lat: doctor.lat, lng: doctor.lng }}
                doctors={[doctor]}
                insurance={insurance}
              />
            </div>
          )}

          {insurance && !doctor.plans.includes(insurance) && (
            <div
              className="card"
              style={{
                marginTop: 14,
                borderColor: "#f0c9c9",
                background: "var(--danger-bg)",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "var(--danger-ink)" }}>
                This provider doesn't accept {insurerName(insurance)} in our
                demo data.{" "}
                <Link
                  href={`/results?mode=insurance&insurance=${insurance}&zip=${doctor.zip}`}
                  style={{ textDecoration: "underline", fontWeight: 600 }}
                >
                  Find nearby providers who do
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      <p className="disclaimer" style={{ marginTop: "auto" }}>
        Demo — insurance data is illustrative
      </p>
    </main>
  );
}
