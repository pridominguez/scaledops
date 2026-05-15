import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { addOnId, selected } = await req.json();

  const updated = await prisma.proposalAddOn.updateMany({
    where: { proposalId: id, addOnId },
    data: { selected },
  });

  return NextResponse.json(updated);
}
