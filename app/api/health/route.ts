import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "local",
    qrUrl: "https://poolbar.at/programm",
  });
}
