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
  const [category, setCategory] = useState<Category>("medicare");
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
    setPlansError(""); setPlansLoading(false);
    if (category !== "marketplace" || !/^\d{5}$/.test(zip)) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setPlansLoading(true);
    fetch(`/api/insurance/marketplace/plans?zip=${zip}&year=${planYear}`, { signal: controller.signal })
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
        window.clearTimeout(timeout);
        if (!cancelled) setPlansLoading(false);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout); controller.abort();
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
    <div className="form-group">
      <label className="lbl" htmlFor="cat">
        Insurance type
      </label>
      <div className="fld">
        <ShieldCheckIcon size={18} className="fld-icon" />
        <select
          id="cat"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          <option value="marketplace">ACA Marketplace plan</option>
          <option value="medicare">Original Medicare</option>
          <option value="other">Other / employer insurance</option>
        </select>
      </div>

      {category === "medicare" && (
        <p className="form-note">
          Checked against official Medicare enrollment data.
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
              name="otherInsurer"
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
          <p className="form-note">
            This site has no free, verified data source for this category yet
            — results will say &quot;not verified&quot; rather than guess.
          </p>
        </>
      )}
    </div>
  );

  const marketplacePicker = category === "marketplace" && (
    <div className="form-group">
      <label className="lbl" htmlFor="planYear">
        Plan year
      </label>
      <div className="fld">
        <select
          id="planYear"
          name="planYear"
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
          name="planId"
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
    </div>
  );

  return (
    <form noValidate onSubmit={submit} className="search-form">
      <div className="pill-toggle" role="group" aria-label="Search mode">
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

          <div className="form-group">
            <label className="lbl" htmlFor="zip">
              ZIP code
            </label>
            <div className="fld">
              <MapPinIcon size={18} className="fld-icon" />
              <input
                id="zip"
                name="zip"
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
                aria-describedby={zipErr ? "zip-error" : undefined}
              />
            </div>
            {zipErr && <p id="zip-error" role="alert" className="err-text">{zipErr}</p>}
          </div>

          {marketplacePicker}

          <div className="form-group">
            <label className="lbl" htmlFor="spec">
              Specialty <span style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="fld">
              <StethoscopeIcon size={18} className="fld-icon" />
              <select
                id="spec"
                name="specialty"
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
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <label className="lbl" htmlFor="dname">
              Doctor name
            </label>
            <div className="fld">
              <SearchIcon size={18} className="fld-icon" />
              <input
                id="dname"
                name="doctorName"
                placeholder="e.g. Bozza or a last name"
                value={docName}
                onChange={(e) => {
                  setDocName(e.target.value);
                  setNameErr("");
                }}
                aria-invalid={!!nameErr}
                aria-describedby={nameErr ? "name-error" : undefined}
              />
            </div>
            {nameErr && <p id="name-error" role="alert" className="err-text">{nameErr}</p>}
          </div>

          <div className="form-group">
            <label className="lbl" htmlFor="dstate">
              State <span style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="fld">
              <MapPinIcon size={18} className="fld-icon" />
              <select
                id="dstate"
                name="doctorState"
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
          </div>

          {categoryPicker}

          {category === "marketplace" && (
            <>
              <div className="form-group">
                <label className="lbl" htmlFor="zip2">
                  ZIP code <span style={{ fontWeight: 400 }}>(for plan lookup)</span>
                </label>
                <div className="fld">
                  <MapPinIcon size={18} className="fld-icon" />
                  <input
                    id="zip2"
                    name="planZip"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    placeholder="60614"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              {marketplacePicker}
            </>
          )}
        </>
      )}

      <button type="submit" className="btn-primary search-submit">
        <SearchIcon size={18} />
        {mode === "insurance" ? "Find doctors" : "Look up doctor"}
      </button>
    </form>
  );
}
