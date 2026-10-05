import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon, StethoscopeIcon } from "./Icons";

type AppHeaderProps = {
  backHref?: string;
  backLabel?: string;
  title?: string;
  trailing?: ReactNode;
};

export default function AppHeader({
  backHref,
  backLabel = "Back",
  title = "InsureBased",
  trailing,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      {backHref ? (
        <Link href={backHref} aria-label={backLabel} className="icon-button">
          <ChevronLeftIcon size={18} />
        </Link>
      ) : (
        <Link href="/" aria-label="Homepage" className="brand-link">
          <span className="brand-mark" aria-hidden="true">
            <StethoscopeIcon size={16} />
          </span>
        </Link>
      )}
      <div className="app-header-title">{title}</div>
      {trailing && <div className="app-header-trailing">{trailing}</div>}
    </header>
  );
}
