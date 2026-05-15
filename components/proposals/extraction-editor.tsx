"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Brain, CheckCircle2, RefreshCw } from "lucide-react";

interface ExtractionEditorProps {
  categorySlug: string;
  extractedData: Record<string, unknown>;
  confidence: number;
  ambiguities: string[];
  reasoning: string;
  onUpdate: (data: Record<string, unknown>) => void;
  onReExtract: () => void;
  extracting: boolean;
}

const FIELD_CONFIGS: Record<string, Record<string, { label: string; type: "number" | "boolean" | "enum"; options?: string[] }>> = {
  "blog-writing": {
    wordCount: { label: "Word Count", type: "number" },
    seoOptimized: { label: "SEO Optimized", type: "boolean" },
    researchDepth: { label: "Research Depth", type: "enum", options: ["low", "medium", "high"] },
    technicalComplexity: { label: "Technical Topic", type: "boolean" },
    interviewsRequired: { label: "Expert Interviews", type: "boolean" },
    turnaroundDays: { label: "Turnaround (days)", type: "number" },
    revisions: { label: "Revision Rounds", type: "number" },
  },
  "website-development": {
    pageCount: { label: "Number of Pages", type: "number" },
    cmsRequired: { label: "CMS Integration", type: "boolean" },
    customDesign: { label: "Custom Design", type: "boolean" },
    animations: { label: "Advanced Animations", type: "boolean" },
    authentication: { label: "Authentication System", type: "boolean" },
    dashboard: { label: "Admin Dashboard", type: "boolean" },
    integrationsCount: { label: "Integrations Count", type: "number" },
    seo: { label: "SEO Optimization", type: "boolean" },
    ecommerce: { label: "E-Commerce", type: "boolean" },
    timelineWeeks: { label: "Timeline (weeks)", type: "number" },
    revisions: { label: "Revision Rounds", type: "number" },
  },
  "video-production": {
    durationMinutes: { label: "Duration (minutes)", type: "number" },
    shootingDays: { label: "Shooting Days", type: "number" },
    actorsCount: { label: "Number of Actors", type: "number" },
    motionGraphics: { label: "Motion Graphics", type: "boolean" },
    editingComplexity: { label: "Editing Complexity", type: "enum", options: ["simple", "medium", "high"] },
    scriptWriting: { label: "Script Writing", type: "boolean" },
    voiceOver: { label: "Voice Over", type: "boolean" },
    subtitles: { label: "Subtitles/Captions", type: "boolean" },
    deliveryDays: { label: "Delivery (days)", type: "number" },
    revisions: { label: "Revision Rounds", type: "number" },
  },
};

export function ExtractionEditor({
  categorySlug,
  extractedData,
  confidence,
  ambiguities,
  reasoning,
  onUpdate,
  onReExtract,
  extracting,
}: ExtractionEditorProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const fields = FIELD_CONFIGS[categorySlug] ?? {};

  function updateField(key: string, value: unknown) {
    onUpdate({ ...extractedData, [key]: value });
  }

  const confidencePct = Math.round(confidence * 100);
  const confidenceVariant = confidence >= 0.8 ? "success" : confidence >= 0.6 ? "warning" : "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Brain className="h-4 w-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">AI Extraction</p>
            <p className="text-xs text-zinc-500">Review and edit before pricing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <Badge variant={confidenceVariant} className="text-xs">
              {confidencePct}% confidence
            </Badge>
            <div className="mt-1 w-24">
              <Progress value={confidencePct} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onReExtract} loading={extracting}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Ambiguities */}
      {ambiguities.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Ambiguous fields — please review</span>
          </div>
          {ambiguities.map((a, i) => (
            <p key={i} className="text-xs text-amber-600 pl-5">{a}</p>
          ))}
        </div>
      )}

      {/* Fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(fields).map(([key, config]) => {
          const value = extractedData[key];
          const isAmbiguous = ambiguities.some((a) => a.toLowerCase().includes(key.toLowerCase().replace(/_/g, " ")));

          return (
            <div
              key={key}
              className={`space-y-1.5 rounded-lg p-3 transition-colors ${
                isAmbiguous ? "bg-amber-50 border border-amber-200" : "bg-zinc-50 border border-zinc-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{config.label}</Label>
                {isAmbiguous && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              </div>

              {config.type === "boolean" ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(value)}
                    onCheckedChange={(checked) => updateField(key, checked)}
                    id={key}
                  />
                  <label htmlFor={key} className="text-xs text-zinc-600">
                    {value ? "Yes" : "No"}
                  </label>
                </div>
              ) : config.type === "enum" ? (
                <Select value={String(value ?? "")} onValueChange={(v) => updateField(key, v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options?.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  value={String(value ?? "")}
                  onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                  min={0}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Reasoning toggle */}
      {reasoning && (
        <div>
          <button
            type="button"
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {showReasoning ? "Hide" : "Show"} AI reasoning
          </button>
          {showReasoning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 rounded-lg bg-zinc-50 border border-zinc-200 p-3"
            >
              <p className="text-xs text-zinc-600 leading-relaxed">{reasoning}</p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
