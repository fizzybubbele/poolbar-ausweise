# Poolbar Ausweis-Generator

Web-App zur automatischen Erstellung von **MA-** und **BL-Ausweisen** auf Basis der Vorlage `PB_Ausweise_2026_Vorlage.pdf` (1:1).

## Starten

```bash
npm install
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

## Ablauf

1. **Datendatei** hochladen (CSV, XLSX oder tab-separierte TXT)
2. **Foto-ZIP** hochladen (Dateinamen wie in Spalte `@Datei`)
3. Start-ID und MHD einstellen
4. Daten prüfen → Vorschau (1× MA + 1× BL) → Batch generieren
5. **ZIP** (Einzel-PDFs) oder **Sammel-PDF** herunterladen

## Erwartetes Datenformat

| Spalte    | Beispiel              |
|-----------|-----------------------|
| Nachname  | Abid                  |
| Vorname   | Sarra                 |
| Bereich   | Bauten                |
| Rolle     | MA oder BL            |
| @Datei    | abid_sarra.png        |

## Vorlagen

- Seite 1 der PDF → **MA**
- Seite 2 der PDF → **BL**

Die bereinigte Hintergrund-PDF (`assets/PB_Ausweise_2026_clean.pdf`) wird aus der Originalvorlage erzeugt:

```bash
python3 scripts/create-clean-template.py
```

Koordinaten liegen in `config/templates/ma-2026.json` und `bl-2026.json`.

Schrift: `assets/fonts/ABCCameraPlain-Medium.otf` (Originalschrift der InDesign-Vorlage).

## Test mit bestehenden Daten

```bash
npx tsx scripts/test-render.ts
```

Erzeugt Beispiel-PDFs in `tmp-test/`.
