import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { deserializeGrant, deserializeProfile } from "@/lib/types";

// ── System prompt — kept short to save tokens ────────────────────────────────

const SYSTEM_PROMPT = `You find grants, bursaries, fellowships and residencies for INDIVIDUAL ARTISTS only — not organisations, charities or companies.

STRICT RULES — apply all of them before returning a result:
1. ELIGIBILITY: Match the artist's nationality and country of residence exactly. If a grant restricts by citizenship or residency and the artist doesn't qualify, omit it. When unsure, omit.
2. DEADLINES: Only return currently open or rolling opportunities. If a deadline may have already passed, omit it. Today's date is ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
3. GEOGRAPHY: Never return grants from US-based organisations unless they explicitly and clearly state they accept applications from international or UK-based applicants. If in doubt, exclude it.
4. QUALITY: Return at most 5 results. Every result must be a high-confidence, high-quality match. Fewer strong matches beats more weak ones.

Before including any result, verify all three checks — if any fails, exclude the grant:
- Is this grant open to someone with the artist's specific nationality AND country of residence?
- Is the deadline confirmed to be after ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}?
- Is this grant for individual artists, not organisations or companies?

UK sources to prioritise: Arts Council England DYCP, Jerwood Arts, Paul Hamlyn Foundation Artists Awards, Wellcome Trust, Cockayne Grants, British Council, a-n Bursaries, Creative Scotland, Elephant Trust, Freelands Foundation, Mark Making Trust, Unlimited (disability arts), artist residencies with stipends.

Respond with ONLY a valid JSON array — no markdown, no explanation. Each element:
{
  "name": "Full grant name",
  "funder": "Funder name",
  "amount": "£5,000 or £2,500–£15,000",
  "deadline": "12 May 2026 or Rolling",
  "description": "2 sentences: what it funds and what the award consists of.",
  "eligibility": "Specific eligibility criteria including nationality/residency/career stage.",
  "focusAreas": ["visual art", "photography"],
  "url": "https://direct-link",
  "matchScore": 85,
  "eligibilityConfidence": "high"
}

Only include results where eligibilityConfidence is "high". No text outside the array.`;

// ── Types ────────────────────────────────────────────────────────────────────

interface RawGrant {
  name?: unknown;
  funder?: unknown;
  amount?: unknown;
  deadline?: unknown;
  description?: unknown;
  eligibility?: unknown;
  focusAreas?: unknown;
  url?: unknown;
  matchScore?: unknown;
  eligibilityConfidence?: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseGrantsFromText(text: string): RawGrant[] {
  const stripped = text.trim();
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = fenced ? fenced[1] : stripped;
  const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error("No JSON array found in response");
  return JSON.parse(arrayMatch[0]);
}

// Calls the Anthropic API and retries once after 10 s if rate-limited (429).
async function callWithRetry(
  client: Anthropic,
  options: Parameters<typeof client.messages.create>[0]
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create(options);
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt === 0) {
        await sleep(10_000);
        continue;
      }
      throw err;
    }
  }
  /* istanbul ignore next */
  throw new Error("Unreachable");
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local." },
      { status: 503 }
    );
  }

  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Load artist profile to personalise the search
  const profileRow = await prisma.profile.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  const profile = deserializeProfile(profileRow);

  const lines: string[] = [];
  if (profile.name) lines.push(`Artist: ${profile.name}`);
  if (profile.artForms.length > 0) lines.push(`Art forms: ${profile.artForms.join(", ")}`);
  if (profile.careerStage) lines.push(`Career stage: ${profile.careerStage}`);
  if (profile.practice) lines.push(`Practice: ${profile.practice}`);
  if (profile.nationalities.length > 0)
    lines.push(`Nationalities: ${profile.nationalities.join(", ")}`);
  if (profile.countryOfResidence)
    lines.push(`Country of residence: ${profile.countryOfResidence}`);
  if (profile.age) lines.push(`Age: ${profile.age}`);
  if (profile.gender) lines.push(`Gender: ${profile.gender}`);
  if (profile.ethnicity) lines.push(`Ethnicity: ${profile.ethnicity}`);
  if (profile.disability && profile.disability !== "prefer not to say")
    lines.push(`Disability: ${profile.disability}`);
  if (profile.hasFiscalSponsor) lines.push(`Has fiscal sponsor: yes`);
  lines.push("", `Query: ${query}`, "", "Return the JSON array only.");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

  let responseText: string;
  try {
    responseText = await callWithRetry(anthropic, {
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      messages: [{ role: "user", content: lines.join("\n") }],
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 502;
    const message = err instanceof Error ? err.message : "Anthropic API error";
    // Surface rate-limit as 429 so clients can show appropriate messaging
    return NextResponse.json({ error: message }, { status });
  }

  let rawGrants: RawGrant[];
  try {
    rawGrants = parseGrantsFromText(responseText);
  } catch {
    return NextResponse.json(
      {
        error: "Could not parse grant results from AI response.",
        raw: process.env.NODE_ENV === "development" ? responseText : undefined,
      },
      { status: 422 }
    );
  }

  // Only persist high-confidence, named results
  const qualified = rawGrants.filter(
    (g) =>
      typeof g.name === "string" &&
      g.name.trim() &&
      g.eligibilityConfidence === "high"
  );

  const created = await Promise.all(
    qualified.map((g) =>
      prisma.grant.create({
        data: {
          name: String(g.name ?? "").trim(),
          funder: String(g.funder ?? "").trim(),
          amount: String(g.amount ?? "").trim(),
          deadline: String(g.deadline ?? "").trim(),
          description: String(g.description ?? "").trim(),
          eligibility: String(g.eligibility ?? "").trim(),
          focusAreas: JSON.stringify(
            Array.isArray(g.focusAreas) ? g.focusAreas.map(String) : []
          ),
          url: String(g.url ?? "").trim(),
          status: "match",
          matchScore: Math.min(
            100,
            Math.max(0, parseInt(String(g.matchScore ?? "0")) || 0)
          ),
          source: "search",
        },
      })
    )
  );

  return NextResponse.json(created.map(deserializeGrant), { status: 201 });
}
