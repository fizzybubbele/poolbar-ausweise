import fs from "fs/promises";
import path from "path";
import { parseDataFile } from "../lib/parsers/csv-xlsx";
import { renderBadge, mergePdfs } from "../lib/pdf/renderer";
import { validateRecords, getValidRecords } from "../lib/validation";

async function main() {
  const dataPath =
    "/Users/mitch/Library/CloudStorage/Dropbox/Projekte/Poolbar/poolbar2025/Daten/Ausweise/01/Ausweise.txt";
  const photoDir =
    "/Users/mitch/Library/CloudStorage/Dropbox/Projekte/Poolbar/poolbar2025/Daten/Ausweise/01";
  const outDir = path.join(process.cwd(), "tmp-test");

  const dataBuffer = await fs.readFile(dataPath);
  const records = parseDataFile(dataBuffer, "Ausweise.txt");

  const photos: Record<string, Buffer> = {};
  for (const record of records) {
    if (!record.photoFilename) continue;
    const photoPath = path.join(photoDir, record.photoFilename);
    try {
      photos[record.photoFilename] = await fs.readFile(photoPath);
    } catch {
      // skip missing
    }
  }

  const photoKeys = new Set(
    Object.keys(photos).map((name) => name.toLowerCase())
  );
  const errors = validateRecords(records, photoKeys, true);
  const valid = getValidRecords(records, errors);
  const ma = valid.find((r) => r.rolle.toUpperCase() === "MA");
  const bl = valid.find((r) => r.rolle.toUpperCase() === "BL");

  if (!ma || !bl) {
    console.error("MA or BL record not found", { ma: !!ma, bl: !!bl });
    process.exit(1);
  }

  const options = { startId: 1001, mhd: "07/08/26" };
  const maPdf = await renderBadge(
    { ...ma, id: "1001" },
    options,
    photos[ma.photoFilename]
  );
  const blPdf = await renderBadge(
    { ...bl, id: "2001" },
    options,
    photos[bl.photoFilename]
  );

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "test-ma.pdf"), maPdf);
  await fs.writeFile(path.join(outDir, "test-bl.pdf"), blPdf);
  const merged = await mergePdfs([
    { bytes: maPdf },
    { bytes: blPdf },
  ]);
  await fs.writeFile(path.join(outDir, "test-preview.pdf"), merged);

  console.log("Generated test PDFs in", outDir);
  console.log("MA:", ma.vorname, ma.nachname);
  console.log("BL:", bl.vorname, bl.nachname);
  console.log("Validation errors:", errors.filter((e) => e.severity === "error").length);
}

main().catch(console.error);
