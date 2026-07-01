import type { PersonRecord, ValidationError } from "@/lib/types";
import { getTemplateForRole } from "@/lib/pdf/templates";
import { isBlRole, isMaRole } from "@/lib/parsers/name-role";

export function validateRecords(
  records: PersonRecord[],
  photos: Record<string, Buffer>,
  requirePhotos = true
): ValidationError[] {
  const errors: ValidationError[] = [];
  const photoKeys = new Set(
    Object.keys(photos).map((name) => name.toLowerCase())
  );

  for (const record of records) {
    const row = record.rowIndex;

    if (!record.vorname.trim()) {
      errors.push({
        rowIndex: row,
        field: "Vorname",
        message: "Vorname fehlt",
        severity: "error",
      });
    }

    if (!record.nachname.trim()) {
      errors.push({
        rowIndex: row,
        field: "Nachname",
        message: "Nachname fehlt",
        severity: "error",
      });
    }

    if (!record.bereich.trim()) {
      errors.push({
        rowIndex: row,
        field: "Bereich",
        message: "Bereich fehlt",
        severity: "warning",
      });
    }

    if (!record.rolle.trim()) {
      errors.push({
        rowIndex: row,
        field: "Rolle",
        message: "Rolle fehlt",
        severity: "error",
      });
    } else if (!getTemplateForRole(record.rolle)) {
      errors.push({
        rowIndex: row,
        field: "Rolle",
        message: `Rolle „${record.rolle}" wird nicht unterstützt (MA, MA E, MA P oder BL)`,
        severity: "error",
      });
    }

    if (requirePhotos) {
      const photoName = record.photoFilename.trim();
      if (!photoName) {
        errors.push({
          rowIndex: row,
          field: "@Datei",
          message: "Foto-Dateiname fehlt",
          severity: "error",
        });
      } else if (!photoKeys.has(photoName.toLowerCase())) {
        errors.push({
          rowIndex: row,
          field: "@Datei",
          message: `Foto „${photoName}" nicht in ZIP gefunden`,
          severity: "error",
        });
      }
    }
  }

  return errors;
}

export function getValidRecords(
  records: PersonRecord[],
  errors: ValidationError[]
): PersonRecord[] {
  const errorRows = new Set(
    errors.filter((e) => e.severity === "error").map((e) => e.rowIndex)
  );
  return records.filter((r) => !errorRows.has(r.rowIndex));
}

export function pickPreviewRecords(
  records: PersonRecord[]
): PersonRecord[] {
  const ma = records.find((r) => isMaRole(r.rolle));
  const bl = records.find((r) => isBlRole(r.rolle));
  return [ma, bl].filter((r): r is PersonRecord => Boolean(r));
}
