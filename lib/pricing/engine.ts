import type { PricingRule } from "@prisma/client";

export interface PricingLineItem {
  key: string;
  label: string;
  amount: number;
  type: "base" | "per_unit" | "multiplier" | "conditional";
  isMultiplier?: boolean;
  multiplierValue?: number;
}

export interface PricingBreakdown {
  lineItems: PricingLineItem[];
  subtotal: number;
  multipliers: PricingLineItem[];
  multiplierTotal: number;
  total: number;
}

export interface BlogWritingInputs {
  wordCount: number;
  seoOptimized: boolean;
  researchDepth: "low" | "medium" | "high";
  technicalComplexity: boolean;
  interviewsRequired: boolean;
  turnaroundDays: number;
  revisions: number;
}

export interface WebsiteDevelopmentInputs {
  pageCount: number;
  cmsRequired: boolean;
  customDesign: boolean;
  animations: boolean;
  authentication: boolean;
  dashboard: boolean;
  integrationsCount: number;
  seo: boolean;
  ecommerce: boolean;
  timelineWeeks: number;
  revisions: number;
}

export interface VideoProductionInputs {
  durationMinutes: number;
  shootingDays: number;
  actorsCount: number;
  motionGraphics: boolean;
  editingComplexity: "simple" | "medium" | "high";
  scriptWriting: boolean;
  voiceOver: boolean;
  subtitles: boolean;
  deliveryDays: number;
  revisions: number;
}

export type ExtractionInputs =
  | BlogWritingInputs
  | WebsiteDevelopmentInputs
  | VideoProductionInputs;

function evaluateCondition(condition: string, inputs: Record<string, unknown>): boolean {
  const ltMatch = condition.match(/^(\w+)<(\d+\.?\d*)$/);
  if (ltMatch) {
    const val = inputs[ltMatch[1]];
    return typeof val === "number" && val < parseFloat(ltMatch[2]);
  }
  const eqMatch = condition.match(/^(\w+)=(.+)$/);
  if (eqMatch) {
    return String(inputs[eqMatch[1]]) === eqMatch[2];
  }
  return false;
}

function resolveUnitCount(unit: string, inputs: Record<string, unknown>): number {
  switch (unit) {
    case "per_page": return (inputs.pageCount as number) || 1;
    case "per_500_words": return Math.ceil(((inputs.wordCount as number) || 500) / 500);
    case "per_minute": return (inputs.durationMinutes as number) || 1;
    case "per_shooting_day": return (inputs.shootingDays as number) || 1;
    case "per_integration": return (inputs.integrationsCount as number) || 0;
    case "per_actor": return (inputs.actorsCount as number) || 0;
    default: return 1;
  }
}

