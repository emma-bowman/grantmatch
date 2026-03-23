import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deserializeGrant, type GrantStatus } from "@/lib/types";

const VALID_STATUSES: GrantStatus[] = ["match", "saved", "applied", "awarded", "declined"];

// PATCH /api/grants/:id  — update status, notes, or any editable field
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  // Validate status if provided
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status "${body.status}"` },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.matchScore !== undefined) data.matchScore = Number(body.matchScore);
  if (body.url !== undefined) data.url = body.url;
  if (body.deadline !== undefined) data.deadline = body.deadline;
  if (Array.isArray(body.focusAreas)) data.focusAreas = JSON.stringify(body.focusAreas);

  const grant = await prisma.grant.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(deserializeGrant(grant));
}

// DELETE /api/grants/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.grant.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
