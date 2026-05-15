"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PricingBreakdown } from "./pricing-breakdown";
import { formatCurrency } from "@/lib/utils";
import { Check, Clock, Star } from "lucide-react";

interface LineItem {
  key: string;
  label: string;
  amount: number;
  type: string;
  multiplierValue?: number;
}

interface PackageCardProps {
  type: "standard" | "premium";
  name: string;
  description: string;
  features: string[];
  lineItems: LineItem[];
  multipliers: LineItem[];
  subtotal: number;
  total: number;
  timeline?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function PackageCard({
  type,
  name,
  description,
  features,
  lineItems,
  multipliers,
  subtotal,
  total,
  timeline,
  isSelected,
  onSelect,
}: PackageCardProps) {
  const isPremium = type === "premium";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: isPremium ? 0.08 : 0 }}
      className={`rounded-xl border p-5 transition-all duration-150 ${
        isPremium
          ? "border-zinc-900 ring-1 ring-zinc-900"
          : "border-zinc-200"
      } ${onSelect ? "cursor-pointer hover:border-zinc-400" : ""} ${
        isSelected && !isPremium ? "ring-1 ring-zinc-900 border-zinc-900" : ""
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isPremium && <Star className="h-3.5 w-3.5 text-zinc-900 fill-zinc-900" />}
            <span className="text-sm font-semibold text-zinc-900">{name}</span>
            {isPremium && <Badge variant="default" className="text-xs">Recommended</Badge>}
          </div>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <div className="text-right shrink-0 pl-4">
          <div className="text-xl font-bold font-mono text-zinc-900">{formatCurrency(total)}</div>
          <div className="text-xs text-zinc-400">project total</div>
        </div>
      </div>

      {timeline && (
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-500">Delivery: {timeline}</span>
        </div>
      )}

      <Separator className="mb-3" />

      {/* Features */}
      <div className="mb-4 space-y-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-xs text-zinc-600">{f}</span>
          </div>
        ))}
      </div>

      <Separator className="mb-3" />

      {/* Breakdown */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Pricing Breakdown</p>
        <PricingBreakdown
          lineItems={lineItems}
          multipliers={multipliers}
          subtotal={subtotal}
          total={total}
          packageType={type}
        />
      </div>
    </motion.div>
  );
}
