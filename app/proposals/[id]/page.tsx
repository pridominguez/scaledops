import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Nav } from "@/components/layout/nav";
import { ProposalDetailClient } from "./proposal-detail-client";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      category: true,
      extractionResult: true,
      packages: { orderBy: { type: "asc" } },
      addOns: { include: { addOn: true } },
    },
  });

  if (!proposal) notFound();

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <ProposalDetailClient initialProposal={JSON.parse(JSON.stringify(proposal))} />
      </main>
    </div>
  );
}