export function calculatePricing(
  rules: PricingRule[],
  inputs: ExtractionInputs,
  packageType: "standard" | "premium" = "standard"
): PricingBreakdown {
  const flatInputs: Record<string, unknown> = {
    ...(inputs as unknown as Record<string, unknown>),
    package: packageType,
  };

  const lineItems: PricingLineItem[] = [];
  const multipliers: PricingLineItem[] = [];

  const sortedRules = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const rule of sortedRules) {
    if (!rule.isActive) continue;

    if (rule.type === "multiplier") {
      if (rule.condition && !evaluateCondition(rule.condition, flatInputs)) continue;
      multipliers.push({
        key: rule.key,
        label: rule.label,
        amount: 0,
        type: "multiplier",
        isMultiplier: true,
        multiplierValue: rule.value,
      });
      continue;
    }

    if (rule.type === "base") {
      if (rule.condition && !evaluateCondition(rule.condition, flatInputs)) continue;
      const applies = !rule.condition || evaluateCondition(rule.condition, flatInputs);
      if (!applies) continue;

      // Check if this is a boolean feature — skip if false
      const featureKey = rule.key.replace(/_fee$/, "").replace(/_/, "");
      const directKey = rule.key.replace("_fee", "").replace(/_/g, "");
      const boolVal = flatInputs[rule.key.replace("_fee", "").replace(/_([a-z])/g, (_, c) => c.toUpperCase())] ??
        flatInputs[rule.key];

      // For named features, check corresponding bool input
      const featureLookup: Record<string, keyof ExtractionInputs> = {
        cms_integration: "cmsRequired" as keyof ExtractionInputs,
        custom_design: "customDesign" as keyof ExtractionInputs,
        animations: "animations" as keyof ExtractionInputs,
        authentication: "authentication" as keyof ExtractionInputs,
        dashboard: "dashboard" as keyof ExtractionInputs,
        seo: "seo" as keyof ExtractionInputs,
        ecommerce: "ecommerce" as keyof ExtractionInputs,
        seo_optimization: "seoOptimized" as keyof ExtractionInputs,
        technical_topic: "technicalComplexity" as keyof ExtractionInputs,
        interviews_required: "interviewsRequired" as keyof ExtractionInputs,
        motion_graphics: "motionGraphics" as keyof ExtractionInputs,
        voice_over: "voiceOver" as keyof ExtractionInputs,
        subtitles: "subtitles" as keyof ExtractionInputs,
        script_writing: "scriptWriting" as keyof ExtractionInputs,
      };

      if (featureLookup[rule.key]) {
        const inputVal = flatInputs[featureLookup[rule.key]];
        if (!inputVal) continue;
      }

      lineItems.push({ key: rule.key, label: rule.label, amount: rule.value, type: "base" });
    } else if (rule.type === "per_unit") {
      const count = resolveUnitCount(rule.unit || "", flatInputs);
      if (count <= 0) continue;
      const amount = count * rule.value;
      lineItems.push({
        key: rule.key,
        label: `${rule.label} (×${count})`,
        amount,
        type: "per_unit",
      });
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  let runningTotal = subtotal;
  const resolvedMultipliers: PricingLineItem[] = [];

  for (const m of multipliers) {
    const addedAmount = runningTotal * (m.multiplierValue! - 1);
    resolvedMultipliers.push({ ...m, amount: addedAmount });
    runningTotal += addedAmount;
  }

  const multiplierTotal = resolvedMultipliers.reduce((sum, m) => sum + m.amount, 0);

  return {
    lineItems,
    subtotal,
    multipliers: resolvedMultipliers,
    multiplierTotal,
    total: Math.round(subtotal + multiplierTotal),
  };
}

export function generatePackageFeatures(
  categorySlug: string,
  inputs: ExtractionInputs,
  packageType: "standard" | "premium"
): string[] {
  const features: string[] = [];

  if (categorySlug === "blog-writing") {
    const b = inputs as BlogWritingInputs;
    features.push(`${b.wordCount.toLocaleString()}-word article`);
    if (b.seoOptimized) features.push("SEO optimization & meta tags");
    if (packageType === "premium") {
      features.push("Priority 24-hour delivery window");
      features.push("Unlimited revisions (30 days)");
      features.push("Dedicated account manager");
      features.push("Performance analytics report");
    } else {
      features.push(`${b.revisions} revision round${b.revisions !== 1 ? "s" : ""}`);
      features.push(`${b.turnaroundDays}-day delivery`);
    }
    if (b.researchDepth === "high") features.push("In-depth research & expert sources");
    if (b.technicalComplexity) features.push("Technical subject matter expertise");
    if (b.interviewsRequired) features.push("Expert interview coordination");
  }

  if (categorySlug === "website-development") {
    const w = inputs as WebsiteDevelopmentInputs;
    features.push(`${w.pageCount}-page website`);
    if (w.cmsRequired) features.push("CMS integration");
    if (w.customDesign) features.push("Custom UI/UX design");
    if (w.animations) features.push("Advanced animations & micro-interactions");
    if (w.authentication) features.push("User authentication system");
    if (w.dashboard) features.push("Admin dashboard");
    if (w.ecommerce) features.push("E-commerce functionality");
    if (w.seo) features.push("Technical SEO optimization");
    if (w.integrationsCount > 0) features.push(`${w.integrationsCount} third-party integration${w.integrationsCount > 1 ? "s" : ""}`);
    if (packageType === "premium") {
      features.push("Priority support & dedicated PM");
      features.push("Extended 90-day post-launch support");
      features.push("Performance optimization included");
      features.push(`${w.revisions + 3} revision rounds`);
    } else {
      features.push(`${w.revisions} revision round${w.revisions !== 1 ? "s" : ""}`);
      features.push(`${w.timelineWeeks}-week delivery`);
    }
  }

  if (categorySlug === "video-production") {
    const v = inputs as VideoProductionInputs;
    features.push(`${v.durationMinutes}-minute final video`);
    if (v.shootingDays > 0) features.push(`${v.shootingDays} shooting day${v.shootingDays > 1 ? "s" : ""}`);
    if (v.scriptWriting) features.push("Script writing & storyboarding");
    if (v.motionGraphics) features.push("Custom motion graphics");
    if (v.voiceOver) features.push("Professional voice-over");
    if (v.subtitles) features.push("Subtitles & closed captions");
    if (v.actorsCount > 0) features.push(`${v.actorsCount} on-screen actor${v.actorsCount > 1 ? "s" : ""}`);
    if (packageType === "premium") {
      features.push("Priority 48-hour edit turnaround");
      features.push("Color grading & audio mastering");
      features.push("Unlimited revisions (30 days)");
      features.push("Raw footage delivery");
    } else {
      features.push(`${v.revisions} revision round${v.revisions !== 1 ? "s" : ""}`);
      features.push(`${v.deliveryDays}-day delivery`);
    }
  }

  return features;
}
