import Link from "next/link";
import type { Doctor } from "@/lib/npi";
import { insurerName } from "@/lib/insurers";
import { initialsOf } from "@/lib/options";
import { CheckIcon, ChevronRightIcon, XIcon } from "./Icons";

export default function DoctorCard({
  doctor,
  insurance,
  index,
  dimmed = false,
}: {
  doctor: Doctor;
  insurance: string;
  index: number;
  dimmed?: boolean;
}) {
  const accepts = insurance && doctor.plans.includes(insurance);
  const meta = [
    doctor.specialty,
    doctor.distanceMi !== null ? `${doctor.distanceMi} mi` : null,
    doctor.address1 ? `${doctor.address1}, ${doctor.city}` : doctor.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/doctor/${doctor.npi}${insurance ? `?insurance=${insurance}` : ""}`}
      className="card pressable fade-up"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginBottom: 10,
        opacity: dimmed ? 0.55 : 1,
        animationDelay: `${Math.min(index, 8) * 40}ms`,
      }}
    >
      <div className="avatar">{initialsOf(doctor.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>
          {doctor.name}
        </p>
        <p
          className="muted"
          style={{ margin: "2px 0 6px", fontSize: 13 }}
        >
          {meta}
        </p>
        {accepts ? (
          <span className="badge-ok">
            <CheckIcon size={13} />
            Accepts {insurerName(insurance)}
          </span>
        ) : (
          insurance && (
            <span className="badge-no">
              <XIcon size={13} />
              Not in network
            </span>
          )
        )}
      </div>
      <ChevronRightIcon size={18} className="muted" />
    </Link>
  );
}
