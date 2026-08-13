import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

describe("CMS Marketplace API key never reaches the client", () => {
  it("is absent from every 'use client' component", () => {
    const files = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))];
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const isClientComponent = content.trimStart().startsWith('"use client"');
      if (isClientComponent && content.includes("CMS_MARKETPLACE_API_KEY")) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("process.env.CMS_MARKETPLACE_API_KEY is only read from lib/marketplace.ts", () => {
    const files = walk(join(ROOT, "lib")).filter((f) => !f.endsWith(".test.ts"));
    const readers = files.filter((f) =>
      readFileSync(f, "utf8").includes("process.env.CMS_MARKETPLACE_API_KEY")
    );
    expect(readers).toEqual([join(ROOT, "lib", "marketplace.ts")]);
  });
});
