import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFOperator,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";
import sharp from "sharp";
import type {
  GenerateOptions,
  PersonRecord,
  QrFieldConfig,
  RgbColor,
  TemplateConfig,
  TextFieldConfig,
  TimetableLabelConfig,
} from "@/lib/types";
import {
  getTemplateForRole,
  loadFontBytes,
  loadTemplatePdfBytes,
} from "@/lib/pdf/templates";
import { generateQrPng } from "@/lib/pdf/qr";
import { displayRole } from "@/lib/parsers/name-role";
import { PhotoZipStore } from "@/lib/parsers/photo-zip";

type RenderContext = {
  templateDoc: PDFDocument;
  fontBytes: Buffer;
  qrCache: Map<string, Buffer>;
};

async function createRenderContext(): Promise<RenderContext> {
  const [templatePdfBytes, fontBytes] = await Promise.all([
    loadTemplatePdfBytes(),
    loadFontBytes(),
  ]);
  const templateDoc = await PDFDocument.load(templatePdfBytes);
  return { templateDoc, fontBytes, qrCache: new Map() };
}

function buildPhotoMap(photos: Record<string, Buffer>): Map<string, Buffer> {
  const map = new Map<string, Buffer>();
  for (const [name, bytes] of Object.entries(photos)) {
    map.set(name.toLowerCase(), bytes);
  }
  return map;
}

async function resolvePhotoBytes(
  photos: Record<string, Buffer> | PhotoZipStore,
  filename: string
): Promise<Buffer | undefined> {
  if (!filename.trim()) return undefined;
  if (photos instanceof PhotoZipStore) {
    return photos.getPhoto(filename);
  }
  const map = buildPhotoMap(photos);
  return map.get(filename.toLowerCase());
}

function safeBadgeFilename(record: PersonRecord): string {
  return `${record.nachname}_${record.vorname}`
    .replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, "_")
    .replace(/_+/g, "_");
}

