"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";

interface AddOn {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  price: number;
}

interface ProposalAddOn {
  addOnId: string;
  selected: boolean;
  addOn: AddOn;
}

interface AddOnSelectorProps {
  addOns: ProposalAddOn[];
  onToggle: (addOnId: string, selected: boolean) => void;
}

export function AddOnSelector({ addOns, onToggle }: AddOnSelectorProps) {
  const selectedTotal = addOns
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.addOn.price, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Add-ons & Enhancements</p>
          <p className="text-xs text-zinc-500">Optionally extend your project scope</p>
        </div>
        <AnimatePresence>
          {selectedTotal > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge variant="blue" className="text-xs">
                +{formatCurrency(selectedTotal)} selected
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {addOns.map((pa) => {
          const { addOn, selected } = pa;
          return (
            <button
              key={addOn.id}
              type="button"
              onClick={() => onToggle(addOn.id, !selected)}
              className={`flex items-start justify-between rounded-lg border p-3 text-left transition-all duration-150 ${
                selected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-medium text-zinc-900">{addOn.name}</span>
                </div>
                {addOn.description && (
                  <p className="text-xs text-zinc-500">{addOn.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-mono font-semibold text-zinc-900">
                  {formatCurrency(addOn.price)}
                </span>
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    selected ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"
                  }`}
                >
                  {selected ? (
                    <Minus className="h-3 w-3 text-white" />
                  ) : (
                    <Plus className="h-3 w-3 text-zinc-400" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
