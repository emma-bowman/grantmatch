"use client";

import { useState, useRef, useEffect } from "react";
import Nav from "@/components/Nav";
import GrantCard from "@/components/GrantCard";
import type { Grant, GrantStatus, Profile } from "@/lib/types";

const EXAMPLE_QUERIES = [
  "Development grants for emerging visual artists in the UK",
  "Fellowships and bursaries for writers and poets",
  "Film production grants for early-career filmmakers",
  "Artist residencies with stipends in the UK or Europe",
  "Funding for disabled artists and disability arts practice",
  "Travel grants for UK artists working internationally",
  "Music composition and sound art awards",
  "Grants for artists from the global majority",
];

// Check whether a profile has enough data to meaningfully improve search results.
function profileIsEmpty(p: Partial<Profile> | null): boolean {
  if (!p) return true;
  return !p.name && (!p.artForms || p.artForms.length === 0) && !p.practice;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);

  // Prevent stale results from a slow previous request overwriting a newer one.
  const searchGenRef = useRef(0);

  // Track elapsed seconds while loading to show a retry message after ~20s.
  useEffect(() => {
    if (!loading) {
      setLoadingSeconds(0);
      return;
    }
    const interval = setInterval(() => setLoadingSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // Load profile silently to check if it's been filled in.
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProfile(data))
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent | null, overrideQuery?: string) {
    e?.preventDefault();
    const q = (overrideQuery ?? query).trim();
    if (!q) return;

    // Bump generation — any in-flight older request will ignore its result.
    const gen = ++searchGenRef.current;

    setLoading(true);
    setError(null);
    setResults([]);       // clear immediately so stale results never show
    setSearched(true);
    setLastQuery(q);
    if (overrideQuery) setQuery(overrideQuery);

    try {
      const res = await fetch("/api/grants/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      // If a newer search has started, discard this response entirely.
      if (gen !== searchGenRef.current) return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Search failed (${res.status})`);

      setResults(data);
    } catch (e) {
      if (gen !== searchGenRef.current) return;
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      if (gen === searchGenRef.current) setLoading(false);
    }
  }

  function handleSearchAgain() {
    setResults([]);
    setSearched(false);
    setError(null);
    setLastQuery(null);
  }

  function handleStatusChange(id: string, newStatus: GrantStatus) {
    setResults((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
    );
  }

  const showProfileNudge = profileIsEmpty(profile) && !loading;

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      <Nav />

      <main className="max-w-[1100px] mx-auto px-6 md:px-10 pb-24">
        {/* Heading */}
        <div className="pt-14 pb-8">
          <h1
            className="text-3xl sm:text-4xl font-normal leading-snug"
            style={{
              fontFamily: "Georgia, 'Playfair Display', serif",
              color: "var(--color-text-primary)",
            }}
          >
            Find funding for your practice
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "var(--color-text-muted)", maxWidth: 560 }}
          >
            Describe what you&rsquo;re looking for. The AI searches the web for real, currently
            open grants, bursaries, fellowships and residencies for individual artists — matched
            to your{" "}
            <a
              href="/profile"
              style={{ color: "var(--color-accent)", textDecoration: "none" }}
              className="hover:underline"
            >
              artist profile
            </a>
            .
          </p>
        </div>

        {/* Profile nudge */}
        {showProfileNudge && (
          <div
            className="mb-6 text-sm p-4 rounded-xl flex items-start gap-3"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1.4 }}>💡</span>
            <span style={{ color: "var(--color-text-label)" }}>
              <a
                href="/profile"
                style={{ color: "var(--color-accent)", textDecoration: "none" }}
                className="hover:underline font-medium"
              >
                Complete your artist profile
              </a>{" "}
              first — adding your art form, career stage, nationality and practice description
              significantly improves matching.
            </span>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. development grants for emerging painters in London"
            className="flex-1 rounded-full px-5 py-3 text-sm"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              fontFamily: "Inter, system-ui, sans-serif",
              outline: "none",
            }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-outline shrink-0"
            style={{ opacity: loading || !query.trim() ? 0.55 : 1 }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="20"
                    strokeDashoffset="10"
                  />
                </svg>
                Searching…
              </span>
            ) : (
              "Find funding"
            )}
          </button>
        </form>

        {/* Example queries — shown before first search */}
        {!searched && (
          <div className="mt-6">
            <span
              className="text-xs uppercase mr-3"
              style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}
            >
              Try
            </span>
            <div className="inline-flex flex-wrap gap-2 mt-2">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSearch(null, q)}
                  className="filter-chip"
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-12">
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              {loadingSeconds >= 20
                ? "High demand — retrying in a moment…"
                : "Searching for funding opportunities… this takes 15–30 seconds while the AI scans real grant pages."}
            </p>
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="grant-card animate-pulse"
                  style={{ height: 110 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            className="mt-8 text-sm p-5 rounded-xl"
            style={{
              background: "#F0E8E8",
              color: "#7A3A3A",
              border: "1px solid #E8D0D0",
            }}
          >
            <strong>Search failed:</strong> {error}
            {error.includes("ANTHROPIC_API_KEY") && (
              <p className="mt-2 text-xs" style={{ color: "#7A3A3A" }}>
                Copy <code>.env.local.example</code> to <code>.env.local</code> and add
                your API key from{" "}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  console.anthropic.com
                </a>
                .
              </p>
            )}
            <button
              onClick={handleSearchAgain}
              className="mt-3 btn-outline text-xs px-4 py-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="mt-10">
            <div
              className="flex items-center justify-between mb-6"
              style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 16 }}
            >
              <div>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {results.length} opportunities found for &ldquo;{lastQuery}&rdquo;
                  {" — "}added to your dashboard. Hit &ldquo;Save&rdquo; to start tracking.
                </p>
              </div>
              <button
                onClick={handleSearchAgain}
                className="btn-outline text-xs px-4 py-2 shrink-0 ml-4"
              >
                Search again
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {results.map((grant) => (
                <GrantCard
                  key={grant.id}
                  grant={grant}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <button onClick={handleSearchAgain} className="btn-outline">
                New search
              </button>
            </div>
          </div>
        )}

        {/* Searched, no results */}
        {!loading && searched && results.length === 0 && !error && (
          <div
            className="text-center py-16 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            <p>No results returned for &ldquo;{lastQuery}&rdquo;.</p>
            <p className="mt-2">
              Try rephrasing your query, or{" "}
              <a
                href="/profile"
                style={{ color: "var(--color-accent)", textDecoration: "none" }}
                className="hover:underline"
              >
                complete your artist profile
              </a>{" "}
              for better matching.
            </p>
            <button
              onClick={handleSearchAgain}
              className="btn-outline mt-6"
            >
              Search again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
