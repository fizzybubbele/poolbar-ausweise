import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import sharp from "sharp";
import type {
  GenerateOptions,
  PersonRecord,
  RgbColor,
  TemplateConfig,
  TextFieldConfig,
} from "@/lib/types";
import {
  getTemplateForRole,
  loadFontBytes,
  loadTemplatePdfBytes,
} from "@/lib/pdf/templates";

function toRgb(color: RgbColor) {
  return rgb(color.r, color.g, color.b);
}

async function preparePhoto(
  photoBytes: Buffer,
  width: number,
  height: number
): Promise<{ bytes: Buffer; kind: "png" | "jpg" }> {
  const png = await sharp(photoBytes)
    .rotate()
    .resize(Math.round(width * 4), Math.round(height * 4), {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  return { bytes: png, kind: "png" };
}

const TEXT_BLACK: RgbColor = { r: 0, g: 0, b: 0 };

function drawFieldText(
  page: PDFPage,
  field: TextFieldConfig,
  text: string,
  font: PDFFont,
  fontSize: number
) {
  page.drawText(text, {
    x: field.textX,
    y: field.textBaselineY,
    size: fontSize,
    font,
    color: toRgb(TEXT_BLACK),
  });
}

export async function renderBadge(
  record: PersonRecord,
  options: GenerateOptions,
  photoBytes?: Buffer
): Promise<Uint8Array> {
  const template = getTemplateForRole(record.rolle);
  if (!template) {
    throw new Error(`Unbekannte Rolle: ${record.rolle}`);
  }

  const [templatePdfBytes, fontBytes] = await Promise.all([
    loadTemplatePdfBytes(),
    loadFontBytes(),
  ]);

  const templateDoc = await PDFDocument.load(templatePdfBytes);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(fontBytes);
  const [embeddedPage] = await pdfDoc.embedPdf(templateDoc, [
    template.pdfPageIndex,
  ]);

  const page = pdfDoc.addPage([template.pageWidth, template.pageHeight]);
  page.drawPage(embeddedPage, {
    x: 0,
    y: 0,
    width: template.pageWidth,
    height: template.pageHeight,
  });

  const idNumber = record.id ?? String(options.startId);
  const mhdText = record.gueltig_bis
    ? `MHD-${record.gueltig_bis}`
    : `MHD-${options.mhd}`;
  const idLine = `${template.rolePrefix} / ID ${idNumber}`;

  const textFields: { key: keyof TemplateConfig["fields"]; value: string }[] = [
    { key: "vorname", value: record.vorname },
    { key: "nachname", value: record.nachname },
    { key: "bereich", value: record.bereich },
    { key: "rolle", value: record.rolle },
    { key: "id_line", value: idLine },
    { key: "mhd", value: mhdText },
  ];

  for (const { key, value } of textFields) {
    if (key === "photo") continue;
    const field = template.fields[key] as TextFieldConfig;
    drawFieldText(page, field, value, font, template.fontSize);
  }

  if (photoBytes) {
    const photoField = template.fields.photo;
    const prepared = await preparePhoto(
      photoBytes,
      photoField.width,
      photoField.height
    );
    const image =
      prepared.kind === "png"
        ? await pdfDoc.embedPng(prepared.bytes)
        : await pdfDoc.embedJpg(prepared.bytes);

    page.drawImage(image, {
      x: photoField.x,
      y: photoField.y,
      width: photoField.width,
      height: photoField.height,
    });
  }

  return pdfDoc.save();
}

export async function renderBadges(
  records: PersonRecord[],
  options: GenerateOptions,
  photos: Record<string, Buffer>
): Promise<{ filename: string; bytes: Uint8Array }[]> {
  const results: { filename: string; bytes: Uint8Array }[] = [];
  let nextId = options.startId;

  for (const record of records) {
    const id = record.id ?? String(nextId);
    const withId = { ...record, id };
    if (!record.id) nextId += 1;

    const photoKey = record.photoFilename.toLowerCase();
    const photoBytes = Object.entries(photos).find(
      ([name]) => name.toLowerCase() === photoKey
    )?.[1];

    const bytes = await renderBadge(withId, options, photoBytes);
    const safeName = `${record.nachname}_${record.vorname}`
      .replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, "_")
      .replace(/_+/g, "_");
    results.push({ filename: `${safeName}.pdf`, bytes });
  }

  return results;
}

export async function mergePdfs(
  pdfs: { bytes: Uint8Array }[]
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const { bytes } of pdfs) {
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }

  return merged.save();
}
