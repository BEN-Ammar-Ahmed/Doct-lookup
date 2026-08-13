"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Doctor } from "@/lib/npi";
import type { LatLng } from "@/lib/geo";
import { coverageMarkerColor, type CoverageDisplay } from "@/lib/coverage";
import { initialsOf } from "@/lib/options";
import { ChevronRightIcon, RefreshIcon } from "./Icons";
import { CoverageBadge } from "./CoverageBadge";

type MapDoctor = Doctor & { coverage?: CoverageDisplay };

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
  query,
  onSearchArea,
}: {
  center: LatLng;
  doctors: MapDoctor[];
  query: string;
  onSearchArea?: (lat: number, lng: number) => void;
}) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selected, setSelected] = useState<MapDoctor | null>(null);
  const [panned, setPanned] = useState(false);

  useEffect(() => {
    if (!mapDiv.current) return;
    setPanned(false);
    const map = L.map(mapDiv.current, { zoomControl: false }).setView(
      [center.lat, center.lng],
      14
    );
    mapRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const pinned = doctors.filter((d) => d.lat !== null && d.lng !== null);
    const colorFor = (d: MapDoctor) => coverageMarkerColor(d.coverage?.status);
    const markers: L.Marker[] = [];
    pinned.forEach((d, di) => {
      const marker = L.marker([d.lat!, d.lng!], {
        icon: pinIcon(colorFor(d), false),
        title: d.name,
      }).addTo(map);
      marker.on("click", () => {
        setSelected(d);
        markers.forEach((m, mi) =>
          m.setIcon(pinIcon(colorFor(pinned[mi]), mi === di))
        );
      });
      markers.push(marker);
    });
    if (markers.length) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
    }

    // Only the initial setView/fitBounds above are programmatic; any
    // movement after the map settles means the user dragged or zoomed.
    let ready = false;
    map.once("moveend", () => {
      ready = true;
    });
    const handleMoveStart = () => {
      if (ready) setPanned(true);
    };
    map.on("movestart", handleMoveStart);

    return () => {
      map.off("movestart", handleMoveStart);
      map.remove();
      mapRef.current = null;
    };
  }, [center, doctors]);

  function handleSearchArea() {
    if (!mapRef.current || !onSearchArea) return;
    const c = mapRef.current.getCenter();
    onSearchArea(c.lat, c.lng);
  }

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
      {panned && onSearchArea && (
        <button
          type="button"
          className="chip"
          onClick={handleSearchArea}
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--primary)",
            borderColor: "var(--primary)",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(38, 36, 32, 0.2)",
          }}
        >
          <RefreshIcon size={13} />
          Search this area
        </button>
      )}
      {doctors.some((d) => d.locationApproximate) && (
        <p
          className="muted"
          style={{ fontSize: 12, textAlign: "center", margin: "8px 0 0" }}
        >
          Approximate location
        </p>
      )}
      {selected && (
        <Link
          href={`/doctor/${selected.npi}${query}`}
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
            {selected.coverage && <CoverageBadge coverage={selected.coverage} />}
          </div>
          <ChevronRightIcon size={18} className="muted" />
        </Link>
      )}
    </div>
  );
}
