"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface LineItem {
  key: string;
  label: string;
  amount: number;
  type: string;
}

interface PricingBreakdownProps {
  lineItems: LineItem[];
  multipliers: (LineItem & { multiplierValue?: number })[];
  subtotal: number;
  total: number;
  packageType: "standard" | "premium";
}

export function PricingBreakdown({
  lineItems,
  multipliers,
  subtotal,
  total,
  packageType,
}: PricingBreakdownProps) {
  return (
    <div className="space-y-1">
      {lineItems.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: i * 0.03 }}
          className="flex items-center justify-between py-1.5"
        >
          <span className="text-sm text-zinc-600 truncate pr-4">{item.label}</span>
          <span className="text-sm font-mono text-zinc-900 tabular-nums shrink-0">
            {formatCurrency(item.amount)}
          </span>
        </motion.div>
      ))}

      <div className="flex items-center justify-between py-1.5 border-t border-zinc-100 mt-1">
        <span className="text-sm text-zinc-500">Subtotal</span>
        <span className="text-sm font-mono text-zinc-700 tabular-nums">{formatCurrency(subtotal)}</span>
      </div>

      {multipliers.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          className="flex items-center justify-between py-1.5"
        >
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm text-amber-700">
              {m.label} ({m.multiplierValue?.toFixed(2)}×)
            </span>
          </div>
          <span className="text-sm font-mono text-amber-700 tabular-nums">
            +{formatCurrency(m.amount)}
          </span>
        </motion.div>
      ))}

      <Separator className="my-2" />

      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-zinc-900">Total</span>
          {packageType === "premium" && (
            <Badge variant="purple" className="text-xs">Premium</Badge>
          )}
        </div>
        <motion.span
          key={total}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="text-lg font-bold font-mono text-zinc-900 tabular-nums"
        >
          {formatCurrency(total)}
        </motion.span>
      </div>
    </div>
  );
}
