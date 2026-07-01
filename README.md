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

## Kostenlos online (ohne Vercel)

### Option A: Render.com (Free Tier, empfohlen)

Dauerhaft online, 0 €, deployt direkt aus GitHub.

1. Auf [render.com](https://render.com) registrieren (GitHub verbinden)
2. **New → Blueprint** → Repo `fizzybubbele/poolbar-ausweise` wählen
3. `render.yaml` wird automatisch erkannt → **Apply**

Fertig — URL z. B. `https://poolbar-ausweise.onrender.com`

| Free Tier | Limit |
|-----------|-------|
| Kosten | 0 € |
| RAM | 512 MB |
| Sleep | nach 15 Min. Inaktivität (erster Aufruf ~30 s) |
| Upload | für kleinere ZIPs OK, große Batches ggf. in Teilen |

Nach jedem Push auf `main` deployt Render automatisch neu.

---

### Option B: Cloudflare Tunnel (0 €, vom Mac)

App läuft lokal, bekommt eine **öffentliche HTTPS-URL** — ohne Server-Miete.

```bash
npm install
npm run build
npm start          # Terminal 1

# Terminal 2:
brew install cloudflared   # einmalig
npm run tunnel             # gibt *.trycloudflare.com URL aus
```

Oder mit Docker:

```bash
docker compose up -d --build
npm run tunnel
```

**Vorteil:** Daten bleiben auf eurem Rechner. **Nachteil:** Mac muss laufen.

Für feste Subdomain (z. B. `ausweise.poolbar.at`): [Cloudflare Tunnel Doku](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

---

### Option C: Docker auf free VPS (Oracle Cloud Always Free)

0 € VPS mit 4 ARM-Cores — für große Batches am stabilsten.

```bash
git clone git@github.com:fizzybubbele/poolbar-ausweise.git
cd poolbar-ausweise
docker compose up -d --build
```

[Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) → Ubuntu VM → Port 3000 (+ Firewall) → optional Caddy für HTTPS.

---

### Lokal testen (wie Produktion)

```bash
npm run build
npm start
```

### Docker lokal / auf eigenem Server

```bash
docker compose up -d --build
```

App auf **http://localhost:3000**
