import Link from "next/link";

export default function NotFound() {
  return <main className="screen info-screen"><h1>Page not found</h1><p>This address does not lead to a page or valid provider profile.</p><Link className="btn-primary" href="/search">Find a doctor</Link></main>;
}
