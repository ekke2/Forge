"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { upgradePlanAction, downgradePlanAction } from "@/lib/actions/billing";

export function BillingPanel({
  projectId,
  plan,
  memberCount,
  canManage,
}: {
  projectId: string;
  plan: "free" | "team";
  memberCount: number;
  canManage: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [working, setWorking] = useState(false);

  async function upgrade() {
    setWorking(true);
    const res = await upgradePlanAction(projectId);
    setWorking(false);
    setDialogOpen(false);
    if (res.ok) {
      toast.success("You're on the Team plan", {
        description: "Messaging, analytics and unlimited members are unlocked.",
      });
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  }

  async function downgrade() {
    const res = await downgradePlanAction(projectId);
    if (res.ok) {
      toast.success("Switched to the Free plan");
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Plan</h2>
          <p className="text-xs text-muted-foreground">
            Currently on{" "}
            <span className="font-medium text-foreground">
              {plan === "team" ? "Team" : "Free"}
            </span>{" "}
            · {memberCount} {memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        {plan === "team" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-2xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Team
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((key) => {
          const p = PLANS[key];
          const current = key === plan;
          return (
            <div
              key={key}
              className={cn(
                "rounded-md border p-4",
                current ? "border-primary bg-selected/40" : "border-border",
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.price}{" "}
                  <span className="text-2xs">
                    {p.cadence === "forever" ? "" : `/ ${p.cadence}`}
                  </span>
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-1.5 text-2xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              {canManage && (
                <div className="mt-4">
                  {current ? (
                    <Button size="xs" variant="outline" disabled className="w-full">
                      Current plan
                    </Button>
                  ) : key === "team" ? (
                    <Button
                      size="xs"
                      className="w-full"
                      onClick={() => setDialogOpen(true)}
                    >
                      Upgrade to Team
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      className="w-full"
                      onClick={downgrade}
                    >
                      Switch to Free
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-muted-foreground">
        This is a portfolio project — the upgrade is simulated. No payment
        details are collected and nothing is charged. A production build would
        run Stripe Checkout here and confirm via webhook.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Upgrade to Team</DialogTitle>
            <DialogDescription>
              {PLANS.team.price} per member / month. This demo doesn&apos;t
              collect a card — clicking confirm unlocks Team features
              immediately.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 text-sm">
            {PLANS.team.features.map((f) => (
              <li key={f} className="flex gap-2 text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upgrade} disabled={working}>
              {working && <Loader2 className="animate-spin" />}
              Confirm upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
