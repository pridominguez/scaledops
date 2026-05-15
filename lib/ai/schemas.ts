import { z } from "zod";

export const BlogWritingSchema = z.object({
  wordCount: z.number().int().min(100).max(10000).describe("Target word count for the article"),
  seoOptimized: z.boolean().describe("Whether SEO optimization is required"),
  researchDepth: z.enum(["low", "medium", "high"]).describe("Depth of research required"),
  technicalComplexity: z.boolean().describe("Whether the topic is highly technical"),
  interviewsRequired: z.boolean().describe("Whether expert interviews are needed"),
  turnaroundDays: z.number().int().min(1).max(60).describe("Number of days for delivery"),
  revisions: z.number().int().min(0).max(10).describe("Number of revision rounds included"),
});

export const WebsiteDevelopmentSchema = z.object({
  pageCount: z.number().int().min(1).max(100).describe("Number of pages in the website"),
  cmsRequired: z.boolean().describe("Whether a CMS is needed"),
  customDesign: z.boolean().describe("Whether custom design is required (not a template)"),
  animations: z.boolean().describe("Whether advanced animations are required"),
  authentication: z.boolean().describe("Whether user auth/login is needed"),
  dashboard: z.boolean().describe("Whether an admin dashboard is needed"),
  integrationsCount: z.number().int().min(0).max(20).describe("Number of third-party integrations"),
  seo: z.boolean().describe("Whether technical SEO optimization is included"),
  ecommerce: z.boolean().describe("Whether e-commerce functionality is needed"),
  timelineWeeks: z.number().int().min(1).max(52).describe("Timeline in weeks"),
  revisions: z.number().int().min(0).max(10).describe("Number of revision rounds"),
});

export const VideoProductionSchema = z.object({
  durationMinutes: z.number().min(0.5).max(120).describe("Final video duration in minutes"),
  shootingDays: z.number().int().min(0).max(30).describe("Number of days of shooting"),
  actorsCount: z.number().int().min(0).max(20).describe("Number of on-screen actors/talent"),
  motionGraphics: z.boolean().describe("Whether motion graphics are needed"),
  editingComplexity: z.enum(["simple", "medium", "high"]).describe("Complexity of editing required"),
  scriptWriting: z.boolean().describe("Whether script writing is needed"),
  voiceOver: z.boolean().describe("Whether voice-over is needed"),
  subtitles: z.boolean().describe("Whether subtitles or captions are needed"),
  deliveryDays: z.number().int().min(1).max(90).describe("Number of days for delivery"),
  revisions: z.number().int().min(0).max(10).describe("Number of revision rounds"),
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
