"use client";

import { useCallback, useMemo, useState } from "react";
import type { PersonRecord, ValidationError } from "@/lib/types";

type Step = "upload" | "review" | "done";

function downloadBase64(base64: string, filename: string, mime: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [step, setStep] = useState<Step>("upload");
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [photoZip, setPhotoZip] = useState<File | null>(null);
  const [startId, setStartId] = useState("1001");
  const [mhd, setMhd] = useState("07/08/26");
  const [records, setRecords] = useState<PersonRecord[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zipBase64, setZipBase64] = useState<string | null>(null);
  const [mergedBase64, setMergedBase64] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const errorCount = useMemo(
    () => errors.filter((e) => e.severity === "error").length,
    [errors]
  );
  const warningCount = useMemo(
    () => errors.filter((e) => e.severity === "warning").length,
    [errors]
  );

  const buildFormData = useCallback(
    (mode: string) => {
      const fd = new FormData();
      if (dataFile) fd.append("dataFile", dataFile);
      if (photoZip) fd.append("photoZip", photoZip);
      fd.append("startId", startId);
      fd.append("mhd", mhd);
      fd.append("mode", mode);
      return fd;
    },
    [dataFile, photoZip, startId, mhd]
  );

  const handleValidate = async () => {
    if (!dataFile) {
      setMessage("Bitte zuerst eine CSV- oder Excel-Datei hochladen.");
      return;
    }
    if (!photoZip) {
      setMessage("Bitte ein Foto-ZIP hochladen.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: buildFormData("validate"),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Validierung fehlgeschlagen");

      setRecords(data.records ?? []);
      setErrors(data.errors ?? []);
      setValidCount(data.validCount ?? 0);
      setPhotoCount(data.photoCount ?? 0);
      setStep("review");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setMessage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: buildFormData("preview"),
      });

      const validationHeader = res.headers.get("X-Validation-Errors");
      if (validationHeader) {
        setErrors(JSON.parse(validationHeader));
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Vorschau fehlgeschlagen");
      }

      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: buildFormData("batch"),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generierung fehlgeschlagen");

      setErrors(data.errors ?? []);
      setZipBase64(data.zipBase64 ?? null);
      setMergedBase64(data.mergedBase64 ?? null);
      setGeneratedCount(data.generatedCount ?? 0);
      setStep("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-widest text-lime-400/80">
          Poolbar 2026
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Ausweis-Generator
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-400">
          MA- und BL-Vorlagen aus{" "}
          <code className="text-neutral-300">PB_Ausweise_2026_Vorlage.pdf</code>{" "}
          — 1:1 mit Datenliste und Fotos befüllen.
        </p>
      </header>

      {message && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
          {message}
        </div>
      )}

      {step === "upload" && (
        <section className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Datendatei (CSV, XLSX, TXT)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={(e) => setDataFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-lime-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-lime-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Foto-ZIP
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setPhotoZip(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-100 hover:file:bg-neutral-700"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Spalte <code>@Datei</code> muss Dateinamen aus dem ZIP enthalten.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                Start-ID
              </label>
              <input
                type="number"
                value={startId}
                onChange={(e) => setStartId(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">
                MHD (z. B. 07/08/26)
              </label>
              <input
                type="text"
                value={mhd}
                onChange={(e) => setMhd(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleValidate}
            disabled={loading || !dataFile || !photoZip}
            className="rounded-lg bg-lime-500 px-5 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Prüfe…" : "Daten prüfen"}
          </button>
        </section>
      )}

      {step === "review" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="text-lg font-medium">Prüfergebnis</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Stat label="Datensätze" value={records.length} />
              <Stat label="Gültig" value={validCount} />
              <Stat label="Fehler" value={errorCount} tone="error" />
              <Stat label="Fotos im ZIP" value={photoCount} />
            </div>

            {errors.length > 0 && (
              <div className="mt-6 max-h-64 overflow-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-neutral-900 text-neutral-400">
                    <tr>
                      <th className="px-3 py-2">Zeile</th>
                      <th className="px-3 py-2">Feld</th>
                      <th className="px-3 py-2">Meldung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((err, i) => (
                      <tr
                        key={`${err.rowIndex}-${i}`}
                        className="border-t border-neutral-800/80"
                      >
                        <td className="px-3 py-2">{err.rowIndex}</td>
                        <td className="px-3 py-2">{err.field ?? "—"}</td>
                        <td
                          className={
                            err.severity === "error"
                              ? "px-3 py-2 text-red-300"
                              : "px-3 py-2 text-amber-300"
                          }
                        >
                          {err.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {warningCount > 0 && errorCount === 0 && (
              <p className="mt-4 text-sm text-amber-300">
                {warningCount} Warnung(en) — Generierung ist trotzdem möglich.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setStep("upload")}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm"
            >
              Zurück
            </button>
            <button
              onClick={handlePreview}
              disabled={loading || validCount === 0}
              className="rounded-lg border border-lime-500/50 px-4 py-2 text-sm text-lime-300 disabled:opacity-40"
            >
              {loading ? "Erstelle Vorschau…" : "Vorschau (1× MA + 1× BL)"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || validCount === 0}
              className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
            >
              {loading ? "Generiere…" : `${validCount} Ausweise generieren`}
            </button>
          </div>

          {previewUrl && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <h3 className="mb-3 text-sm font-medium text-neutral-300">
                Vorschau
              </h3>
              <iframe
                src={previewUrl}
                title="Ausweis-Vorschau"
                className="h-[420px] w-full rounded-lg border border-neutral-800 bg-white"
              />
            </div>
          )}
        </section>
      )}

      {step === "done" && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-lg font-medium">Fertig</h2>
          <p className="mt-2 text-neutral-400">
            {generatedCount} Ausweise wurden generiert.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {zipBase64 && (
              <button
                onClick={() =>
                  downloadBase64(zipBase64, "ausweise.zip", "application/zip")
                }
                className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-black"
              >
                ZIP herunterladen
              </button>
            )}
            {mergedBase64 && (
              <button
                onClick={() =>
                  downloadBase64(
                    mergedBase64,
                    "ausweise_sammel.pdf",
                    "application/pdf"
                  )
                }
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm"
              >
                Sammel-PDF herunterladen
              </button>
            )}
            <button
              onClick={() => {
                setStep("upload");
                setPreviewUrl(null);
                setZipBase64(null);
                setMergedBase64(null);
              }}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm"
            >
              Neuer Durchlauf
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "error";
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tone === "error" && value > 0 ? "text-red-400" : "text-neutral-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
