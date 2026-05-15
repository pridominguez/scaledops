import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractProjectRequirements } from "@/lib/ai/extraction";
import { z } from "zod";

const ExtractSchema = z.object({
  proposalId: z.string(),
  description: z.string().min(10),
  categorySlug: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ExtractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { proposalId, description, categorySlug } = parsed.data;

  const result = await extractProjectRequirements(categorySlug, description);

  const extraction = await prisma.extractionResult.upsert({
    where: { proposalId },
    update: {
      extractedData: JSON.stringify(result.data),
      confidence: result.confidence,
      ambiguities: JSON.stringify(result.ambiguities),
      reasoning: result.reasoning,
      model: result.model,
    },
    create: {
      proposalId,
      extractedData: JSON.stringify(result.data),
      confidence: result.confidence,
      ambiguities: JSON.stringify(result.ambiguities),
      reasoning: result.reasoning,
      model: result.model,
    },
  });

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "extracted" },
  });

  return NextResponse.json({
    ...extraction,
    extractedData: result.data,
    ambiguities: result.ambiguities,
  });
}
