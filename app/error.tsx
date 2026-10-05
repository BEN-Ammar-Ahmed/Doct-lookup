"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="screen info-screen"><h1>This page could not load</h1><p>Your search may be temporarily unavailable. Try again, or start a new search.</p><button className="btn-primary" onClick={reset}>Try again</button><a className="text-action-link" href="/search">Start a new search</a></main>;
}
