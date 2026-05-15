import { z } from "zod";

// Use z.coerce so we accept string values from the AI (e.g. "12", "true")
const num = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max);
const numFloat = (min: number, max: number) =>
  z.coerce.number().min(min).max(max);
const bool = () =>
  z.preprocess((v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.toLowerCase().trim();
      if (s === "true" || s === "yes" || s === "1") return true;
      if (s === "false" || s === "no" || s === "0" || s === "") return false;
      // Anything non-empty/unknown → treat as true (e.g. "advanced", "required")
      return true;
    }
    if (typeof v === "number") return v !== 0;
    return false;
  }, z.boolean());

const researchEnum = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const s = v.toLowerCase().trim();
  if (["high", "deep", "extensive", "in-depth", "thorough"].some((x) => s.includes(x))) return "high";
  if (["medium", "moderate", "standard"].some((x) => s.includes(x))) return "medium";
  if (["low", "light", "basic", "minimal"].some((x) => s.includes(x))) return "low";
  return s;
}, z.enum(["low", "medium", "high"]));

const editingEnum = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const s = v.toLowerCase().trim();
  if (["high", "complex", "advanced", "heavy"].some((x) => s.includes(x))) return "high";
  if (["medium", "moderate", "intermediate"].some((x) => s.includes(x))) return "medium";
  if (["simple", "basic", "light", "low"].some((x) => s.includes(x))) return "simple";
  return s;
}, z.enum(["simple", "medium", "high"]));

export const BlogWritingSchema = z.object({
  wordCount: num(100, 10000),
  seoOptimized: bool(),
  researchDepth: researchEnum,
  technicalComplexity: bool(),
  interviewsRequired: bool(),
  turnaroundDays: num(1, 60),
  revisions: num(0, 10),
});

export const WebsiteDevelopmentSchema = z.object({
  pageCount: num(1, 100),
  cmsRequired: bool(),
  customDesign: bool(),
  animations: bool(),
  authentication: bool(),
  dashboard: bool(),
  integrationsCount: num(0, 20),
  seo: bool(),
  ecommerce: bool(),
  timelineWeeks: num(1, 52),
  revisions: num(0, 10),
});

export const VideoProductionSchema = z.object({
  durationMinutes: numFloat(0.5, 120),
  shootingDays: num(0, 30),
  actorsCount: num(0, 20),
  motionGraphics: bool(),
  editingComplexity: editingEnum,
  scriptWriting: bool(),
  voiceOver: bool(),
  subtitles: bool(),
  deliveryDays: num(1, 90),
  revisions: num(0, 10),
});

export type BlogWritingExtraction = z.infer<typeof BlogWritingSchema>;
export type WebsiteDevelopmentExtraction = z.infer<typeof WebsiteDevelopmentSchema>;
export type VideoProductionExtraction = z.infer<typeof VideoProductionSchema>;

export type ExtractionSchema =
  | typeof BlogWritingSchema
  | typeof WebsiteDevelopmentSchema
  | typeof VideoProductionSchema;

export const CATEGORY_SCHEMAS: Record<string, ExtractionSchema> = {
  "blog-writing": BlogWritingSchema,
  "website-development": WebsiteDevelopmentSchema,
  "video-production": VideoProductionSchema,
};

export const CATEGORY_DEFAULTS: Record<string, unknown> = {
  "blog-writing": {
    wordCount: 1000,
    seoOptimized: false,
    researchDepth: "low",
    technicalComplexity: false,
    interviewsRequired: false,
    turnaroundDays: 7,
    revisions: 1,
  } satisfies BlogWritingExtraction,
  "website-development": {
    pageCount: 5,
    cmsRequired: false,
    customDesign: false,
    animations: false,
    authentication: false,
    dashboard: false,
    integrationsCount: 0,
    seo: false,
    ecommerce: false,
    timelineWeeks: 8,
    revisions: 2,
  } satisfies WebsiteDevelopmentExtraction,
  "video-production": {
    durationMinutes: 3,
    shootingDays: 1,
    actorsCount: 0,
    motionGraphics: false,
    editingComplexity: "simple",
    scriptWriting: false,
    voiceOver: false,
    subtitles: false,
    deliveryDays: 14,
    revisions: 1,
  } satisfies VideoProductionExtraction,
};
