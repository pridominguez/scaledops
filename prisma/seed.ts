import { PrismaClient } from "@prisma/client";
import { DEFAULT_PRICING_CONFIG } from "../lib/pricing/config";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Blog Writing", slug: "blog-writing", description: "Professional blog posts and articles" },
  { name: "Website Development", slug: "website-development", description: "Custom websites and web applications" },
  { name: "Video Production", slug: "video-production", description: "Professional video content and production" },
];

async function main() {
  console.log("Seeding database...");

  for (const cat of CATEGORIES) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });

    const config = DEFAULT_PRICING_CONFIG[cat.slug];
    if (!config) continue;

    for (const rule of config.rules) {
      await prisma.pricingRule.upsert({
        where: { categoryId_key: { categoryId: category.id, key: rule.key } },
        update: {
          label: rule.label,
          type: rule.type,
          value: rule.value,
          unit: rule.unit ?? null,
          condition: rule.condition ?? null,
          description: rule.description ?? null,
          sortOrder: rule.sortOrder ?? 0,
        },
        create: {
          categoryId: category.id,
          key: rule.key,
          label: rule.label,
          type: rule.type,
          value: rule.value,
          unit: rule.unit ?? null,
          condition: rule.condition ?? null,
          description: rule.description ?? null,
          sortOrder: rule.sortOrder ?? 0,
        },
      });
    }

    for (const addon of config.addOns) {
      await prisma.addOn.upsert({
        where: { categoryId_key: { categoryId: category.id, key: addon.key } },
        update: { name: addon.name, description: addon.description ?? null, price: addon.price },
        create: {
          categoryId: category.id,
          key: addon.key,
          name: addon.name,
          description: addon.description ?? null,
          price: addon.price,
        },
      });
    }
  }

  console.log("Done seeding.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
