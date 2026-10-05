"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SPECIALTIES } from "@/lib/options";
import { MapPinIcon } from "./Icons";

export default function HomeSearch() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [zip, setZip] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [category, setCategory] = useState("none");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  function navigate(location: Record<string, string>) {
    const query = new URLSearchParams({ ...location, specialty, category });
    router.push("/results?" + query);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setError("Enter a five-digit US ZIP code."); return; }
    setError("");
    if (category === "marketplace") { router.push("/search"); return; }
    navigate({ zip });
  }
  function locate() {
    if (!navigator.geolocation) { setError("Location is unavailable. Enter a ZIP code instead."); return; }
    setError(""); setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocating(false); navigate({ lat: coords.latitude.toFixed(5), lng: coords.longitude.toFixed(5) }); },
      () => { setLocating(false); setError("Location was blocked or timed out. Enter a ZIP code instead."); },
      { timeout: 8000, maximumAge: 300000 }
    );
  }
  return <section className="home-search-card" aria-labelledby="home-search-title">
    <div className="home-search-header"><h2 id="home-search-title">Find doctors near you</h2><p className="home-search-helper">No account required. Confirm coverage and availability before your visit.</p></div>
    <form className="home-quick-form" data-ready={ready} onSubmit={submit} noValidate>
      <div><label className="lbl" htmlFor="home-zip">ZIP code</label><div className="fld"><input id="home-zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} placeholder="e.g. 60614" value={zip} onChange={e => { setZip(e.target.value.replace(/\D/g, "")); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "home-search-error" : undefined} /></div></div>
      <div><label className="lbl" htmlFor="home-insurance">Insurance check</label><div className="fld"><select id="home-insurance" value={category} onChange={e => setCategory(e.target.value)}><option value="none">No coverage check</option><option value="medicare">Original Medicare</option><option value="other">Other insurance · not verified</option><option value="marketplace">ACA · choose exact plan</option></select></div></div>
      <div><label className="lbl" htmlFor="home-specialty">Specialty</label><div className="fld"><select id="home-specialty" value={specialty} onChange={e => setSpecialty(e.target.value)}><option value="">Any specialty</option>{SPECIALTIES.map(s => <option key={s}>{s}</option>)}</select></div></div>
      <button type="submit" className="btn-primary">{category === "marketplace" ? "Choose a plan" : "Find doctors"}</button>
    </form>
    {error && <p id="home-search-error" className="err-text" role="alert">{error}</p>}
    <div className="home-search-secondary">
      <button className="home-locate-button" type="button" disabled={locating || category === "marketplace"} aria-busy={locating} onClick={locate}><MapPinIcon size={16} />{locating ? "Finding your location…" : "Use my location"}</button>
      <Link className="home-insurance-link" href="/search">Search by name or exact ACA plan</Link>
    </div>
  </section>;
}
