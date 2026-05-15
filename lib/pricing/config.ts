export type PricingRuleType = "base" | "per_unit" | "multiplier" | "conditional";

export interface PricingRuleConfig {
  key: string;
  label: string;
  type: PricingRuleType;
  value: number;
  unit?: string;
  condition?: string;
  description?: string;
  sortOrder?: number;
}

export interface AddOnConfig {
  key: string;
  name: string;
  description?: string;
  price: number;
}

export interface CategoryPricingConfig {
  rules: PricingRuleConfig[];
  addOns: AddOnConfig[];
}

export const DEFAULT_PRICING_CONFIG: Record<string, CategoryPricingConfig> = {
  "blog-writing": {
    rules: [
      { key: "base_fee", label: "Base Fee", type: "base", value: 150, sortOrder: 1 },
      { key: "per_500_words", label: "Per 500 Words", type: "per_unit", value: 75, unit: "per_500_words", sortOrder: 2 },
      { key: "seo_optimization", label: "SEO Optimization", type: "base", value: 100, sortOrder: 3 },
      { key: "technical_topic", label: "Technical Topic Premium", type: "base", value: 250, sortOrder: 4 },
      { key: "interviews_required", label: "Expert Interviews", type: "base", value: 200, sortOrder: 5 },
      { key: "research_medium", label: "Medium Research Depth", type: "multiplier", value: 1.2, condition: "researchDepth=medium", sortOrder: 6 },
      { key: "research_high", label: "High Research Depth", type: "multiplier", value: 1.5, condition: "researchDepth=high", sortOrder: 7 },
      { key: "rush_delivery", label: "Rush Delivery (<3 days)", type: "multiplier", value: 1.4, condition: "turnaroundDays<3", sortOrder: 8 },
      { key: "premium_package", label: "Premium Package", type: "multiplier", value: 1.35, condition: "package=premium", sortOrder: 9 },
    ],
    addOns: [
      { key: "social_posts", name: "Social Media Posts", description: "3 social posts adapted from the article", price: 150 },
      { key: "newsletter_version", name: "Newsletter Version", description: "Email-formatted version of the article", price: 100 },
      { key: "keyword_research", name: "Keyword Research", description: "In-depth keyword analysis and targeting", price: 200 },
      { key: "internal_linking", name: "Internal Linking Strategy", description: "Strategic internal links added throughout", price: 75 },
      { key: "meta_descriptions", name: "Meta Descriptions", description: "Custom meta title and description", price: 50 },
    ],
  },
  "website-development": {
    rules: [
      { key: "base_fee", label: "Base Website Fee", type: "base", value: 2000, sortOrder: 1 },
      { key: "per_page", label: "Per Page", type: "per_unit", value: 300, unit: "per_page", sortOrder: 2 },
      { key: "cms_integration", label: "CMS Integration", type: "base", value: 800, sortOrder: 3 },
      { key: "custom_design", label: "Custom Design", type: "base", value: 1500, sortOrder: 4 },
      { key: "animations", label: "Advanced Animations", type: "base", value: 1200, sortOrder: 5 },
      { key: "authentication", label: "Authentication System", type: "base", value: 2000, sortOrder: 6 },
      { key: "dashboard", label: "Admin Dashboard", type: "base", value: 3000, sortOrder: 7 },
      { key: "seo", label: "SEO Optimization", type: "base", value: 500, sortOrder: 8 },
      { key: "ecommerce", label: "E-Commerce", type: "base", value: 2500, sortOrder: 9 },
      { key: "per_integration", label: "Per Integration", type: "per_unit", value: 400, unit: "per_integration", sortOrder: 10 },
      { key: "rush_delivery", label: "Rush Delivery (<4 weeks)", type: "multiplier", value: 1.5, condition: "timelineWeeks<4", sortOrder: 11 },
      { key: "premium_package", label: "Premium Package", type: "multiplier", value: 1.35, condition: "package=premium", sortOrder: 12 },
    ],
    addOns: [
      { key: "analytics_dashboard", name: "Analytics Dashboard", description: "Custom analytics dashboard integration", price: 800 },
      { key: "blog_setup", name: "Blog Setup", description: "Full blog with categories and tags", price: 600 },
      { key: "maintenance_plan", name: "Monthly Maintenance Plan", description: "3 months of updates and support", price: 1200 },
      { key: "additional_pages", name: "5 Additional Pages", description: "Five extra content pages", price: 1200 },
      { key: "seo_monitoring", name: "SEO Monitoring (3 months)", description: "Rank tracking and monthly reports", price: 900 },
      { key: "performance_optimization", name: "Performance Optimization", description: "Core Web Vitals & speed optimization", price: 700 },
    ],
  },
  "video-production": {
    rules: [
      { key: "base_fee", label: "Base Production Fee", type: "base", value: 1000, sortOrder: 1 },
      { key: "per_minute", label: "Per Minute of Video", type: "per_unit", value: 500, unit: "per_minute", sortOrder: 2 },
      { key: "per_shooting_day", label: "Per Shooting Day", type: "per_unit", value: 800, unit: "per_shooting_day", sortOrder: 3 },
      { key: "motion_graphics", label: "Motion Graphics", type: "base", value: 1200, sortOrder: 4 },
      { key: "voice_over", label: "Voice Over", type: "base", value: 400, sortOrder: 5 },
      { key: "subtitles", label: "Subtitles/Captions", type: "base", value: 200, sortOrder: 6 },
      { key: "script_writing", label: "Script Writing", type: "base", value: 600, sortOrder: 7 },
      { key: "per_actor", label: "Per Actor", type: "per_unit", value: 300, unit: "per_actor", sortOrder: 8 },
      { key: "editing_medium", label: "Medium Editing Complexity", type: "multiplier", value: 1.3, condition: "editingComplexity=medium", sortOrder: 9 },
      { key: "editing_high", label: "High Editing Complexity", type: "multiplier", value: 1.6, condition: "editingComplexity=high", sortOrder: 10 },
      { key: "rush_delivery", label: "Rush Delivery (<7 days)", type: "multiplier", value: 1.4, condition: "deliveryDays<7", sortOrder: 11 },
      { key: "premium_package", label: "Premium Package", type: "multiplier", value: 1.35, condition: "package=premium", sortOrder: 12 },
    ],
    addOns: [
      { key: "extra_revisions", name: "Extra Revisions (3)", description: "Three additional revision rounds", price: 300 },
      { key: "short_clips", name: "Short-form Clips (5)", description: "5 social-media-ready short clips", price: 600 },
      { key: "thumbnail_design", name: "Thumbnail Design", description: "Custom thumbnail for YouTube/social", price: 150 },
      { key: "translations", name: "Subtitle Translations (2 languages)", description: "Professional translation of subtitles", price: 400 },
      { key: "additional_voice_over", name: "Additional Voice Over Language", description: "Voice over in a second language", price: 500 },
      { key: "color_grading", name: "Color Grading", description: "Professional color grading and correction", price: 400 },
    ],
  },
};
