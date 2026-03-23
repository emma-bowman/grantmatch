// ── Shared types used by both API routes and client components ──────────────

export type GrantStatus = "match" | "saved" | "applied" | "awarded" | "declined";

export interface Grant {
  id: string;
  name: string;
  funder: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility: string;
  focusAreas: string[];  // deserialized from JSON string in DB
  url: string;
  status: GrantStatus;
  matchScore: number;
  notes: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  // Identity
  name: string;
  // Practice
  artForms: string[];      // deserialized from JSON string in DB
  careerStage: string;     // emerging | mid-career | established
  practice: string;        // description of practice
  // Eligibility
  nationalities: string[]; // deserialized from JSON string in DB
  countryOfResidence: string;
  hasFiscalSponsor: boolean;
  // Demographics
  age: string;
  gender: string;
  ethnicity: string;
  disability: string;
  // Online
  website: string;
}

export interface Stats {
  totalMatches: number;
  saved: number;
  applied: number;
  awarded: number;
  declined: number;
  successRate: string;
}

// Deserializes a Grant DB row (JSON string fields → typed arrays).
export function deserializeGrant(row: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  funder: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility: string;
  focusAreas: string;
  url: string;
  status: string;
  matchScore: number;
  notes: string;
  source: string;
}): Grant {
  let focusAreas: string[] = [];
  try {
    const parsed = JSON.parse(row.focusAreas);
    focusAreas = Array.isArray(parsed) ? parsed : [];
  } catch {
    focusAreas = [];
  }
  return {
    ...row,
    focusAreas,
    status: row.status as GrantStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Deserializes a Profile DB row (JSON string fields → typed arrays).
export function deserializeProfile(row: {
  id: string;
  name: string;
  artForms: string;
  careerStage: string;
  practice: string;
  nationalities: string;
  countryOfResidence: string;
  hasFiscalSponsor: boolean;
  age: string;
  gender: string;
  ethnicity: string;
  disability: string;
  website: string;
}): Profile {
  const parse = (s: string): string[] => {
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  return {
    ...row,
    artForms: parse(row.artForms),
    nationalities: parse(row.nationalities),
  };
}
