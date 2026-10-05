"use client";
import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body style={{ fontFamily: "system-ui", padding: "2rem" }}><h1>InsureBased could not load</h1><p>Try again or return to the homepage.</p><button onClick={reset}>Try again</button><p><Link href="/">Homepage</Link></p></body></html>;
}
