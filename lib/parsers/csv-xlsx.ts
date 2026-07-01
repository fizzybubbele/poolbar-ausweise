import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { PersonRecord } from "@/lib/types";

const COLUMN_ALIASES: Record<string, keyof Omit<PersonRecord, "rowIndex">> = {
  nachname: "nachname",
  vorname: "vorname",
  bereich: "bereich",
  rolle: "rolle",
  "@datei": "photoFilename",
  datei: "photoFilename",
  foto: "photoFilename",
  photo: "photoFilename",
  id: "id",
  gueltig_bis: "gueltig_bis",
  mhd: "gueltig_bis",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/^\ufeff/, "");
}

function mapRow(
  row: Record<string, string>,
  rowIndex: number
): PersonRecord | null {
  const mapped: Partial<PersonRecord> = { rowIndex };

  for (const [rawKey, value] of Object.entries(row)) {
    const key = normalizeHeader(rawKey);
    const field = COLUMN_ALIASES[key];
    if (field && value !== undefined) {
      mapped[field] = String(value).trim();
    }
  }

  if (
    !mapped.nachname &&
    !mapped.vorname &&
    !mapped.bereich &&
    !mapped.rolle
  ) {
    return null;
  }

  return {
    rowIndex,
    nachname: mapped.nachname ?? "",
    vorname: mapped.vorname ?? "",
    bereich: mapped.bereich ?? "",
    rolle: mapped.rolle ?? "",
    photoFilename: mapped.photoFilename ?? "",
    id: mapped.id,
    gueltig_bis: mapped.gueltig_bis,
  };
}

function parseDelimitedText(text: string): PersonRecord[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    delimitersToGuess: ["\t", ";", ",", "|"],
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(
      result.errors.map((e) => e.message).join("; ") || "CSV konnte nicht gelesen werden"
    );
  }

  return result.data
    .map((row, index) => mapRow(row, index + 2))
    .filter((row): row is PersonRecord => row !== null);
}

export function parseCsvBuffer(buffer: Buffer): PersonRecord[] {
  const text = buffer.toString("utf-8");
  return parseDelimitedText(text);
}

export function parseXlsxBuffer(buffer: Buffer): PersonRecord[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });

  return rows
    .map((row, index) => mapRow(row, index + 2))
    .filter((row): row is PersonRecord => row !== null);
}

export function parseDataFile(
  buffer: Buffer,
  filename: string
): PersonRecord[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return parseXlsxBuffer(buffer);
  }
  return parseCsvBuffer(buffer);
}

export async function extractPhotosFromZip(
  zipBuffer: Buffer
): Promise<Record<string, Buffer>> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(zipBuffer);
  const photos: Record<string, Buffer> = {};

  for (const [entryPath, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    const basename = entryPath.split("/").pop() ?? entryPath;
    const lower = basename.toLowerCase();
    if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(lower)) continue;
    photos[basename] = Buffer.from(await file.async("arraybuffer"));
  }

  return photos;
}

export function parseDataFileFromName(
  buffer: Buffer,
  filename: string
): PersonRecord[] {
  return parseDataFile(buffer, filename);
}
