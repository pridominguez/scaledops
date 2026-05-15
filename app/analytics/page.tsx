import { prisma } from "@/lib/db/prisma";
import { Nav } from "@/components/layout/nav";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [totalProposals, proposals, addOnUsage] = await Promise.all([
    prisma.proposal.count(),
    prisma.proposal.findMany({
      include: { category: true, packages: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.proposalAddOn.groupBy({
      by: ["addOnId"],
      where: { selected: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
  ]);

  const allPackages = proposals.flatMap((p) => p.packages);
  const standardPackages = allPackages.filter((p) => p.type === "standard");
  const premiumPackages = allPackages.filter((p) => p.type === "premium");
  const avgStandard = standardPackages.length ? standardPackages.reduce((s, p) => s + p.total, 0) / standardPackages.length : 0;
  const avgPremium = premiumPackages.length ? premiumPackages.reduce((s, p) => s + p.total, 0) / premiumPackages.length : 0;

  const addOnIds = addOnUsage.map((a) => a.addOnId);
  const addOns = await prisma.addOn.findMany({ where: { id: { in: addOnIds } } });

  const categoryBreakdown = await prisma.proposal.groupBy({
    by: ["categoryId"],
    _count: { id: true },
  });
  const categories = await prisma.serviceCategory.findMany();

  const stats = [
    { label: "Total Proposals", value: totalProposals.toString(), icon: FileText, change: "all time" },
    { label: "Avg Standard Price", value: avgStandard ? formatCurrency(avgStandard) : "—", icon: DollarSign, change: "across generated proposals" },
    { label: "Avg Premium Price", value: avgPremium ? formatCurrency(avgPremium) : "—", icon: TrendingUp, change: "across generated proposals" },
    { label: "Add-ons Selected", value: addOnUsage.reduce((s, a) => s + a._count.id, 0).toString(), icon: Zap, change: "total selections" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Proposal performance and pricing insights</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-zinc-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-zinc-900 font-mono">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Category breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900 mb-3">By Category</p>
            <div className="space-y-2">
              {categoryBreakdown.map((cb) => {
                const cat = categories.find((c) => c.id === cb.categoryId);
                const pct = totalProposals > 0 ? Math.round((cb._count.id / totalProposals) * 100) : 0;
                return (
                  <div key={cb.categoryId}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-zinc-600">{cat?.name ?? "Unknown"}</span>
                      <span className="text-xs font-medium text-zinc-900">{cb._count.id}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {categoryBreakdown.length === 0 && <p className="text-xs text-zinc-400">No data yet</p>}
            </div>
          </div>

          {/* Top add-ons */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:col-span-2">
            <p className="text-sm font-semibold text-zinc-900 mb-3">Most Selected Add-ons</p>
            {addOnUsage.length === 0 ? (
              <p className="text-xs text-zinc-400">No add-on data yet</p>
            ) : (
              <div className="space-y-2">
                {addOnUsage.map((au) => {
                  const ao = addOns.find((a) => a.id === au.addOnId);
                  return (
                    <div key={au.addOnId} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-700">{ao?.name ?? "Unknown"}</span>
                      <Badge variant="secondary" className="text-xs">{au._count.id}×</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent proposals */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Recent Proposals</p>
          </div>
          {proposals.length === 0 ? (
            <p className="text-sm text-zinc-400 p-6 text-center">No proposals yet</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {proposals.map((p) => {
                const premium = p.packages.find((pkg) => pkg.type === "premium");
                return (
                  <Link
                    key={p.id}
                    href={`/proposals/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-800 truncate">
                        {p.clientDescription.substring(0, 60)}…
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-400">{p.category.name}</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-xs text-zinc-400">{formatDate(p.createdAt)}</span>
                      </div>
                    </div>
                    {premium && (
                      <span className="text-xs font-mono font-semibold text-zinc-700 shrink-0">
                        {formatCurrency(premium.total)}
                      </span>
                    )}
                    <Badge variant={p.status === "generated" ? "success" : "secondary"} className="text-xs shrink-0">
                      {p.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
