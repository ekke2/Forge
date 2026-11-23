"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitHubButton } from "@/components/auth/github-button";

export function SignUpForm({ redirect }: { redirect?: string | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: name || email.split("@")[0] },
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }
    // Local Supabase auto-confirms; hosted requires the e-mail link.
    if (data.session) {
      router.push(redirect || "/app");
      router.refresh();
    } else {
      router.push("/auth/sign-up-success");
    }
  }

  return (
    <div className="space-y-4">
      <GitHubButton redirect={redirect} />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-2xs uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={handleSignUp} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
