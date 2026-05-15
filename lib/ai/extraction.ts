import Anthropic from "@anthropic-ai/sdk";
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

Category: ${categorySlug}`;
}

// Zod v4 compatible schema introspection
function zodSchemaToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): object {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    required.push(key);
    const def = (value as unknown as { _def: { typeName: string; description?: string; values?: unknown[] } })._def;

    if (def.typeName === "ZodNumber") {
      properties[key] = { type: "number" };
    } else if (def.typeName === "ZodBoolean") {
      properties[key] = { type: "boolean" };
    } else if (def.typeName === "ZodEnum" || def.typeName === "ZodNativeEnum") {
      const opts = Array.isArray(def.values) ? def.values : Object.values(def.values ?? {});
      properties[key] = { type: "string", enum: opts };
    } else {
      properties[key] = { type: "string" };
    }
  }

  return { type: "object", properties, required };
}

async function extractWithAnthropic<T>(
  categorySlug: string,
  description: string,
  schema: z.ZodObject<z.ZodRawShape>,
  defaults: T
): Promise<ExtractionOutput<T>> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const dataSchema = zodSchemaToJsonSchema(schema);

  const tools: Anthropic.Tool[] = [
    {
      name: "extract_project_requirements",
      description: "Extract structured project requirements from the description",
      input_schema: {
        type: "object" as const,
        properties: {
          data: dataSchema,
          confidence: {
            type: "number",
            description: "Overall confidence score 0.0-1.0 for the extraction quality",
          },
          ambiguities: {
            type: "array",
            items: { type: "string" },
            description: "List of fields or aspects that were ambiguous or unclear",
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of your extraction decisions",
          },
        },
        required: ["data", "confidence", "ambiguities", "reasoning"],
      },
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: buildSystemPrompt(categorySlug),
    tools,
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: `Extract project requirements from this description:\n\n"${description}"`,
      },
    ],
  });

  const toolUse = response.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
  if (!toolUse) throw new Error("No tool use in response");

  const raw = toolUse.input as {
    data: unknown;
    confidence: number;
    ambiguities: string[];
    reasoning: string;
  };

  const merged = { ...defaults, ...(raw.data as Partial<T>) };
  const parsed = schema.safeParse(merged);
  const finalData = parsed.success ? (parsed.data as T) : merged;

  return {
    data: finalData,
    confidence: raw.confidence ?? 0.7,
    ambiguities: raw.ambiguities ?? [],
    reasoning: raw.reasoning ?? "",
    model: "claude-sonnet-4-6",
  };
}

export async function extractBlogWriting(
  description: string
): Promise<ExtractionOutput<BlogWritingExtraction>> {
  const defaults = CATEGORY_DEFAULTS["blog-writing"] as BlogWritingExtraction;
  if (!process.env.ANTHROPIC_API_KEY) {
    return { data: defaults, confidence: 0.5, ambiguities: ["API key not configured — using defaults"], reasoning: "No AI key configured", model: "none" };
  }
  return extractWithAnthropic("blog-writing", description, BlogWritingSchema, defaults);
}

export async function extractWebsiteDevelopment(
  description: string
): Promise<ExtractionOutput<WebsiteDevelopmentExtraction>> {
  const defaults = CATEGORY_DEFAULTS["website-development"] as WebsiteDevelopmentExtraction;
  if (!process.env.ANTHROPIC_API_KEY) {
    return { data: defaults, confidence: 0.5, ambiguities: ["API key not configured — using defaults"], reasoning: "No AI key configured", model: "none" };
  }
  return extractWithAnthropic("website-development", description, WebsiteDevelopmentSchema, defaults);
}

export async function extractVideoProduction(
  description: string
): Promise<ExtractionOutput<VideoProductionExtraction>> {
  const defaults = CATEGORY_DEFAULTS["video-production"] as VideoProductionExtraction;
  if (!process.env.ANTHROPIC_API_KEY) {
    return { data: defaults, confidence: 0.5, ambiguities: ["API key not configured — using defaults"], reasoning: "No AI key configured", model: "none" };
  }
  return extractWithAnthropic("video-production", description, VideoProductionSchema, defaults);
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
