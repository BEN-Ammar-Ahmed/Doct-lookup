"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketplacePlan } from "@/lib/marketplace";
import { KNOWN_INSURERS } from "@/lib/insurers";
import { SPECIALTIES, US_STATES } from "@/lib/options";
import {
  SearchIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
} from "./Icons";

type Category = "marketplace" | "medicare" | "other";
const CURRENT_YEAR = new Date().getFullYear();
const PLAN_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1];

export default function SearchForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"insurance" | "name">("insurance");
  const [category, setCategory] = useState<Category>("marketplace");
  const [zip, setZip] = useState("");
  const [zipErr, setZipErr] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [docName, setDocName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [docState, setDocState] = useState("");
  const [otherInsurer, setOtherInsurer] = useState("");

  const [planYear, setPlanYear] = useState(CURRENT_YEAR);
  const [plans, setPlans] = useState<MarketplacePlan[] | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [planId, setPlanId] = useState("");
  const [planErr, setPlanErr] = useState("");

  useEffect(() => {
    setPlans(null);
    setPlanId("");
    setPlansError("");
    if (category !== "marketplace" || !/^\d{5}$/.test(zip)) return;
    let cancelled = false;
    setPlansLoading(true);
    fetch(`/api/insurance/marketplace/plans?zip=${zip}&year=${planYear}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setPlans(d.plans ?? []);
        if (!d.plans?.length) setPlansError("No Marketplace plans found for this ZIP and year.");
      })
      .catch((e) => {
        if (cancelled) return;
        setPlansError(
          e.message === "503"
            ? "Insurance verification isn't configured on this site yet."
            : "Couldn't load Marketplace plans right now."
        );
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, zip, planYear]);

  function categoryParams(q: URLSearchParams) {
    q.set("category", category);
    if (category === "marketplace") {
      const plan = plans?.find((p) => p.id === planId);
      q.set("planId", planId);
      if (plan) {
        q.set("planName", plan.name);
        q.set("issuerName", plan.issuerName);
      }
      q.set("planYear", String(planYear));
    }
    if (category === "other" && otherInsurer.trim()) {
      q.set("insurerName", otherInsurer.trim());
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setPlanErr("");
    if (mode === "insurance") {
      if (!/^\d{5}$/.test(zip)) {
        setZipErr("Enter a 5-digit ZIP code");
        return;
      }
      if (category === "marketplace" && !planId) {
        setPlanErr("Select a Marketplace plan to check coverage against");
        return;
      }
      const q = new URLSearchParams({ mode, zip });
      if (specialty) q.set("specialty", specialty);
      categoryParams(q);
      router.push(`/results?${q}`);
    } else {
      if (docName.trim().length < 2) {
        setNameErr("Enter at least 2 letters of the name");
        return;
      }
      if (category === "marketplace" && !planId) {
        setPlanErr("Select a Marketplace plan to check coverage against");
        return;
      }
      const q = new URLSearchParams({ mode, name: docName.trim() });
      if (docState) q.set("state", docState);
      categoryParams(q);
      router.push(`/results?${q}`);
    }
  }

  const categoryPicker = (
    <>
      <label className="lbl" htmlFor="cat">
        Insurance type
      </label>
      <div className="fld">
        <ShieldCheckIcon size={18} className="fld-icon" />
        <select
          id="cat"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          <option value="marketplace">ACA Marketplace plan</option>
          <option value="medicare">Original Medicare</option>
          <option value="other">Other / employer insurance</option>
        </select>
      </div>

      {category === "medicare" && (
        <p className="muted" style={{ fontSize: 12.5, margin: "6px 2px 0" }}>
          Checked against real CMS Medicare enrollment data.
        </p>
      )}

      {category === "other" && (
        <>
          <label className="lbl" htmlFor="otherIns">
            Insurance company{" "}
            <span style={{ fontWeight: 400 }}>(optional — not verified)</span>
          </label>
          <div className="fld">
            <input
              id="otherIns"
              list="known-insurers"
              placeholder="e.g. Aetna"
              value={otherInsurer}
              onChange={(e) => setOtherInsurer(e.target.value)}
            />
          </div>
          <datalist id="known-insurers">
            {KNOWN_INSURERS.map((i) => (
              <option key={i.name} value={i.name} />
            ))}
          </datalist>
          <p className="muted" style={{ fontSize: 12.5, margin: "6px 2px 0" }}>
            This site has no free, verified data source for this category yet
            — results will say "not verified" rather than guess.
          </p>
        </>
      )}
    </>
  );

  const marketplacePicker = category === "marketplace" && (
    <>
      <label className="lbl" htmlFor="planYear">
        Plan year
      </label>
      <div className="fld">
        <select
          id="planYear"
          value={planYear}
          onChange={(e) => setPlanYear(parseInt(e.target.value, 10))}
        >
          {PLAN_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <label className="lbl" htmlFor="plan">
        Exact Marketplace plan
      </label>
      <div className="fld">
        <select
          id="plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          disabled={!plans || plans.length === 0}
        >
          <option value="">
            {plansLoading
              ? "Loading plans…"
              : plans?.length
                ? "Choose your plan"
                : "Enter a ZIP code first"}
          </option>
          {plans?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.issuerName} — {p.name} ({p.metalLevel})
            </option>
          ))}
        </select>
      </div>
      {plansError && <p className="err-text">{plansError}</p>}
      {planErr && <p className="err-text">{planErr}</p>}
    </>
  );

  return (
    <form onSubmit={submit}>
      <div className="pill-toggle" role="tablist" aria-label="Search mode">
        <button
          type="button"
          aria-pressed={mode === "insurance"}
          onClick={() => setMode("insurance")}
        >
          By insurance
        </button>
        <button
          type="button"
          aria-pressed={mode === "name"}
          onClick={() => setMode("name")}
        >
          By doctor name
        </button>
      </div>

      {mode === "insurance" ? (
        <>
          {categoryPicker}

          <label className="lbl" htmlFor="zip">
            ZIP code
          </label>
          <div className="fld">
            <MapPinIcon size={18} className="fld-icon" />
            <input
              id="zip"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              placeholder="60614"
              value={zip}
              onChange={(e) => {
                setZip(e.target.value.replace(/\D/g, ""));
                setZipErr("");
              }}
              aria-invalid={!!zipErr}
            />
          </div>
          {zipErr && <p className="err-text">{zipErr}</p>}

          {marketplacePicker}

          <label className="lbl" htmlFor="spec">
            Specialty <span style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <div className="fld">
            <StethoscopeIcon size={18} className="fld-icon" />
            <select
              id="spec"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              <option value="">Any specialty</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          <label className="lbl" htmlFor="dname">
            Doctor's name
          </label>
          <div className="fld">
            <SearchIcon size={18} className="fld-icon" />
            <input
              id="dname"
              placeholder="e.g. Sarah Mitchell or just Mitchell"
              value={docName}
              onChange={(e) => {
                setDocName(e.target.value);
                setNameErr("");
              }}
              aria-invalid={!!nameErr}
            />
          </div>
          {nameErr && <p className="err-text">{nameErr}</p>}

          <label className="lbl" htmlFor="dstate">
            State <span style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <div className="fld">
            <MapPinIcon size={18} className="fld-icon" />
            <select
              id="dstate"
              value={docState}
              onChange={(e) => setDocState(e.target.value)}
            >
              <option value="">Any state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {categoryPicker}

          {category === "marketplace" && (
            <>
              <label className="lbl" htmlFor="zip2">
                ZIP code <span style={{ fontWeight: 400 }}>(for plan lookup)</span>
              </label>
              <div className="fld">
                <MapPinIcon size={18} className="fld-icon" />
                <input
                  id="zip2"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  placeholder="60614"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              {marketplacePicker}
            </>
          )}
        </>
      )}

      <button type="submit" className="btn-primary" style={{ marginTop: 22 }}>
        <SearchIcon size={18} />
        {mode === "insurance" ? "Find doctors" : "Look up doctor"}
      </button>
    </form>
  );
}
