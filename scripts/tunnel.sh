#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared fehlt. Installieren:"
  echo "  brew install cloudflared"
  exit 1
fi

if ! curl -sf http://127.0.0.1:3000/api/generate >/dev/null 2>&1; then
  echo "Starte App auf Port 3000 …"
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    docker compose up -d --build
  elif [ -f ".next/standalone/server.js" ]; then
    node .next/standalone/server.js &
  else
    echo "Bitte zuerst bauen: npm run build && npm start"
    echo "Oder Docker starten: docker compose up -d --build"
    exit 1
  fi
  echo "Warte auf App …"
  for _ in $(seq 1 30); do
    if curl -sf http://127.0.0.1:3000/api/generate >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

echo ""
echo "Öffentliche URL (kostenlos, temporär):"
echo "  cloudflared gibt eine *.trycloudflare.com Adresse aus"
echo ""
exec cloudflared tunnel --url http://127.0.0.1:3000
