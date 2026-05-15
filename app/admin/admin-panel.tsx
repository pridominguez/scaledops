"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Edit2, Check, X, Plus, Trash2 } from "lucide-react";

interface PricingRule {
  id: string;
  key: string;
  label: string;
  type: string;
  value: number;
  unit?: string | null;
  condition?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface AddOn {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  price: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  pricingRules: PricingRule[];
  addOns: AddOn[];
}

function RuleRow({ rule, onSave, onDelete }: { rule: PricingRule; onSave: (r: PricingRule) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "rule", data: draft }),
      });
      if (!res.ok) throw new Error();
      onSave(draft);
      setEditing(false);
      toast.success("Rule updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/admin/pricing?id=${rule.id}&type=rule`, { method: "DELETE" });
    onDelete(rule.id);
    toast.success("Rule deleted");
  }

  return (
    <div className={`grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-lg transition-colors ${!rule.isActive ? "opacity-50" : ""} ${editing ? "bg-zinc-50" : "hover:bg-zinc-50"}`}>
      {editing ? (
        <>
          <div className="col-span-4">
            <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="h-7 text-xs" />
          </div>
          <div className="col-span-2">
            <Input type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" step="0.01" />
          </div>
          <div className="col-span-3">
            <Input value={draft.condition ?? ""} onChange={(e) => setDraft({ ...draft, condition: e.target.value || null })} className="h-7 text-xs" placeholder="condition" />
          </div>
          <div className="col-span-1 flex justify-center">
            <Switch checked={draft.isActive} onCheckedChange={(v) => setDraft({ ...draft, isActive: v })} />
          </div>
          <div className="col-span-2 flex justify-end gap-1">
            <Button size="icon" className="h-6 w-6" onClick={save} loading={saving}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setDraft(rule); setEditing(false); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="col-span-4">
            <p className="text-xs font-medium text-zinc-800">{rule.label}</p>
            <p className="text-xs text-zinc-400">{rule.key}</p>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-mono text-zinc-700">
              {rule.type === "multiplier" ? `${rule.value.toFixed(2)}×` : formatCurrency(rule.value)}
            </span>
          </div>
          <div className="col-span-3">
            {rule.condition ? (
              <span className="text-xs text-zinc-500 font-mono">{rule.condition}</span>
            ) : (
              <span className="text-xs text-zinc-300">—</span>
            )}
          </div>
          <div className="col-span-1 flex justify-center">
            <Badge variant={rule.isActive ? "success" : "secondary"} className="text-xs">
              {rule.isActive ? "on" : "off"}
            </Badge>
          </div>
          <div className="col-span-2 flex justify-end gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={remove}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AddOnRow({ addOn, onSave, onDelete }: { addOn: AddOn; onSave: (a: AddOn) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(addOn);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "addon", data: draft }),
      });
      onSave(draft);
      setEditing(false);
      toast.success("Add-on updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this add-on?")) return;
    await fetch(`/api/admin/pricing?id=${addOn.id}&type=addon`, { method: "DELETE" });
    onDelete(addOn.id);
    toast.success("Add-on deleted");
  }

  return (
    <div className={`grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-lg transition-colors ${editing ? "bg-zinc-50" : "hover:bg-zinc-50"}`}>
      {editing ? (
        <>
          <div className="col-span-4">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-7 text-xs" />
          </div>
          <div className="col-span-4">
            <Input value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="h-7 text-xs" placeholder="description" />
          </div>
          <div className="col-span-2">
            <Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" />
          </div>
          <div className="col-span-2 flex justify-end gap-1">
            <Button size="icon" className="h-6 w-6" onClick={save} loading={saving}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setDraft(addOn); setEditing(false); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="col-span-4">
            <p className="text-xs font-medium text-zinc-800">{addOn.name}</p>
          </div>
          <div className="col-span-4">
            <p className="text-xs text-zinc-500 truncate">{addOn.description ?? "—"}</p>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-mono text-zinc-700">{formatCurrency(addOn.price)}</span>
          </div>
          <div className="col-span-2 flex justify-end gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={remove}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminPanel({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);

  function updateRule(catId: string, updated: PricingRule) {
    setCategories((cats) =>
      cats.map((c) =>
        c.id === catId ? { ...c, pricingRules: c.pricingRules.map((r) => (r.id === updated.id ? updated : r)) } : c
      )
    );
  }

  function deleteRule(catId: string, ruleId: string) {
    setCategories((cats) =>
      cats.map((c) => (c.id === catId ? { ...c, pricingRules: c.pricingRules.filter((r) => r.id !== ruleId) } : c))
    );
  }

  function updateAddOn(catId: string, updated: AddOn) {
    setCategories((cats) =>
      cats.map((c) =>
        c.id === catId ? { ...c, addOns: c.addOns.map((a) => (a.id === updated.id ? updated : a)) } : c
      )
    );
  }

  function deleteAddOn(catId: string, addOnId: string) {
    setCategories((cats) =>
      cats.map((c) => (c.id === catId ? { ...c, addOns: c.addOns.filter((a) => a.id !== addOnId) } : c))
    );
  }

  return (
    <Tabs defaultValue={categories[0]?.slug ?? ""}>
      <TabsList className="mb-4">
        {categories.map((cat) => (
          <TabsTrigger key={cat.slug} value={cat.slug}>{cat.name}</TabsTrigger>
        ))}
      </TabsList>

      {categories.map((cat) => (
        <TabsContent key={cat.slug} value={cat.slug} className="space-y-6">
          {/* Pricing Rules */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Pricing Rules</p>
                <p className="text-xs text-zinc-500">{cat.pricingRules.length} rules · Edit values to change pricing instantly</p>
              </div>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 mb-1">
                <p className="col-span-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Label / Key</p>
                <p className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Value</p>
                <p className="col-span-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Condition</p>
                <p className="col-span-1 text-xs font-medium text-zinc-400 uppercase tracking-wide">Active</p>
                <p className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Actions</p>
              </div>
              <Separator className="mb-1" />
              {cat.pricingRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onSave={(r) => updateRule(cat.id, r)}
                  onDelete={(id) => deleteRule(cat.id, id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Add-ons */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Add-ons</p>
                <p className="text-xs text-zinc-500">{cat.addOns.length} add-ons available</p>
              </div>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 mb-1">
                <p className="col-span-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Name</p>
                <p className="col-span-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Description</p>
                <p className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Price</p>
                <p className="col-span-2 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Actions</p>
              </div>
              <Separator className="mb-1" />
              {cat.addOns.map((ao) => (
                <AddOnRow
                  key={ao.id}
                  addOn={ao}
                  onSave={(a) => updateAddOn(cat.id, a)}
                  onDelete={(id) => deleteAddOn(cat.id, id)}
                />
              ))}
            </div>
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
