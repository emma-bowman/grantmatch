"use client";

import { useState, useEffect, useCallback } from "react";
import Nav from "@/components/Nav";
import PillToggle from "@/components/PillToggle";
import FilterChip from "@/components/FilterChip";
import GrantCard from "@/components/GrantCard";
import StatsRow from "@/components/StatsRow";
import type { Grant, GrantStatus, Stats, Profile } from "@/lib/types";

const FOCUS_AREAS = [
  "All",
  "Visual art",
  "Photography",
  "Film & video",
  "Performance",
  "Theatre",
  "Dance",
  "Music",
  "Writing & poetry",
  "Craft & making",
  "Digital & new media",
  "Interdisciplinary",
  "Residency",
];

const STATUS_FILTERS: { label: string; value: GrantStatus }[] = [
  { label: "Saved", value: "saved" },
  { label: "Applied", value: "applied" },
  { label: "Awarded", value: "awarded" },
  { label: "Declined", value: "declined" },
];

function profileHasData(p: Profile): boolean {
  return Boolean(p.name || (p.artForms && p.artForms.length > 0) || p.practice);
}

export default function DashboardPage() {
  // Profile gate
  const [profileStatus, setProfileStatus] = useState<"loading" | "empty" | "ready">("loading");

  // Grant data (only fetched when profileStatus === "ready")
  const [grants, setGrants] = useState<Grant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [timeRange, setTimeRange] = useState("All time");
  const [focusFilter, setFocusFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<GrantStatus | "all">("all");
  const [showAll, setShowAll] = useState(false);

  // Step 1: check profile on mount
  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        const data: Profile = await r.json();
        if (!r.ok || !profileHasData(data)) {
          setProfileStatus("empty");
        } else {
          setProfileStatus("ready");
        }
      })
      .catch(() => setProfileStatus("empty"));
  }, []);

  // Step 2: fetch grants + stats only once profile is confirmed non-empty
  const fetchData = useCallback(async () => {
    setGrantsLoading(true);
    setError(null);
    try {
      const [grantsRes, statsRes] = await Promise.all([
        fetch("/api/grants?status=saved&status=applied&status=awarded&status=declined"),
        fetch("/api/stats"),
      ]);
      if (!grantsRes.ok || !statsRes.ok) throw new Error("Failed to load data");
      const [grantsData, statsData] = await Promise.all([
        grantsRes.json(),
        statsRes.json(),
      ]);
      setGrants(grantsData);
      setStats(statsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGrantsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profileStatus === "ready") fetchData();
  }, [profileStatus, fetchData]);

  function handleStatusChange(id: string, newStatus: GrantStatus) {
    setGrants((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
    );
  }

  const filtered = grants.filter((g) => {
    const focusMatch =
      focusFilter === "All" ||
      g.focusAreas.some((f) =>
        f.toLowerCase().includes(focusFilter.toLowerCase())
      );
    const statusMatch = statusFilter === "all" || g.status === statusFilter;
    return focusMatch && statusMatch;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 5);

  const statCards = stats
    ? [
        { label: "Opportunities", value: String(stats.totalMatches), sub: "in your pipeline" },
        { label: "Applied",       value: String(stats.applied),      sub: "in progress" },
        { label: "Received",      value: String(stats.awarded),      sub: "awards & bursaries" },
        { label: "Hit rate",      value: stats.successRate,          sub: "of applications" },
      ]
    : [];

  // ── Empty state: profile not yet completed ─────────────────────────────────
  if (profileStatus === "loading") {
    return (
      <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
        <Nav />
        <main className="max-w-[1100px] mx-auto px-6 md:px-10 pb-24">
          <div className="pt-14">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="grant-card py-5 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (profileStatus === "empty") {
    return (
      <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
        <Nav />
        <main className="max-w-[1100px] mx-auto px-6 md:px-10 pb-24">
          <div className="pt-14 pb-2">
            <h1
              className="text-3xl sm:text-4xl font-normal leading-snug"
              style={{
                fontFamily: "Georgia, 'Playfair Display', serif",
                color: "var(--color-text-primary)",
              }}
            >
              Here&rsquo;s your funding journey so far:
            </h1>
          </div>

          {/* Centred empty state */}
          <div
            className="mt-20 flex flex-col items-center text-center gap-5"
            style={{ maxWidth: 440, margin: "80px auto 0" }}
          >
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(74,92,58,0.1)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2a7 7 0 1 1 0 14A7 7 0 0 1 12 2Zm0 2a5 5 0 1 0 0 10A5 5 0 0 0 12 4Zm0 2a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H9a1 1 0 1 1 0-2h2V9a1 1 0 0 1 1-1Zm0 10c-2.8 0-5.3.9-7.2 2.4A1 1 0 0 1 3.4 19 11 11 0 0 1 12 16c3.2 0 6.1 1.4 8.1 3.5a1 1 0 0 1-1.5 1.3A9 9 0 0 0 12 18Z"
                  fill="#4A5C3A"
                  opacity=".7"
                />
              </svg>
            </div>

            <div>
              <h2
                className="text-xl font-normal"
                style={{
                  fontFamily: "Georgia, 'Playfair Display', serif",
                  color: "var(--color-text-primary)",
                }}
              >
                Complete your profile to find your first matches
              </h2>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                Tell us about your practice, art form, nationality and career stage — then use
                Explore funding to search for real, open opportunities matched to you.
              </p>
            </div>

            <a
              href="/profile"
              className="btn-outline mt-2"
              style={{ textDecoration: "none" }}
            >
              Set up your profile
            </a>
          </div>
        </main>
      </div>
    );
  }

  // ── Normal dashboard (profile exists) ──────────────────────────────────────
  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      <Nav />

      <main className="max-w-[1100px] mx-auto px-6 md:px-10 pb-24">
        {/* Heading */}
        <div className="pt-14 pb-2">
          <h1
            className="text-3xl sm:text-4xl font-normal leading-snug"
            style={{
              fontFamily: "Georgia, 'Playfair Display', serif",
              color: "var(--color-text-primary)",
            }}
          >
            Here&rsquo;s your funding journey so far:
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "var(--color-text-muted)", maxWidth: 520 }}
          >
            Track grants, bursaries and residencies for your practice — from new matches to awards. Use{" "}
            <a
              href="/explore"
              style={{ color: "var(--color-accent)", textDecoration: "none" }}
              className="hover:underline"
            >
              Explore funding
            </a>{" "}
            to find new opportunities with AI-powered search.
          </p>
        </div>

        {/* Time range toggle */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <PillToggle
            options={["All time", "Last year", "By year"]}
            active={timeRange}
            onChange={setTimeRange}
          />
        </div>

        {/* Stats */}
        {grantsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="grant-card py-5 animate-pulse" />
            ))}
          </div>
        ) : (
          <StatsRow stats={statCards} />
        )}

        {/* Filter section */}
        <div
          className="mt-12 mb-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ borderTop: "1px solid var(--color-border)", paddingTop: 24 }}
        >
          <span
            className="text-xs uppercase shrink-0"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}
          >
            Filter
          </span>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => (
              <FilterChip
                key={area}
                label={area}
                selected={focusFilter === area}
                onToggle={() => setFocusFilter(area)}
              />
            ))}
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <FilterChip
            label="All"
            selected={statusFilter === "all"}
            onToggle={() => setStatusFilter("all")}
          />
          {STATUS_FILTERS.map((s) => (
            <FilterChip
              key={s.value}
              label={s.label}
              selected={statusFilter === s.value}
              onToggle={() =>
                setStatusFilter(statusFilter === s.value ? "all" : s.value)
              }
              count={grants.filter((g) => g.status === s.value).length}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-sm text-center py-10 rounded-xl"
            style={{ background: "#F0E8E8", color: "#7A3A3A", border: "1px solid #E8D0D0" }}
          >
            {error} —{" "}
            <button onClick={fetchData} className="underline">retry</button>
          </div>
        )}

        {/* Loading skeletons */}
        {!error && grantsLoading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="grant-card animate-pulse" style={{ height: 120 }} />
            ))}
          </div>
        )}

        {/* No grants yet (profile exists but nothing saved) */}
        {!error && !grantsLoading && grants.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: "var(--color-text-muted)" }}>
            No saved grants yet —{" "}
            <a
              href="/explore"
              style={{ color: "var(--color-accent)", textDecoration: "none" }}
              className="hover:underline"
            >
              explore funding to find your first matches →
            </a>
          </div>
        )}

        {/* Filter returned nothing */}
        {!error && !grantsLoading && grants.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: "var(--color-text-muted)" }}>
            No grants match those filters.
          </div>
        )}

        {/* Grant list */}
        {!error && !grantsLoading && displayed.length > 0 && (
          <div className="flex flex-col gap-4">
            {displayed.map((grant) => (
              <GrantCard
                key={grant.id}
                grant={grant}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* See all / show fewer */}
        {filtered.length > 5 && !showAll && (
          <div className="flex justify-center mt-10">
            <button className="btn-outline" onClick={() => setShowAll(true)}>
              See all {filtered.length} grants
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.6 }}>
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        {showAll && filtered.length > 5 && (
          <div className="flex justify-center mt-10">
            <button className="btn-outline" onClick={() => setShowAll(false)}>Show fewer</button>
          </div>
        )}
      </main>
    </div>
  );
}
