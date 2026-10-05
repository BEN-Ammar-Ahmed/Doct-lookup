import Link from "next/link";
import type { Doctor } from "@/lib/npi";
import type { CoverageDisplay } from "@/lib/coverage";
import { initialsOf } from "@/lib/options";
import { CoverageBadge, CoverageCaption } from "./CoverageBadge";

export default function DoctorCard({ doctor, query }: { doctor: Doctor & { coverage?: CoverageDisplay }; query: string }) {
  const address = [doctor.address1, doctor.city, doctor.state, doctor.zip].filter(Boolean).join(", ");
  return <article className="card doctor-card">
    <div className="avatar" aria-hidden="true">{initialsOf(doctor.name)}</div>
    <div className="doctor-card-text">
      <h2 className="doctor-card-name"><Link href={"/doctor/" + doctor.npi + query}>{doctor.name}</Link></h2>
      <p className="doctor-card-meta">{doctor.specialty}{doctor.distanceMi !== null ? " · approximately " + doctor.distanceMi + " mi" : ""}<br />{address}</p>
      {doctor.addressKind === "mailing" && <p className="coverage-caption">Mailing address on file; practice location not verified.</p>}
      {doctor.coverage ? <><CoverageBadge coverage={doctor.coverage} /><CoverageCaption coverage={doctor.coverage} /></> : <p className="coverage-caption">Insurance participation not verified</p>}
      <p className="coverage-caption">Source: NPPES{doctor.sourceUpdatedAt ? " · Record updated " + doctor.sourceUpdatedAt : ""}</p>
      <div className="doctor-actions">
        {doctor.phone && <a href={"tel:" + doctor.phone.replace(/[^\d+]/g, "")}>Call</a>}
        {doctor.address1 && <a href={"https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(address)} target="_blank" rel="noreferrer">Directions</a>}
        <Link href={"/doctor/" + doctor.npi + query}>View profile</Link>
        <a href={"https://npiregistry.cms.hhs.gov/provider-view/" + doctor.npi} target="_blank" rel="noreferrer">Source record</a>
        <Link href={"/report?npi=" + doctor.npi}>Report incorrect info</Link>
      </div>
    </div>
  </article>;
}
