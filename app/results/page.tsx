import type { Metadata } from "next";
export const metadata: Metadata = { title: "Doctor Results" };
import { Suspense } from "react";
import ResultsClient from "@/components/ResultsClient";
import SkeletonCards from "@/components/Skeleton";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="screen results-screen">
          <SkeletonCards />
        </main>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
