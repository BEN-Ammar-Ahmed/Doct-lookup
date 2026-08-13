import Link from "next/link";
import type { Doctor } from "@/lib/npi";
import type { CoverageDisplay } from "@/lib/coverage";
import { initialsOf } from "@/lib/options";
import { ChevronRightIcon } from "./Icons";
import { CoverageBadge, CoverageCaption } from "./CoverageBadge";

export default function DoctorCard({
  doctor,
  index,
  query,
  dimmed = false,
}: {
  doctor: Doctor & { coverage?: CoverageDisplay };
  index: number;
  query: string;
  dimmed?: boolean;
}) {
  const meta = [
    doctor.specialty,
    doctor.distanceMi !== null ? `${doctor.distanceMi} mi` : null,
    doctor.address1 ? `${doctor.address1}, ${doctor.city}` : doctor.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/doctor/${doctor.npi}${query}`}
      className="card pressable fade-up"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginBottom: 10,
        opacity: dimmed ? 0.75 : 1,
        animationDelay: `${Math.min(index, 8) * 40}ms`,
      }}
    >
      <div className="avatar">{initialsOf(doctor.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>
          {doctor.name}
        </p>
        <p className="muted" style={{ margin: "2px 0 6px", fontSize: 13 }}>
          {meta}
        </p>
        {doctor.coverage && (
          <>
            <CoverageBadge coverage={doctor.coverage} />
            <CoverageCaption coverage={doctor.coverage} />
          </>
        )}
      </div>
      <ChevronRightIcon size={18} className="muted" />
    </Link>
  );
}
