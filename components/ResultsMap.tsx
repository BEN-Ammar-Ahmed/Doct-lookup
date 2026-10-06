"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Doctor } from "@/lib/npi";
import type { LatLng } from "@/lib/geo";
import { locationPrecisionLabel } from "@/lib/maps";
import { coverageMarkerColor, type CoverageDisplay } from "@/lib/coverage";
import { initialsOf } from "@/lib/options";
import { ChevronRightIcon, RefreshIcon } from "./Icons";
import { CoverageBadge } from "./CoverageBadge";
import { PrimaryDirectionsLink } from "./DirectionsLinks";

type MapDoctor = Doctor & { coverage?: CoverageDisplay };

function pinIcon(color: string, selected: boolean, approximate: boolean) {
  const s = selected ? 36 : 22;
  return L.divIcon({
    className: "map-provider-pin-wrap",
    html: `<span class="map-provider-pin${selected ? " is-selected" : ""}${approximate ? " is-approximate" : ""}" style="--pin-color:${color}" aria-hidden="true"><span class="map-provider-pin-core"></span></span>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

export default function ResultsMap({
  center,
  doctors,
  query,
  refiningLocations = false,
  onSearchArea,
}: {
  center: LatLng;
  doctors: MapDoctor[];
  query: string;
  refiningLocations?: boolean;
  onSearchArea?: (lat: number, lng: number) => void;
}) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const pannedRef = useRef(false);
  const [selected, setSelected] = useState<MapDoctor | null>(null);
  const [panned, setPanned] = useState(false);

  useEffect(() => {
    if (!mapDiv.current) return;
    setPanned(false);
    pannedRef.current = false;
    setSelected(null);
    const map = L.map(mapDiv.current, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    }).setView([center.lat, center.lng], 14);
    mapRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    let ready = false;
    map.once("moveend", () => { ready = true; });
    const handleMoveStart = () => {
      if (ready) {
        pannedRef.current = true;
        setPanned(true);
      }
    };
    map.on("movestart", handleMoveStart);

    return () => {
      map.off("movestart", handleMoveStart);
      markerLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerLayerRef.current?.remove();

    const layer = L.layerGroup().addTo(map);
    markerLayerRef.current = layer;

    const pinned = doctors.filter((d) => d.lat !== null && d.lng !== null);
    const colorFor = (d: MapDoctor) => coverageMarkerColor(d.coverage?.status);
    const markers: L.Marker[] = [];
    pinned.forEach((d) => {
      const isSelected = selected?.npi === d.npi;
      const approximate = d.locationPrecision === "zip" || d.locationApproximate;
      const marker = L.marker([d.lat!, d.lng!], {
        title: `${d.name} — ${locationPrecisionLabel(d)}`,
        alt: d.name,
        icon: pinIcon(colorFor(d), isSelected, approximate),
        keyboard: true,
      }).addTo(layer);
      marker.on("click", () => setSelected(d));
      markers.push(marker);
    });

    if (markers.length && !pannedRef.current) {
      const bounds = L.featureGroup(markers).getBounds().pad(0.22);
      map.fitBounds(bounds, { maxZoom: markers.length === 1 ? 15 : 17 });
    }
  }, [doctors, selected?.npi]);

  useEffect(() => {
    if (!selected) return;
    const updated = doctors.find((doctor) => doctor.npi === selected.npi);
    if (updated && updated !== selected) setSelected(updated);
  }, [doctors, selected]);

  function handleSearchArea() {
    if (!mapRef.current || !onSearchArea) return;
    const c = mapRef.current.getCenter();
    onSearchArea(c.lat, c.lng);
  }

  const pinnedCount = doctors.filter(d => d.lat !== null && d.lng !== null).length;
  const addressLevelCount = doctors.filter(d => d.lat !== null && d.lng !== null && d.locationPrecision === "address").length;

  return (
    <div className="results-map-shell">
      <div ref={mapDiv} className="results-map-canvas" />
      <div className="map-legend" aria-label="Map legend">
        <span><i className="map-legend-pin" /> Address-level pin</span>
        <span><i className="map-legend-pin map-legend-pin-approx" /> Approximate pin</span>
      </div>
      {refiningLocations && (
        <p className="map-refine-status" role="status"><span aria-hidden="true" />Refining pins</p>
      )}
      {panned && onSearchArea && (
        <button type="button" className="map-area-button" onClick={handleSearchArea}>
          <RefreshIcon size={13} />
          Search this area
        </button>
      )}
      <p className="map-accuracy-note">
        {pinnedCount} of {doctors.length} loaded providers mapped · {addressLevelCount} address-level. Pins come from public practice addresses and may not mark an entrance.
      </p>
      {selected && (
        <div className="map-selected-provider" role="region" aria-label={`Selected provider: ${selected.name}`}>
          <div className="avatar">{initialsOf(selected.name)}</div>
          <div className="doctor-card-text">
            <p className="doctor-card-name"><Link href={`/doctor/${selected.npi}${query}`}>{selected.name}</Link></p>
            <p className="doctor-card-meta">{selected.specialty}{selected.distanceMi !== null && ` · ${selected.distanceMi} mi`}</p>
            <p className="location-confidence">{locationPrecisionLabel(selected)}</p>
            {selected.coverage && <CoverageBadge coverage={selected.coverage} />}
            <div className="map-selected-actions">
              <PrimaryDirectionsLink doctor={selected} />
              <Link href={`/doctor/${selected.npi}${query}`}>View profile <ChevronRightIcon size={14} /></Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
