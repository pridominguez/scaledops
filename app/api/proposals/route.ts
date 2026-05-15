import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const CreateProposalSchema = z.object({
  categorySlug: z.string(),
  clientDescription: z.string().min(10),
  budget: z.number().optional(),
  timeline: z.string().optional(),
  complexity: z.string().optional(),
});

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    include: {
      category: true,
      packages: true,
      extractionResult: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { categorySlug, clientDescription, budget, timeline, complexity } = parsed.data;

  const category = await prisma.serviceCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const proposal = await prisma.proposal.create({
    data: {
      categoryId: category.id,
      clientDescription,
      budget: budget ?? null,
      timeline: timeline ?? null,
      complexity: complexity ?? null,
    },
    include: { category: true },
  });

  await prisma.analytics.create({
    data: { event: "proposal_created", data: JSON.stringify({ categorySlug, proposalId: proposal.id }) },
  });

  return NextResponse.json(proposal, { status: 201 });
}
