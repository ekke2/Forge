"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateProjectSettingsAction } from "@/lib/actions/projects";

export function GeneralSettings({
  projectId,
  name: initialName,
  description: initialDescription,
  canEdit,
}: {
  projectId: string;
  name: string;
  description: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== initialName || description !== (initialDescription ?? "");

  async function save() {
    setSaving(true);
    const res = await updateProjectSettingsAction(projectId, {
      name: name.trim(),
      description: description.trim() || null,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Settings saved");
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">General</h2>
        <p className="text-xs text-muted-foreground">
          Forge-owned project metadata. The connected repository can&apos;t be
          changed after creation.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Project name</Label>
        <Input
          id="p-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea
          id="p-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEdit}
          rows={2}
        />
      </div>
      {canEdit && (
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      )}
    </div>
  );
}
