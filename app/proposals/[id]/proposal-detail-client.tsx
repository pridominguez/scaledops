"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExtractionEditor } from "@/components/proposals/extraction-editor";
import { PackageCard } from "@/components/proposals/package-card";
import { AddOnSelector } from "@/components/proposals/addon-selector";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, RefreshCw, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { CATEGORY_DEFAULTS } from "@/lib/ai/schemas";

interface Proposal {
  id: string;
  clientDescription: string;
  budget?: number | null;
  timeline?: string | null;
  complexity?: string | null;
  status: string;
  createdAt: string;
  category: { name: string; slug: string };
  extractionResult?: {
    extractedData: string;
    confidence: number;
    ambiguities: string;
    reasoning: string;
    model: string;
  } | null;
  packages: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    features: string;
    breakdown: string;
    subtotal: number;
    total: number;
    timeline?: string | null;
  }>;
  addOns: Array<{
    addOnId: string;
    selected: boolean;
    addOn: { id: string; key: string; name: string; description?: string | null; price: number };
  }>;
}

export function ProposalDetailClient({ initialProposal }: { initialProposal: Proposal }) {
  const [proposal, setProposal] = useState(initialProposal);
  const [extractedData, setExtractedData] = useState<Record<string, unknown>>(
    initialProposal.extractionResult
      ? JSON.parse(initialProposal.extractionResult.extractedData)
      : (CATEGORY_DEFAULTS[initialProposal.category.slug] as Record<string, unknown> ?? {})
  );
  const [extracting, setExtracting] = useState(false);
  const [generatingPricing, setGeneratingPricing] = useState(false);
  const [packages, setPackages] = useState<Proposal["packages"]>(initialProposal.packages);
  const [addOns, setAddOns] = useState<Proposal["addOns"]>(initialProposal.addOns);
  const [hasExtraction, setHasExtraction] = useState(!!initialProposal.extractionResult);
  const [hasPricing, setHasPricing] = useState(initialProposal.packages.length > 0);
  const [exportingPdf, setExportingPdf] = useState(false);

  const extract = useCallback(async () => {
    setExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          description: proposal.clientDescription,
          categorySlug: proposal.category.slug,
        }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      const data = await res.json();
      setExtractedData(data.extractedData);
      setHasExtraction(true);
      setProposal((p) => ({
        ...p,
        extractionResult: {
          extractedData: JSON.stringify(data.extractedData),
          confidence: data.confidence,
          ambiguities: JSON.stringify(data.ambiguities),
          reasoning: data.reasoning ?? "",
          model: data.model ?? "",
        },
      }));
      toast.success("Requirements extracted successfully");
    } catch {
      toast.error("Extraction failed. Using defaults.");
      setHasExtraction(true);
    } finally {
      setExtracting(false);
    }
  }, [proposal.id, proposal.clientDescription, proposal.category.slug]);

  useEffect(() => {
    if (!hasExtraction) {
      extract();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generatePricing() {
    setGeneratingPricing(true);
    try {
      const selectedIds = addOns.filter((a) => a.selected).map((a) => a.addOnId);
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          extractedData,
          categorySlug: proposal.category.slug,
          selectedAddOnIds: selectedIds,
        }),
      });
      if (!res.ok) throw new Error("Pricing failed");
      const data = await res.json();
      setPackages([data.standard, data.premium]);
      if (data.addOns && addOns.length === 0) {
        setAddOns(
          data.addOns.map((ao: { id: string; key: string; name: string; description?: string | null; price: number }) => ({
            addOnId: ao.id,
            selected: false,
            addOn: ao,
          }))
        );
      }
      setHasPricing(true);
      toast.success("Pricing generated");
    } catch {
      toast.error("Failed to generate pricing");
    } finally {
      setGeneratingPricing(false);
    }
  }

  async function toggleAddOn(addOnId: string, selected: boolean) {
    setAddOns((prev) => prev.map((a) => (a.addOnId === addOnId ? { ...a, selected } : a)));
    await fetch(`/api/proposals/${proposal.id}/addons`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addOnId, selected }),
    });
  }

  async function exportPdf() {
    setExportingPdf(true);
    try {
      const { generateProposalPdf } = await import("@/lib/pdf/generator");
      const standardPkg = packages.find((p) => p.type === "standard");
      const premiumPkg = packages.find((p) => p.type === "premium");
      await generateProposalPdf({
        proposal,
        standardPackage: standardPkg,
        premiumPackage: premiumPkg,
        addOns: addOns.filter((a) => a.selected),
      });
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  }

  const extraction = proposal.extractionResult;
  const standardPkg = packages.find((p) => p.type === "standard");
  const premiumPkg = packages.find((p) => p.type === "premium");
  const selectedAddOnsTotal = addOns.filter((a) => a.selected).reduce((s, a) => s + a.addOn.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/proposals">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">{proposal.category.name}</Badge>
              <Badge
                variant={proposal.status === "generated" ? "success" : proposal.status === "extracted" ? "blue" : "secondary"}
                className="text-xs"
              >
                {proposal.status}
              </Badge>
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 leading-snug max-w-xl">
              {proposal.clientDescription.length > 80
                ? proposal.clientDescription.substring(0, 80) + "…"
                : proposal.clientDescription}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Created {formatDate(proposal.createdAt)}</p>
          </div>
        </div>
        {hasPricing && (
          <Button variant="outline" size="sm" onClick={exportPdf} loading={exportingPdf} className="shrink-0">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Export PDF</span>
          </Button>
        )}
      </div>

      <Separator />

      <Tabs defaultValue="extract">
        <TabsList>
          <TabsTrigger value="extract" className="gap-1.5">
            {hasExtraction && <Check className="h-3 w-3 text-emerald-500" />}
            Requirements
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5">
            {hasPricing && <Check className="h-3 w-3 text-emerald-500" />}
            Packages
          </TabsTrigger>
          {hasPricing && <TabsTrigger value="addons">Add-ons</TabsTrigger>}
          {hasPricing && <TabsTrigger value="proposal">Proposal</TabsTrigger>}
        </TabsList>

        {/* Extraction Tab */}
        <TabsContent value="extract" className="space-y-4">
          <AnimatePresence mode="wait">
            {extracting ? (
              <motion.div
                key="extracting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-16 gap-3"
              >
                <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
                <p className="text-sm text-zinc-500">Extracting requirements with AI…</p>
              </motion.div>
            ) : (
              <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ExtractionEditor
                  categorySlug={proposal.category.slug}
                  extractedData={extractedData}
                  confidence={extraction?.confidence ?? 0.7}
                  ambiguities={extraction?.ambiguities ? JSON.parse(extraction.ambiguities) : []}
                  reasoning={extraction?.reasoning ?? ""}
                  onUpdate={setExtractedData}
                  onReExtract={extract}
                  extracting={extracting}
                />
                <div className="mt-6 flex items-center gap-3">
                  <Button onClick={generatePricing} loading={generatingPricing} size="lg">
                    <Sparkles className="h-4 w-4" />
                    {hasPricing ? "Recalculate Pricing" : "Generate Pricing"}
                  </Button>
                  {hasPricing && (
                    <p className="text-xs text-zinc-400">
                      Changes will recalculate both packages instantly
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="pricing">
          {!hasPricing ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <p className="text-sm text-zinc-500">No packages yet. Go to Requirements and click Generate Pricing.</p>
              <Button onClick={generatePricing} loading={generatingPricing}>
                <Sparkles className="h-4 w-4" />
                Generate Pricing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {standardPkg && (
                <PackageCard
                  type="standard"
                  name={standardPkg.name}
                  description={standardPkg.description}
                  features={JSON.parse(standardPkg.features)}
                  lineItems={JSON.parse(standardPkg.breakdown).lineItems}
                  multipliers={JSON.parse(standardPkg.breakdown).multipliers}
                  subtotal={standardPkg.subtotal}
                  total={standardPkg.total}
                  timeline={standardPkg.timeline ?? undefined}
                />
              )}
              {premiumPkg && (
                <PackageCard
                  type="premium"
                  name={premiumPkg.name}
                  description={premiumPkg.description}
                  features={JSON.parse(premiumPkg.features)}
                  lineItems={JSON.parse(premiumPkg.breakdown).lineItems}
                  multipliers={JSON.parse(premiumPkg.breakdown).multipliers}
                  subtotal={premiumPkg.subtotal}
                  total={premiumPkg.total}
                  timeline={premiumPkg.timeline ?? undefined}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Add-ons Tab */}
        <TabsContent value="addons">
          {addOns.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No add-ons available for this category.</p>
          ) : (
            <AddOnSelector addOns={addOns} onToggle={toggleAddOn} />
          )}
        </TabsContent>

        {/* Full Proposal Tab */}
        <TabsContent value="proposal">
          {standardPkg && premiumPkg && (
            <ProposalOutput
              proposal={proposal}
              standardPkg={standardPkg}
              premiumPkg={premiumPkg}
              addOns={addOns.filter((a) => a.selected)}
              addOnsTotal={selectedAddOnsTotal}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProposalOutputProps {
  proposal: Proposal;
  standardPkg: Proposal["packages"][0];
  premiumPkg: Proposal["packages"][0];
  addOns: Proposal["addOns"];
  addOnsTotal: number;
}

function ProposalOutput({ proposal, standardPkg, premiumPkg, addOns, addOnsTotal }: ProposalOutputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8"
      id="proposal-output"
    >
      {/* Header */}
      <div className="border-b border-zinc-100 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">Project Proposal</p>
            <h2 className="text-2xl font-bold text-zinc-900">ScaledOps</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">Date</p>
            <p className="text-sm font-medium text-zinc-700">{formatDate(proposal.createdAt)}</p>
          </div>
        </div>
        <div className="bg-zinc-50 rounded-lg p-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Project Description</p>
          <p className="text-sm text-zinc-700 leading-relaxed">{proposal.clientDescription}</p>
        </div>
        {(proposal.budget || proposal.timeline) && (
          <div className="flex gap-4 mt-3">
            {proposal.budget && (
              <div>
                <p className="text-xs text-zinc-400">Budget</p>
                <p className="text-sm font-medium text-zinc-700">{formatCurrency(proposal.budget)}</p>
              </div>
            )}
            {proposal.timeline && (
              <div>
                <p className="text-xs text-zinc-400">Timeline Target</p>
                <p className="text-sm font-medium text-zinc-700">{proposal.timeline}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Packages */}
      <div>
        <h3 className="text-base font-semibold text-zinc-900 mb-4">Pricing Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[standardPkg, premiumPkg].map((pkg) => (
            <div key={pkg.id} className={`rounded-lg border p-4 ${pkg.type === "premium" ? "border-zinc-900" : "border-zinc-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-900">{pkg.name}</span>
                <span className="text-lg font-bold font-mono text-zinc-900">{formatCurrency(pkg.total)}</span>
              </div>
              {pkg.timeline && <p className="text-xs text-zinc-500 mb-3">Delivery: {pkg.timeline}</p>}
              <div className="space-y-1">
                {(JSON.parse(pkg.features) as string[]).map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-zinc-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      {addOns.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-zinc-900 mb-3">Selected Add-ons</h3>
          <div className="space-y-2">
            {addOns.map((a) => (
              <div key={a.addOnId} className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{a.addOn.name}</p>
                  {a.addOn.description && <p className="text-xs text-zinc-500">{a.addOn.description}</p>}
                </div>
                <span className="text-sm font-mono text-zinc-900">{formatCurrency(a.addOn.price)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-zinc-700">Add-ons Total</span>
              <span className="text-sm font-bold font-mono text-zinc-900">{formatCurrency(addOnsTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-zinc-900 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Investment Summary</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Standard Package</span>
            <span className="text-sm font-mono text-white">{formatCurrency(standardPkg.total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Premium Package</span>
            <span className="text-sm font-mono text-white">{formatCurrency(premiumPkg.total)}</span>
          </div>
          {addOnsTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Add-ons</span>
              <span className="text-sm font-mono text-white">+{formatCurrency(addOnsTotal)}</span>
            </div>
          )}
          <Separator className="bg-zinc-700" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-200">Premium + Add-ons</span>
            <span className="text-base font-bold font-mono text-white">{formatCurrency(premiumPkg.total + addOnsTotal)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400 text-center">
        This proposal is valid for 30 days. Prices are in USD.
      </p>
    </motion.div>
  );
}
