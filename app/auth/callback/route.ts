import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / PKCE callback. Exchanges the code for a session, then sends the user
 * on to wherever they were headed (default: the app, which routes to
 * onboarding when no project exists yet).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") || "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("Missing OAuth code")}`,
  );
}
