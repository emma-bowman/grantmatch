import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deserializeProfile } from "@/lib/types";

// GET /api/profile — returns the single artist profile (creates it if absent)
export async function GET() {
  try {
    const profile = await prisma.profile.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    });
    return NextResponse.json(deserializeProfile(profile));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    console.error("[GET /api/profile]", message);
    return NextResponse.json(
      { error: `Could not load profile: ${message}` },
      { status: 500 }
    );
  }
}

// POST /api/profile — upsert the artist profile
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const serializeArray = (v: unknown): string | undefined =>
    Array.isArray(v) ? JSON.stringify(v) : undefined;

  try {
    const profile = await prisma.profile.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        name: typeof body.name === "string" ? body.name : "",
        artForms: JSON.stringify(Array.isArray(body.artForms) ? body.artForms : []),
        careerStage: typeof body.careerStage === "string" ? body.careerStage : "",
        practice: typeof body.practice === "string" ? body.practice : "",
        nationalities: JSON.stringify(Array.isArray(body.nationalities) ? body.nationalities : []),
        countryOfResidence: typeof body.countryOfResidence === "string" ? body.countryOfResidence : "",
        hasFiscalSponsor: body.hasFiscalSponsor === true,
        age: typeof body.age === "string" ? body.age : "",
        gender: typeof body.gender === "string" ? body.gender : "",
        ethnicity: typeof body.ethnicity === "string" ? body.ethnicity : "",
        disability: typeof body.disability === "string" ? body.disability : "",
        website: typeof body.website === "string" ? body.website : "",
      },
      update: {
        name: typeof body.name === "string" ? body.name : undefined,
        artForms: serializeArray(body.artForms),
        careerStage: typeof body.careerStage === "string" ? body.careerStage : undefined,
        practice: typeof body.practice === "string" ? body.practice : undefined,
        nationalities: serializeArray(body.nationalities),
        countryOfResidence: typeof body.countryOfResidence === "string" ? body.countryOfResidence : undefined,
        hasFiscalSponsor: body.hasFiscalSponsor !== undefined ? body.hasFiscalSponsor === true : undefined,
        age: typeof body.age === "string" ? body.age : undefined,
        gender: typeof body.gender === "string" ? body.gender : undefined,
        ethnicity: typeof body.ethnicity === "string" ? body.ethnicity : undefined,
        disability: typeof body.disability === "string" ? body.disability : undefined,
        website: typeof body.website === "string" ? body.website : undefined,
      },
    });

    return NextResponse.json(deserializeProfile(profile));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    console.error("[POST /api/profile]", message);
    return NextResponse.json(
      { error: `Could not save profile: ${message}` },
      { status: 500 }
    );
  }
}
