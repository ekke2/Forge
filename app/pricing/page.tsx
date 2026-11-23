import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Forge is free for solo projects. The Team plan unlocks collaboration for software teams of two or more.",
};

export default function PricingPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/">
            <Logo />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Simple pricing
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start free with a single project. When a second engineer joins,
            move to Team — billed per member.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
          {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((key) => {
            const plan = PLANS[key];
            const featured = key === "team";
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col rounded-lg border bg-card p-6",
                  featured ? "border-primary shadow-sm" : "border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    {plan.name}
                  </h2>
                  {featured && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-2xs font-medium text-primary">
                      For teams
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.blurb}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6"
                  variant={featured ? "default" : "outline"}
                >
                  <Link href="/auth/sign-up">
                    {featured ? "Start with Team" : "Start free"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-xs text-muted-foreground">
          This is a portfolio project: the Team upgrade is simulated — no card
          required, no charge. It demonstrates the paygate flow end to end.
        </p>
      </main>
    </div>
  );
}
