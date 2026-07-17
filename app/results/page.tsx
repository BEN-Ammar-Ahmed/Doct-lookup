import { Suspense } from "react";
import ResultsClient from "@/components/ResultsClient";
import SkeletonCards from "@/components/Skeleton";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="screen" style={{ paddingTop: 12 }}>
          <SkeletonCards />
        </main>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
