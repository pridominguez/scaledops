import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const [totalProposals, proposalsByCategory, addOnUsage, recentProposals] = await Promise.all([
    prisma.proposal.count(),
    prisma.proposal.groupBy({
      by: ["categoryId"],
      _count: { id: true },
    }),
    prisma.proposalAddOn.groupBy({
      by: ["addOnId"],
      where: { selected: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.proposal.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { category: true, packages: true },
    }),
  ]);

  const categories = await prisma.serviceCategory.findMany();
  const addOns = await prisma.addOn.findMany({ where: { id: { in: addOnUsage.map((a) => a.addOnId) } } });

  const avgByCategory = await Promise.all(
    proposalsByCategory.map(async (pc) => {
      const pkgs = await prisma.proposalPackage.findMany({
        where: { proposal: { categoryId: pc.categoryId } },
        select: { total: true, type: true },
      });
      const standard = pkgs.filter((p) => p.type === "standard");
      const premium = pkgs.filter((p) => p.type === "premium");
      return {
        categoryId: pc.categoryId,
        count: pc._count.id,
        avgStandard: standard.length ? standard.reduce((s, p) => s + p.total, 0) / standard.length : 0,
        avgPremium: premium.length ? premium.reduce((s, p) => s + p.total, 0) / premium.length : 0,
      };
    })
  );

  return NextResponse.json({
    totalProposals,
    byCategory: avgByCategory.map((bc) => ({
      ...bc,
      categoryName: categories.find((c) => c.id === bc.categoryId)?.name ?? "Unknown",
    })),
    topAddOns: addOnUsage.map((au) => ({
      addOnId: au.addOnId,
      count: au._count.id,
      name: addOns.find((a) => a.id === au.addOnId)?.name ?? "Unknown",
    })),
    recentProposals,
  });
}
