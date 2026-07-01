import fs from "fs/promises";
import path from "path";
import type { TemplateConfig } from "@/lib/types";
import { normalizeRole } from "@/lib/parsers/name-role";
import maTemplate from "@/config/templates/ma-2026.json";
import blTemplate from "@/config/templates/bl-2026.json";

export const TEMPLATE_PDF_PATH = path.join(
  process.cwd(),
  "assets",
  "PB_Ausweise_2026_clean.pdf"
);

export const FONT_PATH = path.join(
  process.cwd(),
  "assets",
  "fonts",
  "ABCCameraPlain-Medium.otf"
);

export const TEMPLATES: Record<"MA" | "BL", TemplateConfig> = {
  MA: maTemplate as TemplateConfig,
  BL: blTemplate as TemplateConfig,
};

export function getTemplateForRole(rolle: string): TemplateConfig | null {
  const normalized = normalizeRole(rolle);
  if (normalized === "MA") return TEMPLATES.MA;
  if (normalized === "BL") return TEMPLATES.BL;
  return null;
}

export async function loadTemplatePdfBytes(): Promise<Buffer> {
  return fs.readFile(TEMPLATE_PDF_PATH);
}

export async function loadFontBytes(): Promise<Buffer> {
  return fs.readFile(FONT_PATH);
}
