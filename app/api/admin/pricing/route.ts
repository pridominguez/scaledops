import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export async function GET() {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      pricingRules: { orderBy: { sortOrder: "asc" } },
      addOns: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

const UpdateRuleSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
  isActive: z.boolean().optional(),
  condition: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  if (body.type === "rule") {
    const parsed = UpdateRuleSchema.safeParse(body.data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const rule = await prisma.pricingRule.update({
      where: { id: parsed.data.id },
      data: {
        label: parsed.data.label,
        value: parsed.data.value,
        isActive: parsed.data.isActive,
        condition: parsed.data.condition,
        description: parsed.data.description,
      },
    });
    return NextResponse.json(rule);
  }

  if (body.type === "addon") {
    const addon = await prisma.addOn.update({
      where: { id: body.data.id },
      data: {
        name: body.data.name,
        price: body.data.price,
        description: body.data.description,
        isActive: body.data.isActive,
      },
    });
    return NextResponse.json(addon);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === "rule") {
    const category = await prisma.serviceCategory.findUnique({ where: { slug: body.categorySlug } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const rule = await prisma.pricingRule.create({
      data: {
        categoryId: category.id,
        key: body.data.key,
        label: body.data.label,
        type: body.data.ruleType,
        value: body.data.value,
        unit: body.data.unit ?? null,
        condition: body.data.condition ?? null,
        description: body.data.description ?? null,
        sortOrder: body.data.sortOrder ?? 99,
      },
    });
    return NextResponse.json(rule, { status: 201 });
  }

  if (body.type === "addon") {
    const category = await prisma.serviceCategory.findUnique({ where: { slug: body.categorySlug } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const addon = await prisma.addOn.create({
      data: {
        categoryId: category.id,
        key: body.data.key,
        name: body.data.name,
        description: body.data.description ?? null,
        price: body.data.price,
      },
    });
    return NextResponse.json(addon, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !type) return NextResponse.json({ error: "Missing id or type" }, { status: 400 });

  if (type === "rule") {
    await prisma.pricingRule.delete({ where: { id } });
  } else if (type === "addon") {
    await prisma.addOn.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
