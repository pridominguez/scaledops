import { prisma } from "@/lib/db/prisma";
import { Nav } from "@/components/layout/nav";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      pricingRules: { orderBy: { sortOrder: "asc" } },
      addOns: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900">Admin — Pricing Configuration</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Edit pricing rules and add-ons. Changes apply to all new proposals instantly.
          </p>
        </div>
        <AdminPanel initialCategories={JSON.parse(JSON.stringify(categories))} />
      </main>
    </div>
  );
}
