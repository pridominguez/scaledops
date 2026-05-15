import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import {
  BlogWritingSchema,
  WebsiteDevelopmentSchema,
  VideoProductionSchema,
  type BlogWritingExtraction,
  type WebsiteDevelopmentExtraction,
  type VideoProductionExtraction,
  CATEGORY_DEFAULTS,
} from "./schemas";

export interface ExtractionOutput<T> {
  data: T;
  confidence: number;
  ambiguities: string[];
  reasoning: string;
  model: string;
}

function buildSystemPrompt(categorySlug: string): string {
  return `You are a project requirements analyst for ScaledOps, a professional services agency.
Your task is to extract structured project parameters from natural language project descriptions.

CRITICAL RULES:
- You NEVER generate pricing or cost estimates
- You ONLY extract factual parameters from the description
- When information is ambiguous or missing, use reasonable professional defaults
- Flag any fields you are uncertain about in the ambiguities list
- Provide honest confidence scores (0.0 to 1.0) based on how clearly the description specifies requirements

Category: ${categorySlug}

Return your output as a valid JSON object with this exact shape:
{
  "data": { ...extracted fields per the schema... },
  "confidence": 0.0-1.0,
  "ambiguities": ["list of ambiguous fields or aspects"],
  "reasoning": "brief explanation of extraction decisions"
}`;
}

function zodSchemaToGeminiSchema(schema: z.ZodObject<z.ZodRawShape>): {
  type: SchemaType;
  properties: Record<string, { type: SchemaType; enum?: string[]; description?: string }>;
  required: string[];
} {
  const shape = schema.shape;
  const properties: Record<string, { type: SchemaType; enum?: string[]; description?: string }> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    required.push(key);
    const def = (value as unknown as { _def: { typeName: string; description?: string; values?: unknown[] } })._def;

    if (def.typeName === "ZodNumber") {
      properties[key] = { type: SchemaType.NUMBER };
    } else if (def.typeName === "ZodBoolean") {
      properties[key] = { type: SchemaType.BOOLEAN };
    } else if (def.typeName === "ZodEnum" || def.typeName === "ZodNativeEnum") {
      const opts = Array.isArray(def.values) ? def.values : Object.values(def.values ?? {});
      properties[key] = { type: SchemaType.STRING, enum: opts.map(String) };
    } else {
      properties[key] = { type: SchemaType.STRING };
    }
  }

  return { type: SchemaType.OBJECT, properties, required };
}

async function extractWithGemini<T>(
  categorySlug: string,
  description: string,
  schema: z.ZodObject<z.ZodRawShape>,
  defaults: T
): Promise<ExtractionOutput<T>> {
  const apiKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      data: defaults,
      confidence: 0.5,
      ambiguities: ["API key not configured — using defaults"],
      reasoning: "No AI key configured",
      model: "none",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const dataSchema = zodSchemaToGeminiSchema(schema);

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      data: dataSchema,
      confidence: { type: SchemaType.NUMBER },
      ambiguities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      reasoning: { type: SchemaType.STRING },
    },
    required: ["data", "confidence", "ambiguities", "reasoning"],
  };

  const MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(categorySlug),
        generationConfig: {
          responseMimeType: "application/json",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          responseSchema: responseSchema as any,
          temperature: 0.2,
        },
      });

      const result = await model.generateContent(
        `Extract project requirements from this description:\n\n"${description}"`
      );

      const text = result.response.text();
      const raw = JSON.parse(text) as {
        data: unknown;
        confidence: number;
        ambiguities: string[];
        reasoning: string;
      };

      // Coerce raw AI data through Zod, then merge with defaults for any missing fields
      const coerced = schema.safeParse(raw.data);
      const finalData: T = coerced.success
        ? (coerced.data as T)
        : ({ ...defaults, ...(raw.data as Partial<T>) } as T);

      return {
        data: finalData,
        confidence: raw.confidence ?? 0.7,
        ambiguities: raw.ambiguities ?? [],
        reasoning: raw.reasoning ?? "",
        model: modelName,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[extraction] ${modelName} failed: ${message.substring(0, 200)}`);
      // Try next model only on rate-limit / quota errors
      if (!message.includes("429") && !message.includes("quota") && !message.includes("RATE_LIMIT")) {
        // Non-quota error — fall back to defaults
        return {
          data: defaults,
          confidence: 0.4,
          ambiguities: [`AI extraction failed: ${message.substring(0, 120)} — review defaults manually`],
          reasoning: "Extraction error; defaults shown",
          model: "fallback",
        };
      }
    }
  }

  // All models exhausted quota
  return {
    data: defaults,
    confidence: 0.4,
    ambiguities: ["Gemini quota exhausted across all models — using defaults. Edit fields below."],
    reasoning: "All Gemini models are rate-limited. Please review and adjust the defaults below.",
    model: "fallback-quota",
  };
}

export async function extractBlogWriting(
  description: string
): Promise<ExtractionOutput<BlogWritingExtraction>> {
  const defaults = CATEGORY_DEFAULTS["blog-writing"] as BlogWritingExtraction;
  return extractWithGemini("blog-writing", description, BlogWritingSchema, defaults);
}

export async function extractWebsiteDevelopment(
  description: string
): Promise<ExtractionOutput<WebsiteDevelopmentExtraction>> {
  const defaults = CATEGORY_DEFAULTS["website-development"] as WebsiteDevelopmentExtraction;
  return extractWithGemini("website-development", description, WebsiteDevelopmentSchema, defaults);
}

export async function extractVideoProduction(
  description: string
): Promise<ExtractionOutput<VideoProductionExtraction>> {
  const defaults = CATEGORY_DEFAULTS["video-production"] as VideoProductionExtraction;
  return extractWithGemini("video-production", description, VideoProductionSchema, defaults);
}

export async function extractProjectRequirements(
  categorySlug: string,
  description: string
): Promise<ExtractionOutput<unknown>> {
  switch (categorySlug) {
    case "blog-writing":
      return extractBlogWriting(description);
    case "website-development":
      return extractWebsiteDevelopment(description);
    case "video-production":
      return extractVideoProduction(description);
    default:
      throw new Error(`Unknown category: ${categorySlug}`);
  }
}
