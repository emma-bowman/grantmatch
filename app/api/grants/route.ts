import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deserializeGrant } from "@/lib/types";

// GET /api/grants?status=match&status=saved
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statuses = searchParams.getAll("status");

  const rows = await prisma.grant.findMany({
    where: statuses.length > 0 ? { status: { in: statuses } } : undefined,
    orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(rows.map(deserializeGrant));
}

// POST /api/grants  — manually add a grant (body: Partial<Grant>)
export async function POST(req: Request) {
  const body = await req.json();

  const grant = await prisma.grant.create({
    data: {
      name: body.name ?? "Untitled grant",
      funder: body.funder ?? "",
      amount: body.amount ?? "",
      deadline: body.deadline ?? "",
      description: body.description ?? "",
      eligibility: body.eligibility ?? "",
      focusAreas: JSON.stringify(Array.isArray(body.focusAreas) ? body.focusAreas : []),
      url: body.url ?? "",
      status: body.status ?? "saved",
      matchScore: typeof body.matchScore === "number" ? body.matchScore : 0,
      notes: body.notes ?? "",
      source: body.source ?? "manual",
    },
  });

  return NextResponse.json(deserializeGrant(grant), { status: 201 });
}
