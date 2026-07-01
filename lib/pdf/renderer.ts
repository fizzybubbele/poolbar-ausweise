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
import { displayRole } from "@/lib/parsers/name-role";

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

function formatFieldText(field: TextFieldConfig, text: string): string {
  return field.uppercase ? text.toUpperCase() : text;
}

function wrapTextByWords(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      current = word;
      continue;
    }

    let part = "";
    for (const char of word) {
      const next = part + char;
      if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
        part = next;
      } else {
        if (part) lines.push(part);
        part = char;
      }
    }
    current = part;
  }

  if (current) lines.push(current);
  return lines;
}

function wrapTextAtCommas(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const segments = text.split(/\s*,\s*/).filter(Boolean);
  if (segments.length <= 1) {
    return wrapTextByWords(text, font, fontSize, maxWidth);
  }

  const lines: string[] = [];
  let current = "";

  for (const segment of segments) {
    const candidate = current ? `${current}, ${segment}` : segment;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    if (font.widthOfTextAtSize(segment, fontSize) <= maxWidth) {
      current = segment;
    } else {
      lines.push(...wrapTextByWords(segment, font, fontSize, maxWidth));
      current = "";
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function wrapFieldText(
  field: TextFieldConfig,
  text: string,
  font: PDFFont,
  defaultFontSize: number
): string[] {
  const fontSize = field.fontSize ?? defaultFontSize;
  const maxWidth = field.maxWidth;
  const formatted = formatFieldText(field, text);

  if (!maxWidth) return [formatted];
  return wrapTextAtCommas(formatted, font, fontSize, maxWidth);
}

function drawTextLines(
  page: PDFPage,
  field: TextFieldConfig,
  lines: string[],
  font: PDFFont,
  defaultFontSize: number,
  baselineY: number
): number {
  const fontSize = field.fontSize ?? defaultFontSize;
  const lineHeight = field.lineHeight ?? fontSize;

  for (const [index, line] of lines.entries()) {
    page.drawText(line, {
      x: field.textX,
      y: baselineY - index * lineHeight,
      size: fontSize,
      font,
      color: toRgb(TEXT_BLACK),
    });
  }

  return baselineY - (lines.length - 1) * lineHeight;
}

function drawFieldText(
  page: PDFPage,
  field: TextFieldConfig,
  text: string,
  font: PDFFont,
  defaultFontSize: number,
  baselineY = field.textBaselineY
) {
  const lines = wrapFieldText(field, text, font, defaultFontSize);
  drawTextLines(page, field, lines, font, defaultFontSize, baselineY);
}

function drawBereichAndRolle(
  page: PDFPage,
  template: TemplateConfig,
  bereich: string,
  rolle: string,
  font: PDFFont
) {
  const bereichField = template.fields.bereich;
  const rolleField = template.fields.rolle;
  const bereichLines = wrapFieldText(
    bereichField,
    bereich,
    font,
    template.fontSize
  );
  const bereichLineHeight = bereichField.lineHeight ?? bereichField.fontSize ?? 6;
  const rolleGap = rolleField.lineHeight ?? rolleField.fontSize ?? 6;

  const bereichLastBaseline = drawTextLines(
    page,
    bereichField,
    bereichLines,
    font,
    template.fontSize,
    bereichField.textBaselineY
  );

  const rolleBaseline = bereichLastBaseline - rolleGap;
  drawFieldText(
    page,
    rolleField,
    rolle,
    font,
    template.fontSize,
    rolleBaseline
  );
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

  drawFieldText(page, template.fields.vorname, record.vorname, font, template.fontSize);
  drawFieldText(page, template.fields.nachname, record.nachname, font, template.fontSize);
  drawBereichAndRolle(
    page,
    template,
    record.bereich,
    displayRole(record.rolle),
    font
  );
  drawFieldText(page, template.fields.id_line, idLine, font, template.fontSize);
  drawFieldText(page, template.fields.mhd, mhdText, font, template.fontSize);

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
