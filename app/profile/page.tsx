"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import type { Profile } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const ART_FORMS = [
  "Visual art",
  "Painting",
  "Sculpture",
  "Photography",
  "Film & video",
  "Animation",
  "Performance art",
  "Live art",
  "Theatre & drama",
  "Dance & choreography",
  "Music & composition",
  "Sound art",
  "Writing & literature",
  "Poetry",
  "Illustration",
  "Comics & graphic narrative",
  "Craft & making",
  "Ceramics",
  "Textiles & fashion",
  "Architecture & spatial practice",
  "Digital & new media",
  "Interdisciplinary",
  "Socially engaged practice",
  "Curatorial practice",
];

const CAREER_STAGES = [
  { value: "", label: "Select…" },
  { value: "emerging", label: "Emerging (0–5 years)" },
  { value: "mid-career", label: "Mid-career (5–15 years)" },
  { value: "established", label: "Established (15+ years)" },
];

const DISABILITY_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "yes", label: "Yes, I identify as a disabled artist" },
  { value: "no", label: "No" },
  { value: "prefer not to say", label: "Prefer not to say" },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 14,
  color: "var(--color-text-primary)",
  fontFamily: "Inter, system-ui, sans-serif",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--color-text-muted)",
  marginBottom: 6,
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-muted)",
  marginTop: 5,
};

// ── Section divider ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-5 pt-8"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      <p
        className="text-xs uppercase"
        style={{ letterSpacing: "0.1em", color: "var(--color-text-muted)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Multi-value nationality input ─────────────────────────────────────────────

function NationalityInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="e.g. British, Nigerian…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={add}
          className="btn-outline text-xs px-4 py-2 shrink-0"
          disabled={!draft.trim()}
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
              style={{
                background: "rgba(74,92,58,0.08)",
                color: "var(--color-accent)",
                border: "1px solid rgba(74,92,58,0.15)",
              }}
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                style={{ opacity: 0.6, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({
    name: "",
    artForms: [],
    careerStage: "",
    practice: "",
    nationalities: [],
    countryOfResidence: "",
    hasFiscalSponsor: false,
    age: "",
    gender: "",
    ethnicity: "",
    disability: "",
    website: "",
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `Server error ${r.status}`);
        return data;
      })
      .then((data) => setProfile(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => setPageLoading(false));
  }, []);

  function toggleArtForm(form: string) {
    setProfile((prev) => {
      const current = prev.artForms ?? [];
      return {
        ...prev,
        artForms: current.includes(form)
          ? current.filter((a) => a !== form)
          : [...current, form],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
        <Nav />
        <main className="max-w-[700px] mx-auto px-6 md:px-10 pb-24 pt-14">
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg h-10" style={{ background: "var(--color-card)" }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      <Nav />

      <main className="max-w-[700px] mx-auto px-6 md:px-10 pb-24">
        {error && !saving && (
          <div
            className="mt-8 text-sm p-4 rounded-xl"
            style={{
              background: "#F0E8E8",
              color: "#7A3A3A",
              border: "1px solid #E8D0D0",
            }}
          >
            <strong>Error:</strong> {error}
            {error.toLowerCase().includes("no such table") || error.toLowerCase().includes("column") ? (
              <p className="mt-2 text-xs">
                The database schema may be out of date. Run{" "}
                <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 4px", borderRadius: 3 }}>
                  rm dev.db && npm run db:migrate
                </code>{" "}
                in your project directory, then refresh.
              </p>
            ) : null}
          </div>
        )}

        <div className="pt-14 pb-8">
          <h1
            className="text-3xl sm:text-4xl font-normal"
            style={{
              fontFamily: "Georgia, 'Playfair Display', serif",
              color: "var(--color-text-primary)",
            }}
          >
            Your artist profile
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            This shapes your grant matches. The more you fill in, the better the search
            results — especially eligibility filters like nationality and career stage.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── Practice ── */}
          <Section title="Your practice">
            <div>
              <label style={labelStyle}>Your name</label>
              <input
                type="text"
                value={profile.name ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Maya Chen"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Art forms</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ART_FORMS.map((form) => {
                  const selected = (profile.artForms ?? []).includes(form);
                  return (
                    <button
                      key={form}
                      type="button"
                      onClick={() => toggleArtForm(form)}
                      className={`filter-chip ${selected ? "selected" : ""}`}
                    >
                      {form}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Career stage</label>
              <select
                value={profile.careerStage ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, careerStage: e.target.value }))}
                style={inputStyle}
              >
                {CAREER_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>About your practice</label>
              <textarea
                value={profile.practice ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, practice: e.target.value }))}
                placeholder="Describe your work, current projects, and what you want to develop. This is used directly in the grant search prompt."
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
              />
              <p style={hintStyle}>Be specific — mention medium, themes, and any upcoming projects.</p>
            </div>

            <div>
              <label style={labelStyle}>Website / portfolio</label>
              <input
                type="url"
                value={profile.website ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://yourname.com"
                style={inputStyle}
              />
            </div>
          </Section>

          {/* ── Eligibility ── */}
          <Section title="Eligibility">
            <div>
              <label style={labelStyle}>Nationality / citizenship</label>
              <NationalityInput
                values={profile.nationalities ?? []}
                onChange={(v) => setProfile((p) => ({ ...p, nationalities: v }))}
              />
              <p style={hintStyle}>Add all citizenships you hold. Many grants have nationality restrictions.</p>
            </div>

            <div>
              <label style={labelStyle}>Country of residence</label>
              <input
                type="text"
                value={profile.countryOfResidence ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, countryOfResidence: e.target.value }))}
                placeholder="e.g. United Kingdom"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Do you have a fiscal sponsor?</label>
              <div className="flex gap-3 mt-1">
                {[
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ].map(({ value, label }) => {
                  const selected = profile.hasFiscalSponsor === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, hasFiscalSponsor: value }))}
                      className={`filter-chip ${selected ? "selected" : ""}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p style={hintStyle}>Some international grants require a registered fiscal sponsor to receive funds.</p>
            </div>
          </Section>

          {/* ── Demographics ── */}
          <Section title="Demographics (optional)">
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)", marginTop: -8 }}>
              Some grants specifically target artists from underrepresented groups. Adding this
              information helps surface those opportunities. None of this is required.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="text"
                  value={profile.age ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                  placeholder="e.g. 27"
                  style={inputStyle}
                />
                <p style={hintStyle}>Some awards are under-30 or under-35 only.</p>
              </div>

              <div>
                <label style={labelStyle}>Gender</label>
                <input
                  type="text"
                  value={profile.gender ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                  placeholder="e.g. Woman, Non-binary…"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Ethnicity</label>
              <input
                type="text"
                value={profile.ethnicity ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, ethnicity: e.target.value }))}
                placeholder="e.g. Black British, South Asian, Mixed heritage…"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Disability status</label>
              <select
                value={profile.disability ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, disability: e.target.value }))}
                style={inputStyle}
              >
                {DISABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p style={hintStyle}>Disability Arts funds like Unlimited are open to disabled artists only.</p>
            </div>
          </Section>

          {/* ── Submit ── */}
          <div className="flex items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn-outline"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            {saved && (
              <span className="text-sm" style={{ color: "#2E6B3E" }}>
                Saved ✓
              </span>
            )}
            {error && (
              <span className="text-sm" style={{ color: "#7A3A3A" }}>
                {error}
              </span>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