async function renderBadgeWithContext(
  ctx: RenderContext,
  record: PersonRecord,
  options: GenerateOptions,
  photoBytes?: Buffer
): Promise<Uint8Array> {
  const template = getTemplateForRole(record.rolle);
  if (!template) {
    throw new Error(`Unbekannte Rolle: ${record.rolle}`);
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(ctx.fontBytes);
  const [embeddedPage] = await pdfDoc.embedPdf(ctx.templateDoc, [
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
  await drawQrAndTimetable(page, pdfDoc, ctx, template, font);

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

    const radius = photoField.borderRadius ?? 6;
    page.pushOperators(
      pushGraphicsState(),
      ...roundedRectClipOperators(
        photoField.x,
        photoField.y,
        photoField.width,
        photoField.height,
        radius
      )
    );
    page.drawImage(image, {
      x: photoField.x,
      y: photoField.y,
      width: photoField.width,
      height: photoField.height,
    });
    page.pushOperators(popGraphicsState());
  }

  return pdfDoc.save();
}

function toRgb(color: RgbColor) {
  return rgb(color.r, color.g, color.b);
}

const PT_PER_INCH = 72;
/** Embedded photo resolution — ~300 DPI for the ~62×83 pt slot on print. */
const PHOTO_PRINT_DPI = 300;
const PHOTO_JPEG_QUALITY = 95;
/** Cubic-bezier approximation of a quarter circle (kappa). */
const BEZIER_KAPPA = 0.5522847498;

function roundedRectClipOperators(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): PDFOperator[] {
  const r = Math.min(radius, width / 2, height / 2);
  const k = BEZIER_KAPPA * r;

  return [
    moveTo(x + r, y),
    lineTo(x + width - r, y),
    appendBezierCurve(
      x + width - r + k,
      y,
      x + width,
      y + r - k,
      x + width,
      y + r
    ),
    lineTo(x + width, y + height - r),
    appendBezierCurve(
      x + width,
      y + height - r + k,
      x + width - r + k,
      y + height,
      x + width - r,
      y + height
    ),
    lineTo(x + r, y + height),
    appendBezierCurve(
      x + r - k,
      y + height,
      x,
      y + height - r + k,
      x,
      y + height - r
    ),
    lineTo(x, y + r),
    appendBezierCurve(x, y + r - k, x + r - k, y, x + r, y),
    closePath(),
    clip(),
    endPath(),
  ];
}

async function preparePhoto(
  photoBytes: Buffer,
  width: number,
  height: number
): Promise<{ bytes: Buffer; kind: "png" | "jpg" }> {
  const scale = PHOTO_PRINT_DPI / PT_PER_INCH;
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);

  const meta = await sharp(photoBytes).rotate().metadata();
  const hasAlpha = meta.hasAlpha === true;

  const pipeline = sharp(photoBytes)
    .rotate()
    .resize(pixelWidth, pixelHeight, {
      fit: "cover",
      position: "centre",
    });

  if (hasAlpha) {
    const png = await pipeline.png({ compressionLevel: 6 }).toBuffer();
    return { bytes: png, kind: "png" };
  }

  const jpg = await pipeline
    .jpeg({ quality: PHOTO_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  return { bytes: jpg, kind: "jpg" };
}

const TEXT_BLACK: RgbColor = { r: 0, g: 0, b: 0 };
/** Dark navy used for QR modules and timetable label in the template. */
const TEXT_NAVY: RgbColor = {
  r: 0.085267,
  g: 0.108766,
  b: 0.156207,
};

async function getCachedQrPng(
  ctx: RenderContext,
  qr: QrFieldConfig
): Promise<Buffer> {
  const key = `${qr.url}:${qr.size}`;
  const cached = ctx.qrCache.get(key);
  if (cached) return cached;

  const png = await generateQrPng(qr.url, qr.size);
  ctx.qrCache.set(key, png);
  return png;
}

async function drawQrAndTimetable(
  page: PDFPage,
  pdfDoc: PDFDocument,
  ctx: RenderContext,
  template: TemplateConfig,
  font: PDFFont
) {
  const qrField = template.fields.qr;
  const labelField = template.fields.timetable;

  const qrPng = await getCachedQrPng(ctx, qrField);
  const qrImage = await pdfDoc.embedPng(qrPng);

  page.drawImage(qrImage, {
    x: qrField.x,
    y: qrField.y,
    width: qrField.size,
    height: qrField.size,
  });

  drawTimetableLabel(page, labelField, font);
}

function drawTimetableLabel(
  page: PDFPage,
  field: TimetableLabelConfig,
  font: PDFFont
) {
  page.drawText(field.text, {
    x: field.textX,
    y: field.textBaselineY,
    size: field.fontSize,
    font,
    color: toRgb(TEXT_NAVY),
  });
}

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

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const candidate = current ? `${current}, ${segment}` : segment;

    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(`${current},`);

    if (font.widthOfTextAtSize(segment, fontSize) <= maxWidth) {
      current = segment;
    } else {
      const wrapped = wrapTextByWords(segment, font, fontSize, maxWidth);
      for (let j = 0; j < wrapped.length - 1; j++) {
        lines.push(wrapped[j]);
      }
      current = wrapped[wrapped.length - 1] ?? "";
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
  const ctx = await createRenderContext();
  return renderBadgeWithContext(ctx, record, options, photoBytes);
}

export async function renderBadges(
  records: PersonRecord[],
  options: GenerateOptions,
  photos: Record<string, Buffer> | PhotoZipStore
): Promise<{ filename: string; bytes: Uint8Array }[]> {
  const ctx = await createRenderContext();
  const results: { filename: string; bytes: Uint8Array }[] = [];
  let nextId = options.startId;

  for (const record of records) {
    const id = record.id ?? String(nextId);
    const withId = { ...record, id };
    if (!record.id) nextId += 1;

    const photoBytes = await resolvePhotoBytes(photos, record.photoFilename);
    const bytes = await renderBadgeWithContext(ctx, withId, options, photoBytes);
    results.push({ filename: `${safeBadgeFilename(withId)}.pdf`, bytes });
  }

  return results;
}

export async function renderBatchZip(
  records: PersonRecord[],
  options: GenerateOptions,
  photos: Record<string, Buffer> | PhotoZipStore
): Promise<{ zipBytes: Uint8Array; generatedCount: number }> {
  const JSZip = (await import("jszip")).default;
  const ctx = await createRenderContext();
  const zip = new JSZip();
  const includeMerged =
    process.env.RENDER !== "true" && records.length <= 40;
  const merged = includeMerged ? await PDFDocument.create() : null;
  let nextId = options.startId;
  let generatedCount = 0;

  for (const record of records) {
    const id = record.id ?? String(nextId);
    const withId = { ...record, id };
    if (!record.id) nextId += 1;

    const photoBytes = await resolvePhotoBytes(photos, record.photoFilename);
    const bytes = await renderBadgeWithContext(ctx, withId, options, photoBytes);
    zip.file(`${safeBadgeFilename(withId)}.pdf`, bytes);

    if (merged) {
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      for (const page of pages) {
        merged.addPage(page);
      }
    }

    generatedCount += 1;
  }

  if (merged) {
    zip.file("ausweise_sammel.pdf", await merged.save());
  } else if (process.env.RENDER === "true") {
    zip.file(
      "HINWEIS.txt",
      "Online-Export: Einzel-PDFs enthalten. Sammel-PDF lokal generieren oder in Teilen herunterladen."
    );
  }

  const zipBytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return { zipBytes, generatedCount };
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
