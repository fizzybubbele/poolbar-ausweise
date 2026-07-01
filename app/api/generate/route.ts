import { NextRequest, NextResponse } from "next/server";
import {
  extractPhotosFromZip,
  parseDataFile,
} from "@/lib/parsers/csv-xlsx";
import { renderBadges } from "@/lib/pdf/renderer";
import { buildExportBundle } from "@/lib/export";
import {
  getValidRecords,
  pickPreviewRecords,
  validateRecords,
} from "@/lib/validation";
import type { GenerateOptions } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function parseOptions(formData: FormData): GenerateOptions {
  const startId = Number(formData.get("startId") ?? "1001");
  const mhd = String(formData.get("mhd") ?? "07/08/26").trim();
  return {
    startId: Number.isFinite(startId) ? startId : 1001,
    mhd,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dataFile = formData.get("dataFile");
    const photoZip = formData.get("photoZip");
    const mode = String(formData.get("mode") ?? "preview");
    const options = parseOptions(formData);

    if (!(dataFile instanceof File)) {
      return NextResponse.json(
        { error: "Datendatei fehlt" },
        { status: 400 }
      );
    }

    const dataBuffer = Buffer.from(await dataFile.arrayBuffer());
    const records = parseDataFile(dataBuffer, dataFile.name);

    if (records.length === 0) {
      return NextResponse.json(
        { error: "Keine Datensätze gefunden" },
        { status: 400 }
      );
    }

    let photos: Record<string, Buffer> = {};
    if (photoZip instanceof File && photoZip.size > 0) {
      const zipBuffer = Buffer.from(await photoZip.arrayBuffer());
      photos = await extractPhotosFromZip(zipBuffer);
    }

    const errors = validateRecords(records, photos, true);
    const validRecords = getValidRecords(records, errors);

    if (mode === "validate") {
      return NextResponse.json({
        records,
        errors,
        validCount: validRecords.length,
        totalCount: records.length,
        photoCount: Object.keys(photos).length,
      });
    }

    const targetRecords =
      mode === "preview"
        ? pickPreviewRecords(validRecords)
        : validRecords;

    if (targetRecords.length === 0) {
      return NextResponse.json(
        {
          error: "Keine gültigen Datensätze für die Generierung",
          errors,
        },
        { status: 400 }
      );
    }

    const pdfs = await renderBadges(targetRecords, options, photos);

    if (mode === "preview") {
      const merged = pdfs.length === 1 ? pdfs[0].bytes : await import("@/lib/pdf/renderer").then(m => m.mergePdfs(pdfs));
      return new NextResponse(Buffer.from(merged), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="vorschau.pdf"',
          "X-Validation-Errors": JSON.stringify(errors),
        },
      });
    }

    const { mergedPdf, zipBytes } = await buildExportBundle(pdfs);

    return NextResponse.json({
      errors,
      generatedCount: pdfs.length,
      zipBase64: Buffer.from(zipBytes!).toString("base64"),
      mergedBase64: Buffer.from(mergedPdf!).toString("base64"),
      filenames: pdfs.map((p) => p.filename),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Generierung fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", templates: ["MA", "BL"] });
}
