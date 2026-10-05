import type { Metadata } from "next";
export const metadata: Metadata = { title: "Find Doctors", ...(process.env.SITE_URL ? { alternates: { canonical: "/search" } } : {}) };
import SearchForm from "@/components/SearchForm";

export default function SearchPage() {
  return (
    <>
      <main className="screen search-screen">

        <section className="search-intro" aria-labelledby="search-title">
          <h1 id="search-title" className="page-heading">
            Build a precise search
          </h1>
          <p className="page-subtitle">
            Choose insurance details when you have them, or search a doctor by
            name and verify coverage from the profile.
          </p>
        </section>

        <section className="surface-panel" aria-label="Detailed search form">
          <SearchForm />
        </section>
      </main>
    </>
  );
}
