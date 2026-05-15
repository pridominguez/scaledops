import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      category: true,
      extractionResult: true,
      packages: { orderBy: { type: "asc" } },
      addOns: { include: { addOn: true } },
      versions: { orderBy: { version: "desc" }, take: 5 },
    },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const proposal = await prisma.proposal.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      budget: body.budget ?? undefined,
      timeline: body.timeline ?? undefined,
      complexity: body.complexity ?? undefined,
    },
    include: { category: true },
  });
  return NextResponse.json(proposal);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.proposal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
