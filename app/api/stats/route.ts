import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stats — counts by status + awarded total estimation
export async function GET() {
  const groups = await prisma.grant.groupBy({
    by: ["status"],
    _count: { id: true },
    _avg: { matchScore: true },
  });

  const byStatus: Record<string, number> = {};
  for (const g of groups) {
    byStatus[g.status] = g._count.id;
  }

  // Only count grants the user has explicitly saved — exclude unsaved "match" results
  const total = (byStatus["saved"] ?? 0) + (byStatus["applied"] ?? 0) + (byStatus["awarded"] ?? 0) + (byStatus["declined"] ?? 0);
  const applied = (byStatus["applied"] ?? 0) + (byStatus["awarded"] ?? 0) + (byStatus["declined"] ?? 0);
  const awarded = byStatus["awarded"] ?? 0;
  const successRate = applied > 0 ? Math.round((awarded / applied) * 100) : 0;

  return NextResponse.json({
    totalMatches: total,
    saved: byStatus["saved"] ?? 0,
    applied: byStatus["applied"] ?? 0,
    awarded,
    declined: byStatus["declined"] ?? 0,
    successRate: `${successRate}%`,
  });
}
