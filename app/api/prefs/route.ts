import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPrefs, setUserPrefs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const prefs = await getUserPrefs(session.user.id);
    return NextResponse.json({ prefs: prefs || {} });
  } catch (err) {
    console.error("GET /api/prefs failed:", err);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Preferences must be a JSON object" }, { status: 400 });
  }
  try {
    await setUserPrefs(session.user.id, body as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/prefs failed:", err);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
