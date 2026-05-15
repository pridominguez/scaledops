import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculatePricing, generatePackageFeatures, type ExtractionInputs } from "@/lib/pricing/engine";
import { z } from "zod";

const GeneratePricingSchema = z.object({
  proposalId: z.string(),
  extractedData: z.record(z.string(), z.unknown()),
  categorySlug: z.string(),
  selectedAddOnIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GeneratePricingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { proposalId, extractedData, categorySlug, selectedAddOnIds = [] } = parsed.data;

  const category = await prisma.serviceCategory.findUnique({
    where: { slug: categorySlug },
    include: { pricingRules: { where: { isActive: true } }, addOns: { where: { isActive: true } } },
  });

  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const inputs = extractedData as unknown as ExtractionInputs;

  const standardBreakdown = calculatePricing(category.pricingRules, inputs, "standard");
  const premiumBreakdown = calculatePricing(category.pricingRules, inputs, "premium");

  const standardFeatures = generatePackageFeatures(categorySlug, inputs, "standard");
  const premiumFeatures = generatePackageFeatures(categorySlug, inputs, "premium");

  // Delete existing packages for this proposal
  await prisma.proposalPackage.deleteMany({ where: { proposalId } });

  const [standardPkg, premiumPkg] = await Promise.all([
    prisma.proposalPackage.create({
      data: {
        proposalId,
        type: "standard",
        name: "Standard Package",
        description: "Professional delivery with all core requirements met.",
        features: JSON.stringify(standardFeatures),
        breakdown: JSON.stringify({
          lineItems: standardBreakdown.lineItems,
          multipliers: standardBreakdown.multipliers,
        }),
        subtotal: standardBreakdown.subtotal,
        multiplier: 1.0,
        total: standardBreakdown.total,
        timeline: getTimeline(categorySlug, inputs, "standard"),
      },
    }),
    prisma.proposalPackage.create({
      data: {
        proposalId,
        type: "premium",
        name: "Premium Package",
        description: "Priority delivery with enhanced features, dedicated support, and extended revisions.",
        features: JSON.stringify(premiumFeatures),
        breakdown: JSON.stringify({
          lineItems: premiumBreakdown.lineItems,
          multipliers: premiumBreakdown.multipliers,
        }),
        subtotal: premiumBreakdown.subtotal,
        multiplier: 1.35,
        total: premiumBreakdown.total,
        timeline: getTimeline(categorySlug, inputs, "premium"),
      },
    }),
  ]);

  // Upsert add-ons
  await prisma.proposalAddOn.deleteMany({ where: { proposalId } });
  if (category.addOns.length > 0) {
    await prisma.proposalAddOn.createMany({
      data: category.addOns.map((ao) => ({
        proposalId,
        addOnId: ao.id,
        selected: selectedAddOnIds.includes(ao.id),
      })),
    });
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "generated" },
  });

  // Save version snapshot
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { extractionResult: true },
  });
  const versionCount = await prisma.proposalVersion.count({ where: { proposalId } });
  await prisma.proposalVersion.create({
    data: {
      proposalId,
      version: versionCount + 1,
      snapshot: JSON.stringify({ proposal, packages: [standardPkg, premiumPkg] }),
    },
  });

  await prisma.analytics.create({
    data: { event: "pricing_generated", data: JSON.stringify({ proposalId, categorySlug }) },
  });

  return NextResponse.json({
    standard: { ...standardPkg, breakdown: { lineItems: standardBreakdown.lineItems, multipliers: standardBreakdown.multipliers }, features: standardFeatures },
    premium: { ...premiumPkg, breakdown: { lineItems: premiumBreakdown.lineItems, multipliers: premiumBreakdown.multipliers }, features: premiumFeatures },
    addOns: category.addOns,
  });
}

function getTimeline(categorySlug: string, inputs: ExtractionInputs, packageType: "standard" | "premium"): string {
  const data = inputs as unknown as Record<string, unknown>;
  if (categorySlug === "blog-writing") {
    const days = (data.turnaroundDays as number) ?? 7;
    return packageType === "premium" ? `${Math.max(1, days - 2)} days (priority)` : `${days} days`;
  }
  if (categorySlug === "website-development") {
    const weeks = (data.timelineWeeks as number) ?? 8;
    return packageType === "premium" ? `${weeks} weeks (dedicated PM)` : `${weeks} weeks`;
  }
  if (categorySlug === "video-production") {
    const days = (data.deliveryDays as number) ?? 14;
    return packageType === "premium" ? `${Math.max(3, days - 3)} days (priority)` : `${days} days`;
  }
  return "TBD";
}
