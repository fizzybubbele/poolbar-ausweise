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

## Online deployen

### Vercel (schnellste Option)

1. Auf [vercel.com](https://vercel.com) mit GitHub einloggen
2. **Add New Project** → `fizzybubbele/poolbar-ausweise` importieren
3. Region **Frankfurt (fra1)** ist in `vercel.json` voreingestellt
4. **Deploy** — fertig

Empfohlen unter **Project → Settings → Deployment Protection** den **Passwortschutz** aktivieren (Personendaten).

| Plan | Upload-Limit | Batch-Dauer |
|------|--------------|-------------|
| Hobby (Free) | ~4,5 MB | max. 10 s |
| Pro | ~100 MB | max. 120 s (konfiguriert) |

Für große Foto-ZIPs und 100+ Ausweise: **Docker** oder Vercel **Pro**.

Nach Push auf `main` deployt Vercel automatisch neu.

### Docker (eigener Server)

```bash
git clone git@github.com:fizzybubbele/poolbar-ausweise.git
cd poolbar-ausweise
docker compose up -d --build
```

App läuft auf **http://localhost:3000** (Port in `docker-compose.yml` anpassbar).

Nur Image bauen:

```bash
docker build -t poolbar-ausweise .
docker run -p 3000:3000 poolbar-ausweise
```

Für HTTPS: nginx/Caddy als Reverse Proxy davor (z. B. `ausweise.poolbar.at`).

### Lokal wie Produktion testen

```bash
npm run build
npm start
```
