/**
 * Splittet "Victor Dölle" → { vorname: "Victor", nachname: "Dölle" }
 */
export function splitFullName(fullName: string): {
  vorname: string;
  nachname: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { vorname: "", nachname: "" };
  if (parts.length === 1) return { vorname: "", nachname: parts[0] };
  const nachname = parts[parts.length - 1];
  const vorname = parts.slice(0, -1).join(" ");
  return { vorname, nachname };
}

/**
 * MA, MA E, MA P → MA-Vorlage; BL → BL-Vorlage
 */
export function normalizeRole(rolle: string): "MA" | "BL" | null {
  const normalized = rolle.trim().toUpperCase();
  if (normalized === "BL") return "BL";
  if (normalized === "MA" || normalized.startsWith("MA ")) return "MA";
  return null;
}

export function isMaRole(rolle: string): boolean {
  return normalizeRole(rolle) === "MA";
}

export function isBlRole(rolle: string): boolean {
  return normalizeRole(rolle) === "BL";
}

/** Anzeige auf dem Ausweis: MA E / MA P → MA */
export function displayRole(rolle: string): string {
  const template = normalizeRole(rolle);
  return template ?? rolle.trim().toUpperCase();
}
