"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GitHubButton({ redirect }: { redirect?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const params = new URLSearchParams();
    if (redirect) params.set("redirect", redirect);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${
          params.toString() ? `?${params}` : ""
        }`,
        scopes: "read:user user:email repo",
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signIn}
        disabled={loading}
      >
        <Github />
        {loading ? "Redirecting to GitHub…" : "Continue with GitHub"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">
          {error}. GitHub OAuth may not be configured for this environment — use
          e-mail below.
        </p>
      )}
    </div>
  );
}
