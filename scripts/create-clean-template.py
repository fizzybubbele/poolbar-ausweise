#!/usr/bin/env python3
"""Erzeugt eine bereinigte PDF-Vorlage ohne Platzhaltertext."""
import fitz
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "PB_Ausweise_2026_Vorlage.pdf"
OUT = ROOT / "assets" / "PB_Ausweise_2026_clean.pdf"

# Layout: Vorname/Nachname 9pt (9pt Abstand), Block +12pt, Bereich/Rolle 6pt ALLCAPS (9pt Abstand)
REDACT_RECTS = [
    (99.5, 31.0, 170.0, 53.0),   # Name-Block
    (99.5, 63.0, 170.0, 83.0),   # Bereich + Rolle
    (32.3, 116.6, 90.0, 129.4),
    (194.3, 116.6, 255.0, 129.4),
]


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Quelle fehlt: {SRC}")

    doc = fitz.open(SRC)
    clean = fitz.open()

    for i in range(len(doc)):
        page = doc[i]
        new_page = clean.new_page(width=page.rect.width, height=page.rect.height)
        new_page.show_pdf_page(page.rect, doc, i)
        for coords in REDACT_RECTS:
            new_page.add_redact_annot(fitz.Rect(*coords))
        new_page.apply_redactions()

    clean.save(OUT)
    print(f"Geschrieben: {OUT} ({clean.page_count} Seiten)")


if __name__ == "__main__":
    main()
