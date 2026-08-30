import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const password = body.password || "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    // Check first so we can return a clean 409 instead of relying solely on
    // the DB's unique-constraint error (which we also still guard below in
    // case of a race between two concurrent signups for the same email).
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash);
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err: unknown) {
    // Postgres unique_violation — same race-condition guard mentioned above.
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
    }
    console.error("Signup failed:", err);
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
