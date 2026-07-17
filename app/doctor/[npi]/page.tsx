import DoctorProfile from "@/components/DoctorProfile";

export default async function DoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ npi: string }>;
  searchParams: Promise<{ insurance?: string }>;
}) {
  const { npi } = await params;
  const { insurance } = await searchParams;
  return <DoctorProfile npi={npi} insurance={insurance ?? ""} />;
}
