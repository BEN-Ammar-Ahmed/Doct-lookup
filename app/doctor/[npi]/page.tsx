import { notFound } from "next/navigation";
import { isValidNpi } from "@/lib/validation";
import DoctorProfile from "@/components/DoctorProfile";

export default async function DoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ npi: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { npi } = await params;
  if (!isValidNpi(npi)) notFound();
  const sp = await searchParams;
  return (
    <DoctorProfile
      npi={npi}
      category={sp.category ?? "none"}
      planId={sp.planId ?? ""}
      planName={sp.planName ?? ""}
      issuerName={sp.issuerName ?? ""}
      planYear={sp.planYear ?? ""}
      insurerName={sp.insurerName ?? ""}
    />
  );
}
