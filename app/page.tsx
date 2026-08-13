import Link from "next/link";
import {
  CheckIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
} from "@/components/Icons";

const STEPS = [
  {
    icon: ShieldCheckIcon,
    title: "Pick ACA Marketplace, Medicare, or other",
    body: "ACA Marketplace and Original Medicare are checked against real government data. Other insurers are labeled not verified — never guessed.",
  },
  {
    icon: MapPinIcon,
    title: "Enter your ZIP code",
    body: "We check real providers near you, live from the US national registry.",
  },
  {
    icon: PhoneIcon,
    title: "Call with confidence",
    body: "See a real coverage result, its source, and when it was checked before you pick up the phone.",
  },
];

export default function Home() {
  return (
    <>
      <main className="screen" style={{ paddingTop: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 34,
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

        <h1 className="fade-up" style={{ fontSize: 30, marginBottom: 12 }}>
          Does that doctor take{" "}
          <span style={{ color: "var(--primary)" }}>your</span> insurance?
        </h1>
        <p
          className="muted fade-up"
          style={{
            fontSize: 16.5,
            margin: "0 0 22px",
            animationDelay: "60ms",
          }}
        >
          Skip the phone tag with front desks. Find nearby doctors who accept
          your plan — in seconds, for free.
        </p>

        <Link
          href="/search"
          className="btn-primary fade-up"
          style={{ animationDelay: "120ms", marginBottom: 30 }}
        >
          <SearchIcon size={18} />
          Start your search
        </Link>

        <div
          className="card fade-up"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 30,
            animationDelay: "180ms",
          }}
        >
          <div className="avatar">SM</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
              Dr. Sarah Mitchell
            </p>
            <p className="muted" style={{ margin: "2px 0 6px", fontSize: 12.5 }}>
              Cardiology · 0.4 mi
            </p>
            <span className="badge-ok">
              <CheckIcon size={13} />
              Listed as covered
            </span>
          </div>
        </div>

        <h2
          style={{
            fontSize: 14,
            color: "var(--muted)",
            fontWeight: 600,
            margin: "0 0 14px",
          }}
        >
          How it works
        </h2>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="fade-up"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 18,
                animationDelay: `${240 + i * 60}ms`,
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "var(--primary-tint)",
                  color: "var(--primary-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <s.icon size={19} />
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15.5 }}>
                  {s.title}
                </p>
                <p
                  className="muted"
                  style={{ margin: "2px 0 0", fontSize: 14 }}
                >
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/search"
          className="btn-primary"
          style={{ marginTop: "auto" }}
        >
          Find doctors near you
        </Link>
      </main>
      <footer className="disclaimer">
        Provider names, specialties, and phone numbers are real, from the
        public US NPI registry. ACA Marketplace and Original Medicare
        coverage checks use real CMS data; other insurers aren't verified.
      </footer>
    </>
  );
}
