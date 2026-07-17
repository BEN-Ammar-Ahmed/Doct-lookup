import SearchForm from "@/components/SearchForm";
import { StethoscopeIcon } from "@/components/Icons";

export default function Home() {
  return (
    <>
      <main className="screen">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "var(--primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StethoscopeIcon size={18} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 17,
            }}
          >
            Doct Lookup
          </span>
        </div>

        <h1 style={{ fontSize: 26, marginBottom: 18 }}>
          Find doctors who take your insurance
        </h1>

        <SearchForm />
      </main>
      <footer className="disclaimer">
        Demo project — insurance data is illustrative, provider data is from
        the public NPI registry.
      </footer>
    </>
  );
}
