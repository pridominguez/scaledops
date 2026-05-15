"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, FileText, Globe, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    slug: "blog-writing",
    name: "Blog Writing",
    icon: FileText,
    description: "Articles, posts & content",
    color: "blue",
    examples: ["1500-word technical article with SEO", "Weekly blog series, 5 posts"],
  },
  {
    slug: "website-development",
    name: "Website Development",
    icon: Globe,
    description: "Web apps & landing pages",
    color: "purple",
    examples: ["5-page marketing site with CMS", "E-commerce store with auth"],
  },
  {
    slug: "video-production",
    name: "Video Production",
    icon: Video,
    description: "Videos, ads & motion",
    color: "green",
    examples: ["3-minute product demo video", "Brand story with motion graphics"],
  },
];

const EXAMPLE_PROMPTS: Record<string, string> = {
  "blog-writing":
    "We need a comprehensive 2,500-word technical article on microservices architecture for our engineering blog. It should be SEO-optimized with in-depth research, include expert interviews, and be delivered within 5 days with 2 revision rounds.",
  "website-development":
    "We need a 5-page marketing website with CMS integration, advanced animations, SEO optimization, and delivery within 3 weeks. We also need an authentication system for a client portal.",
  "video-production":
    "We need a 4-minute brand story video with 2 shooting days, 3 on-screen presenters, professional voice-over, motion graphics for key stats, and subtitles. Delivered in 2 weeks.",
};

export function ProposalForm() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [complexity, setComplexity] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || description.trim().length < 20) {
      toast.error("Please select a category and describe your project");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug: selectedCategory,
          clientDescription: description.trim(),
          budget: budget ? parseFloat(budget) : undefined,
          timeline: timeline || undefined,
          complexity: complexity || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create proposal");
      const proposal = await res.json();
      toast.success("Proposal created — extracting requirements…");
      router.push(`/proposals/${proposal.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Category selector */}
      <div className="space-y-3">
        <Label>Project Category</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  if (!description) setDescription(EXAMPLE_PROMPTS[cat.slug] || "");
                }}
                className={cn(
                  "relative flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-150",
                  isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-2", isSelected ? "text-white" : "text-zinc-500")} />
                <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-zinc-900")}>
                  {cat.name}
                </span>
                <span className={cn("text-xs mt-0.5", isSelected ? "text-zinc-300" : "text-zinc-400")}>
                  {cat.description}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="selected-indicator"
                    className="absolute top-3 right-3 h-2 w-2 rounded-full bg-white"
                    transition={{ duration: 0.15 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Project Description</Label>
              <span className="text-xs text-zinc-400">{description.length} chars</span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project in detail — the more context, the better the pricing estimate…"
              className="min-h-[160px] text-sm leading-relaxed"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.find((c) => c.slug === selectedCategory)?.examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setDescription(ex)}
                  className="text-xs px-2 py-1 rounded-md border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional fields */}
      <AnimatePresence>
        {selectedCategory && description.length > 20 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="10,000"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeline">Timeline (optional)</Label>
              <Input
                id="timeline"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. Q2 2025"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Complexity (optional)</Label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <AnimatePresence>
        {selectedCategory && description.length > 20 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Proposal
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-2 text-xs text-zinc-400">
              AI extracts requirements · Deterministic pricing · Instant packages
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
