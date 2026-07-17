"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Doctor } from "@/lib/npi";
import type { LatLng } from "@/lib/geo";
import { insurerName } from "@/lib/insurers";
import { initialsOf } from "@/lib/options";
import { CheckIcon, ChevronRightIcon } from "./Icons";

function pinIcon(color: string, selected: boolean) {
  const s = selected ? 38 : 30;
  return L.divIcon({
    className: "pin-icon",
    html: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/></svg>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s - 2],
  });
}

export default function ResultsMap({
  center,
  doctors,
  insurance,
}: {
  center: LatLng;
  doctors: Doctor[];
  insurance: string;
}) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Doctor | null>(null);

  useEffect(() => {
    if (!mapDiv.current) return;
    const map = L.map(mapDiv.current, { zoomControl: false }).setView(
      [center.lat, center.lng],
      14
    );
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const pinned = doctors.filter((d) => d.lat !== null && d.lng !== null);
    const markers: L.Marker[] = [];
    pinned.forEach((d, di) => {
      const marker = L.marker([d.lat!, d.lng!], {
        icon: pinIcon("#0891B2", false),
        title: d.name,
      }).addTo(map);
      marker.on("click", () => {
        setSelected(d);
        markers.forEach((m, mi) =>
          m.setIcon(pinIcon(mi === di ? "#059669" : "#0891B2", mi === di))
        );
      });
      markers.push(marker);
    });
    if (markers.length) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
    }
    return () => {
      map.remove();
    };
  }, [center, doctors]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapDiv}
        style={{
          height: "56dvh",
          minHeight: 320,
          borderRadius: "var(--radius)",
          border: "1px solid var(--line)",
          zIndex: 0,
        }}
      />
      <p
        className="muted"
        style={{ fontSize: 12, textAlign: "center", margin: "8px 0 0" }}
      >
        Pin locations are approximate
      </p>
      {selected && (
        <Link
          href={`/doctor/${selected.npi}${insurance ? `?insurance=${insurance}` : ""}`}
          className="card pressable fade-up"
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 34,
            display: "flex",
            gap: 10,
            alignItems: "center",
            zIndex: 1000,
            boxShadow: "0 4px 16px rgba(22, 78, 99, 0.15)",
          }}
        >
          <div className="avatar">{initialsOf(selected.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5 }}>
              {selected.name}
            </p>
            <p className="muted" style={{ margin: "2px 0 4px", fontSize: 12.5 }}>
              {selected.specialty}
              {selected.distanceMi !== null && ` · ${selected.distanceMi} mi`}
            </p>
            {insurance && selected.plans.includes(insurance) && (
              <span className="badge-ok">
                <CheckIcon size={13} />
                Accepts {insurerName(insurance)}
              </span>
            )}
          </div>
          <ChevronRightIcon size={18} className="muted" />
        </Link>
      )}
    </div>
  );
}
