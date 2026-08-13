import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import { ChevronLeftIcon, StethoscopeIcon } from "@/components/Icons";

export default function SearchPage() {
  return (
    <>
      <main className="screen" style={{ paddingTop: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 10,
          }}
        >
          <Link
            href="/"
            aria-label="Back to home"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <ChevronLeftIcon size={22} />
          </Link>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--primary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StethoscopeIcon size={16} />
            </span>
            Doct Lookup
          </span>
        </div>

        <h1 style={{ fontSize: 24, marginBottom: 16 }}>
          Who are we searching for?
        </h1>

        <SearchForm />
      </main>
      <footer className="disclaimer">
        Provider data is from the public NPI registry. ACA Marketplace and
        Original Medicare coverage checks use real CMS data; other insurers
        aren't verified.
      </footer>
    </>
  );
}
