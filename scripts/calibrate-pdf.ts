/**
 * Kalibrierungshilfe: Liest Textpositionen aus der PDF-Vorlage aus.
 * Ausführen mit: npm run calibrate
 * (Benötigt Python + PyMuPDF: pip install pymupdf)
 */
import { execSync } from "child_process";
import path from "path";

const pdfPath = path.join(
  process.cwd(),
  "assets",
  "PB_Ausweise_2026_Vorlage.pdf"
);

const script = `
import fitz, json
doc = fitz.open("${pdfPath.replace(/\\/g, "/")}")
for i, page in enumerate(doc):
    print(f"\\n=== Page {i+1} ===")
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") == 0:
            for line in b["lines"]:
                for span in line["spans"]:
                    t = span["text"].strip()
                    if t:
                        x0,y0,x1,y1 = span["bbox"]
                        print(f"  {t!r}: x={x0:.1f} yTop={y0:.1f} baseline={y1:.1f}")
doc.close()
`;

try {
  execSync(`python3 -c ${JSON.stringify(script)}`, { stdio: "inherit" });
} catch {
  console.error("PyMuPDF nicht verfügbar. Installieren: pip install pymupdf");
  process.exit(1);
}
