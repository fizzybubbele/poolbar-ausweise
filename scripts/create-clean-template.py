#!/usr/bin/env python3
"""Erzeugt eine bereinigte PDF-Vorlage ohne Platzhaltertext."""
import fitz
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "PB_Ausweise_2026_Vorlage.pdf"
OUT = ROOT / "assets" / "PB_Ausweise_2026_clean.pdf"

REDACT_RECTS = [
    (99.5, 31.0, 165.0, 52.0),
    (99.5, 61.0, 155.0, 83.0),
    (30.0, 115.0, 90.0, 131.0),
    (192.0, 115.0, 255.0, 131.0),
]


def sample_fill(page: fitz.Page, rect: fitz.Rect) -> tuple[float, float, float]:
    pix = page.get_pixmap(dpi=200)
    x0, y0, x1, y1 = rect
    sx0 = int(x0 / page.rect.width * pix.width)
    sy0 = int(y0 / page.rect.height * pix.height)
    sx1 = int(x1 / page.rect.width * pix.width)
    sy_sample = max(0, int(y0 / page.rect.height * pix.height) - 3)
    colors = []
    for sx in range(sx0, max(sx0 + 1, sx1), max(1, (sx1 - sx0) // 5)):
        colors.append(pix.pixel(sx, sy_sample)[:3])
    r = sum(c[0] for c in colors) / len(colors) / 255
    g = sum(c[1] for c in colors) / len(colors) / 255
    b = sum(c[2] for c in colors) / len(colors) / 255
    return r, g, b


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
            rect = fitz.Rect(*coords)
            fill = sample_fill(page, rect)
            new_page.add_redact_annot(rect, fill=fill)
        new_page.apply_redactions()

    clean.save(OUT)
    print(f"Geschrieben: {OUT} ({clean.page_count} Seiten)")


if __name__ == "__main__":
    main()
