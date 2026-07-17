import { NextRequest, NextResponse } from "next/server";
import { fetchNpiByNumber } from "@/lib/npi";
import { zipToLatLng, pinFor } from "@/lib/geo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ npi: string }> }
) {
  const { npi } = await params;
  if (!/^\d{10}$/.test(npi)) {
    return NextResponse.json({ error: "invalid_npi" }, { status: 400 });
  }

  try {
    const doctor = await fetchNpiByNumber(npi);
    if (!doctor) {
      return NextResponse.json({ doctor: null }, { status: 404 });
    }
    const center = await zipToLatLng(doctor.zip);
    if (center) {
      const pin = pinFor(doctor.npi, center);
      doctor.lat = pin.lat;
      doctor.lng = pin.lng;
    }
    return NextResponse.json({ doctor });
  } catch {
    return NextResponse.json({ error: "npi_unavailable" }, { status: 502 });
  }
}
