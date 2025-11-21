import type { Template } from "@/types/job";

// Map token symbols to templates that are available for that token.
const TOKEN_TEMPLATE_MAP: Record<string, string[]> = {
  ETH: ["balance-maintainer"],
  "*": [""],
};

export function filterTemplatesForToken(
  symbol: string | undefined | null,
  allTemplates: Template[],
): Template[] {
  const key = symbol?.toUpperCase() || "*";
  const allowed = TOKEN_TEMPLATE_MAP[key] || TOKEN_TEMPLATE_MAP["*"];
  return allTemplates.filter((t) => allowed.includes(t.id));
}
