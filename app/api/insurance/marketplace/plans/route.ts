import { NextRequest, NextResponse } from "next/server";
import { searchMarketplacePlans, MarketplaceConfigError } from "@/lib/marketplace";
import { isValidZip, isValidPlanYear } from "@/lib/validation";
import { rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const limited = await rateLimitResponse(req, "marketplace-plans");
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const zip = sp.get("zip") ?? "";
  const yearParam = sp.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (!isValidZip(zip)) {
    return NextResponse.json({ error: "invalid_zip" }, { status: 400 });
  }
  if (!isValidPlanYear(year)) {
    return NextResponse.json({ error: "invalid_year" }, { status: 400 });
  }

  try {
    const plans = await searchMarketplacePlans(zip, year);
    return NextResponse.json({ plans });
  } catch (err) {
    if (err instanceof MarketplaceConfigError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "marketplace_unavailable" }, { status: 502 });
  }
}
