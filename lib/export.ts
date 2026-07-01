import JSZip from "jszip";
import type { GenerateResult } from "@/lib/types";
import { mergePdfs } from "@/lib/pdf/renderer";

export async function buildZip(
  pdfs: { filename: string; bytes: Uint8Array }[]
): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const pdf of pdfs) {
    zip.file(pdf.filename, pdf.bytes);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function buildExportBundle(
  pdfs: { filename: string; bytes: Uint8Array }[]
): Promise<Pick<GenerateResult, "mergedPdf" | "zipBytes">> {
  const [mergedPdf, zipBytes] = await Promise.all([
    mergePdfs(pdfs),
    buildZip(pdfs),
  ]);
  return { mergedPdf, zipBytes };
}
