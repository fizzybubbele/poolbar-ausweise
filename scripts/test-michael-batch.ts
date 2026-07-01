import fs from "fs/promises";
import path from "path";
import { parseDataFile } from "../lib/parsers/csv-xlsx";
import { PhotoZipStore } from "../lib/parsers/photo-zip";
import { renderBadges } from "../lib/pdf/renderer";
import { buildExportBundle } from "../lib/export";
import { getValidRecords, validateRecords } from "../lib/validation";

const XLSX_PATH =
  process.env.XLSX_PATH ??
  "/Users/mitch/Downloads/Ausweise_Schwung_1_2026_Michael.xlsx";
const ZIP_PATH =
  process.env.ZIP_PATH ??
  "/Users/mitch/Downloads/Fotos_Michael_komprimiert.zip";

async function main() {
  const outDir = path.join(process.cwd(), "tmp-test", "michael-batch");

  const dataBuffer = await fs.readFile(XLSX_PATH);
  const zipBuffer = await fs.readFile(ZIP_PATH);

  const records = parseDataFile(dataBuffer, path.basename(XLSX_PATH));
  const photoStore = await PhotoZipStore.open(zipBuffer);
  const errors = validateRecords(records, photoStore.photoNames(), true);
  const valid = getValidRecords(records, errors);

  console.log("Datensätze:", records.length);
  console.log("Gültig:", valid.length);
  console.log(
    "Fehler:",
    errors.filter((e) => e.severity === "error").length
  );

  if (errors.filter((e) => e.severity === "error").length > 0) {
    console.log("Erste Fehler:");
    for (const e of errors.filter((x) => x.severity === "error").slice(0, 5)) {
      console.log(`  Zeile ${e.rowIndex}: ${e.message}`);
    }
  }

  const options = { startId: 1001, mhd: "07/08/26" };
  const pdfs = await renderBadges(valid, options, photoStore);
  const { mergedPdf, zipBytes } = await buildExportBundle(pdfs);

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "ausweise.zip"), zipBytes!);
  await fs.writeFile(path.join(outDir, "ausweise_sammel.pdf"), mergedPdf!);

  console.log("Export:", outDir);
  console.log("PDFs:", pdfs.length);
}

main().catch(console.error);
