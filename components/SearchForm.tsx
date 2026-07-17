"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INSURERS } from "@/lib/insurers";
import { SPECIALTIES, US_STATES } from "@/lib/options";
import {
  SearchIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
} from "./Icons";

export default function SearchForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"insurance" | "name">("insurance");
  const [insurance, setInsurance] = useState("bcbs");
  const [zip, setZip] = useState("");
  const [zipErr, setZipErr] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [docName, setDocName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [docState, setDocState] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "insurance") {
      if (!/^\d{5}$/.test(zip)) {
        setZipErr("Enter a 5-digit ZIP code");
        return;
      }
      const q = new URLSearchParams({ mode, insurance, zip });
      if (specialty) q.set("specialty", specialty);
      router.push(`/results?${q}`);
    } else {
      if (docName.trim().length < 2) {
        setNameErr("Enter at least 2 letters of the name");
        return;
      }
      const q = new URLSearchParams({ mode, name: docName.trim() });
      if (docState) q.set("state", docState);
      if (insurance) q.set("insurance", insurance);
      router.push(`/results?${q}`);
    }
  }

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
          <label className="lbl" htmlFor="ins">
            Your insurance
          </label>
          <div className="fld">
            <ShieldCheckIcon size={18} className="fld-icon" />
            <select
              id="ins"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
            >
              {INSURERS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

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

          <label className="lbl" htmlFor="ins2">
            Compare against your insurance
          </label>
          <div className="fld">
            <ShieldCheckIcon size={18} className="fld-icon" />
            <select
              id="ins2"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
            >
              {INSURERS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <button type="submit" className="btn-primary" style={{ marginTop: 22 }}>
        <SearchIcon size={18} />
        {mode === "insurance" ? "Find doctors" : "Look up doctor"}
      </button>
    </form>
  );
}
