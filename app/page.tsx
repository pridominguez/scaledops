import { Nav } from "@/components/layout/nav";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 mb-4">
            <Zap className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">AI-Powered · Deterministic Pricing</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
            Generate a Proposal
          </h1>
          <p className="text-zinc-500 text-base">
            Describe your project in plain language. AI extracts requirements, our pricing engine generates accurate packages instantly.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
          <ProposalForm />
        </div>
      </main>
    </div>
  );
}
