"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <p className="text-sm text-muted-foreground">
        If an account exists for <span className="text-foreground">{email}</span>,
        a password reset link is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleForgotPassword} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
