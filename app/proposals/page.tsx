import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Nav } from "@/components/layout/nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight, FileText, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const proposals = await prisma.proposal.findMany({
    include: { category: true, packages: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Proposals</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{proposals.length} total</p>
          </div>
          <Link href="/">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Proposal
            </Button>
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-500">No proposals yet</p>
            <Link href="/">
              <Button size="sm">Create your first proposal</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => {
              const standard = p.packages.find((pkg) => pkg.type === "standard");
              const premium = p.packages.find((pkg) => pkg.type === "premium");
              return (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {p.clientDescription.length > 70
                        ? p.clientDescription.substring(0, 70) + "…"
                        : p.clientDescription}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-400">{p.category.name}</span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs text-zinc-400">{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={p.status === "generated" ? "success" : p.status === "extracted" ? "blue" : "secondary"}
                      className="text-xs hidden sm:inline-flex"
                    >
                      {p.status}
                    </Badge>
                    {standard && premium && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-zinc-400">Standard / Premium</p>
                        <p className="text-xs font-mono font-semibold text-zinc-900">
                          {formatCurrency(standard.total)} / {formatCurrency(premium.total)}
                        </p>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
